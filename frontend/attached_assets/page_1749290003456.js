"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, Contract, parseEther, parseUnits } from "ethers";

// Replace with your deployed vault address
const VAULT_ADDRESS = "0x52e1d2b03D0434D7acC42308d38591A7A1E7163a";

// Load ABIs (make sure these JSON files exist under `/abi/`)
const vaultJSON = require("../../abi/fixeddepositvault.json");
const vaultABI  = vaultJSON.abi;

const tokenJSON = require("../../abi/mytoken.json");
const tokenABI  = tokenJSON.abi;

export default function Homepage() {
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const [vaultContract, setVaultContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);

  // ─── User Inputs ───────────────────────────────────────────────────────────────
  const [ethToTokenValue, setEthToTokenValue] = useState(""); // in ETH
  const [tokenToEthValue, setTokenToEthValue] = useState(""); // in tokens (18 decimals)

  const [approveAmount, setApproveAmount] = useState(""); // for vault approvals

  const [fdTokenAmount, setFdTokenAmount] = useState(""); // in tokens
  const [fdMonths, setFdMonths] = useState(""); // lock period in months

  const [recipient, setRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState(""); // in tokens

  // ─── On‐chain Retrievals ────────────────────────────────────────────────────────
  const [userBalance, setUserBalance] = useState("0"); // user's mT balance
  const [vaultBalance, setVaultBalance] = useState("0"); // vault's mT balance
  const [vaultETH, setVaultETH] = useState("0"); // vault's ETH balance
  const [fixedDeposits, setFixedDeposits] = useState([]); // array of FD structs

  // ─── Initialize / Wallet Connect ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", () => connectWallet());
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this dApp.");
      return;
    }
    try {
      const _provider = new BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const _signer = await _provider.getSigner();
      const userAddress = await _signer.getAddress();

      // Instantiate the vault contract
      const _vault = new Contract(VAULT_ADDRESS, vaultABI, _signer);

      // Fetch the token address from vault
      const tokenAddress = await _vault.myToken();
      // Instantiate the token contract
      const _token = new Contract(tokenAddress, tokenABI, _signer);

      setWallet(userAddress);
      setProvider(_provider);
      setSigner(_signer);
      setVaultContract(_vault);
      setTokenContract(_token);

      // Load on‐chain data
      await fetchBalances(_vault, _token, userAddress);
      await fetchFDs(_vault, userAddress);
      await fetchVaultETH(_vault);
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet.");
    }
  };

  // ─── Fetch Balances & Data ───────────────────────────────────────────────────────
  const fetchBalances = async (_vault, _token, userAddress) => {
    try {
      const userBal = await _token.balanceOf(userAddress);
      const vaultBal = await _token.balanceOf(VAULT_ADDRESS);

      setUserBalance(userBal.toString());
      setVaultBalance(vaultBal.toString());
    } catch (err) {
      console.error("Error fetching balances:", err);
    }
  };

  const fetchVaultETH = async (_vault) => {
    try {
      const ethBal = await _vault.getVaultETHBalance();
      setVaultETH(ethBal.toString());
    } catch (err) {
      console.error("Error fetching vault ETH balance:", err);
    }
  };

  const fetchFDs = async (_vault, userAddress) => {
    try {
      const fds = await _vault.getFDs(userAddress);
      // fds is an array of structs: { amount, startTime, maturityPeriod, withdrawn, renewed }
      const parsed = fds.map((fd) => ({
        amount: fd.amount.toString(),
        startTime: fd.startTime.toString(),
        maturityPeriod: fd.maturityPeriod.toString(),
        withdrawn: fd.withdrawn,
        renewed: fd.renewed,
      }));
      setFixedDeposits(parsed);
    } catch (err) {
      console.error("Error fetching FDs:", err);
    }
  };

  // ─── UI Helpers ───────────────────────────────────────────────────────────────────
  const formatUnits = (bigNum) => {
    return (BigInt(bigNum) / BigInt(10 ** 18)).toString();
  };

  // ─── Actions ─────────────────────────────────────────────────────────────────────

  // 1. Convert ETH → mT tokens
  const handleETHtoMT = async () => {
    if (!vaultContract || !ethToTokenValue) return;
    try {
      // parseEther for ETH (will send this much ETH)
      const tx = await vaultContract.ETHtomT({ value: parseEther(ethToTokenValue) });
      await tx.wait();
      alert("Converted ETH to mT tokens!");
      await fetchBalances(vaultContract, tokenContract, wallet);
      await fetchVaultETH(vaultContract);
    } catch (err) {
      console.error(err);
      alert("Conversion failed.");
    }
  };

  // 2. Approve vault to spend user’s tokens
  const handleApprove = async () => {
    if (!tokenContract || !approveAmount) return;
    try {
      const amt = parseUnits(approveAmount, 18);
      const tx = await tokenContract.approve(VAULT_ADDRESS, amt);
      await tx.wait();
      alert("Approval successful!");
    } catch (err) {
      console.error(err);
      alert("Approval failed.");
    }
  };

  // 3. Convert mT tokens → ETH (requires prior approval)
  const handleMTtoETH = async () => {
    if (!vaultContract || !tokenToEthValue) return;
    try {
      const amt = parseUnits(tokenToEthValue, 18);
      // Must have approved vault for at least `amt`
      const tx = await vaultContract.mTtoETH(amt);
      await tx.wait();
      alert("Converted mT to ETH!");
      await fetchBalances(vaultContract, tokenContract, wallet);
      await fetchVaultETH(vaultContract);
    } catch (err) {
      console.error(err);
      alert("Conversion failed.");
    }
  };

  // 4. Create Fixed Deposit (requires approval)
  const handleCreateFD = async () => {
    if (!vaultContract || !fdTokenAmount || !fdMonths) return;
    try {
      const amt = parseUnits(fdTokenAmount, 18);
      // Make sure user has approved vault for at least `amt`
      const tx = await vaultContract.createFD(amt, Number(fdMonths));
      await tx.wait();
      alert("Fixed Deposit created!");
      await fetchBalances(vaultContract, tokenContract, wallet);
      await fetchFDs(vaultContract, wallet);
    } catch (err) {
      console.error(err);
      alert("FD creation failed.");
    }
  };

  // 5. Transfer mT tokens to another user
  const handleTransferTokens = async () => {
    if (!tokenContract || !recipient || !transferAmount) return;
    try {
      const amt = parseUnits(transferAmount, 18);
      // MyToken has `transferToUser` function
      const tx = await tokenContract.transferToUser(recipient, amt);
      await tx.wait();
      alert("Tokens sent!");
      await fetchBalances(vaultContract, tokenContract, wallet);
    } catch (err) {
      console.error(err);
      alert("Token transfer failed.");
    }
  };

  // 6. Withdraw FD after maturity
  const handleWithdrawFD = async (index) => {
    if (!vaultContract) return;
    try {
      const tx = await vaultContract.withdrawFD(index);
      await tx.wait();
      alert("FD withdrawn!");
      await fetchBalances(vaultContract, tokenContract, wallet);
      await fetchFDs(vaultContract, wallet);
    } catch (err) {
      console.error(err);
      alert("Withdrawal failed.");
    }
  };

  // 7. Early withdraw FD (penalties)
  const handleEarlyWithdraw = async (index) => {
    if (!vaultContract) return;
    try {
      const tx = await vaultContract.earlyWithdrawFD(index);
      await tx.wait();
      alert("Early withdrawal successful!");
      await fetchBalances(vaultContract, tokenContract, wallet);
      await fetchFDs(vaultContract, wallet);
    } catch (err) {
      console.error(err);
      alert("Early withdrawal failed.");
    }
  };

  // 8. Renew an existing FD
  const [renewFDIndex, setRenewFDIndex] = useState("");
  const [renewMonths, setRenewMonths] = useState("");

  const handleRenewFD = async () => {
    if (!vaultContract || renewFDIndex === "" || !renewMonths) return;
    try {
      const tx = await vaultContract.renewFD(Number(renewFDIndex), Number(renewMonths));
      await tx.wait();
      alert("FD renewed!");
      await fetchFDs(vaultContract, wallet);
    } catch (err) {
      console.error(err);
      alert("Renew failed.");
    }
  };

  // 9. Claim balance interest (monthly on token holdings)
  const handleClaimInterest = async () => {
    if (!vaultContract) return;
    try {
      const tx = await vaultContract.claimBalanceInterest();
      await tx.wait();
      alert("Interest claimed!");
      await fetchBalances(vaultContract, tokenContract, wallet);
    } catch (err) {
      console.error(err);
      alert("Claim failed.");
    }
  };

  // 10. Refresh Balances & FDs
  const handleRefresh = async () => {
    if (!vaultContract || !tokenContract) return;
    await fetchBalances(vaultContract, tokenContract, wallet);
    await fetchFDs(vaultContract, wallet);
    await fetchVaultETH(vaultContract);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center">DeFi Fixed Deposit Dashboard</h1>

      {/* ── Wallet Connect ───────────────────────────────────────────────── */}
      {!wallet ? (
        <div className="text-center">
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
          >
            Connect MetaMask
          </button>
        </div>
      ) : (
        <div className="bg-gray-100 p-4 rounded shadow">
          <p className="text-green-700 font-medium">Connected: {wallet}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 px-4 py-1 bg-yellow-400 rounded hover:bg-yellow-500"
          >
            Refresh Data
          </button>
        </div>
      )}

      {wallet && (
        <>
          {/* ── Display Balances ─────────────────────────────────────────────── */}
          <div className="bg-white p-4 rounded shadow space-y-2">
            <h2 className="text-xl font-semibold">Balances</h2>
            <p>
              Your mT Balance:{" "}
              <span className="font-medium">{formatUnits(userBalance)} mT</span>
            </p>
            <p>
              Vault’s mT Balance:{" "}
              <span className="font-medium">{formatUnits(vaultBalance)} mT</span>
            </p>
            <p>
              Vault’s ETH Balance:{" "}
              <span className="font-medium">
                {ethers.formatEther(vaultETH)} ETH
              </span>
            </p>
          </div>

          {/* ── 1. ETH → mT Conversion ─────────────────────────────────────── */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Convert ETH → mT</h2>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.001"
                placeholder="Amount in ETH"
                value={ethToTokenValue}
                onChange={(e) => setEthToTokenValue(e.target.value)}
                className="border px-3 py-1 rounded flex-1"
              />
              <button
                onClick={handleETHtoMT}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Convert
              </button>
            </div>
          </div>

          {/* ── 2. mT → ETH Conversion (Approval required) ─────────────── */}
          <div className="bg-white p-4 rounded shadow space-y-2">
            <h2 className="text-xl font-semibold mb-2">Convert mT → ETH</h2>

            {/* Approve Vault */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Approve mT Amount"
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
                className="border px-3 py-1 rounded flex-1"
              />
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Approve Vault
              </button>
            </div>

            {/* Convert after Approval */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Amount in mT"
                value={tokenToEthValue}
                onChange={(e) => setTokenToEthValue(e.target.value)}
                className="border px-3 py-1 rounded flex-1"
              />
              <button
                onClick={handleMTtoETH}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Convert
              </button>
            </div>
          </div>

          {/* ── 3. Create Fixed Deposit (Approval required) ──────────────── */}
          <div className="bg-white p-4 rounded shadow space-y-2">
            <h2 className="text-xl font-semibold mb-2">Create Fixed Deposit</h2>

            {/* Approve Vault */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Approve mT for FD"
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
                className="border px-3 py-1 rounded flex-1"
              />
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Approve Vault
              </button>
            </div>

            {/* Create FD */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="mT Amount"
                value={fdTokenAmount}
                onChange={(e) => setFdTokenAmount(e.target.value)}
                className="border px-3 py-1 rounded flex-1"
              />
              <input
                type="number"
                placeholder="Months"
                value={fdMonths}
                onChange={(e) => setFdMonths(e.target.value)}
                className="border px-3 py-1 rounded w-24"
              />
              <button
                onClick={handleCreateFD}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create FD
              </button>
            </div>
          </div>

          {/* ── 4. Transfer mT Tokens to Another User ─────────────────────── */}
          <div className="bg-white p-4 rounded shadow space-y-2">
            <h2 className="text-xl font-semibold mb-2">Transfer mT Tokens</h2>
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="border px-3 py-1 rounded w-full"
            />
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="number"
                placeholder="Amount in mT"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="border px-3 py-1 rounded flex-1"
              />
              <button
                onClick={handleTransferTokens}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Send
              </button>
            </div>
          </div>

          {/* ── 5. Existing Fixed Deposits ─────────────────────────────────── */}
          <div className="bg-white p-4 rounded shadow space-y-2">
            <h2 className="text-xl font-semibold mb-2">Your Fixed Deposits</h2>
            {fixedDeposits.length === 0 && <p>No FDs found.</p>}
            {fixedDeposits.map((fd, idx) => (
              <div
                key={idx}
                className="border-t pt-2 flex flex-col space-y-1 md:flex-row md:justify-between md:items-center"
              >
                <div>
                  <p>
                    <strong>Index:</strong> {idx}
                  </p>
                  <p>
                    <strong>Amount:</strong> {formatUnits(fd.amount)} mT
                  </p>
                  <p>
                    <strong>Start:</strong>{" "}
                    {new Date(Number(fd.startTime) * 1000).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Maturity:</strong>{" "}
                    {new Date(
                      (Number(fd.startTime) + Number(fd.maturityPeriod)) * 1000
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Withdrawn:</strong> {fd.withdrawn ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Renewed:</strong> {fd.renewed ? "Yes" : "No"}
                  </p>
                </div>

                <div className="flex space-x-2 mt-2 md:mt-0">
                  <button
                    onClick={() => handleWithdrawFD(idx)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Withdraw
                  </button>
                  <button
                    onClick={() => handleEarlyWithdraw(idx)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Early Withdraw
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── 6. Renew FD ───────────────────────────────────────────────────── */}
          <div className="bg-white p-4 rounded shadow space-y-2">
            <h2 className="text-xl font-semibold mb-2">Renew Fixed Deposit</h2>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="FD Index"
                value={renewFDIndex}
                onChange={(e) => setRenewFDIndex(e.target.value)}
                className="border px-3 py-1 rounded w-24"
              />
              <input
                type="number"
                placeholder="New Months"
                value={renewMonths}
                onChange={(e) => setRenewMonths(e.target.value)}
                className="border px-3 py-1 rounded w-24"
              />
              <button
                onClick={handleRenewFD}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Renew FD
              </button>
            </div>
          </div>

          {/* ── 7. Claim Balance Interest ──────────────────────────────────────── */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Claim Balance Interest</h2>
            <button
              onClick={handleClaimInterest}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Claim Interest
            </button>
          </div>
        </>
      )}
    </div>
  );
}
