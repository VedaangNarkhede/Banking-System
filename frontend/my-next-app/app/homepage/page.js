"use client"
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, DollarSign, TrendingUp, Clock, ArrowUpDown, RefreshCw, AlertCircle } from 'lucide-react';

// Contract ABIs (simplified for main functions)
const VAULT_ABI = [
  "function ETHtomT() external payable",
  "function mTtoETH(uint256 tokenAmount) external",
  "function createFD(uint256 _amount, uint256 _months) external",
  "function withdrawFD(uint256 _index) external",
  "function earlyWithdrawFD(uint256 _index) external",
  "function renewFD(uint256 _index, uint256 _newMonths) external",
  "function getFDs(address user) external view returns (tuple(uint256 amount, uint256 startTime, uint256 maturityPeriod, bool withdrawn, bool renewed)[] memory)",
  "function getVaultETHBalance() external view returns (uint256)",
  "function distributeMonthlyInterest() external",
  "function balan() public",
  "function bal() public view returns (uint256)",
  "function vault_bal() public view returns (uint256)",
  "function interestRate() public view returns (uint256)",
  "function earlyWithdrawalRate() public view returns (uint256)"
];

const TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)"
];

const FixedDepositDApp = () => {
  // State variables
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [vaultContract, setVaultContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Balances
  const [ethBalance, setEthBalance] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [vaultEthBalance, setVaultEthBalance] = useState('0');
  
  // Form states
  const [ethToConvert, setEthToConvert] = useState('');
  const [tokensToConvert, setTokensToConvert] = useState('');
  const [fdAmount, setFdAmount] = useState('');
  const [fdMonths, setFdMonths] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  
  // Fixed deposits
  const [fixedDeposits, setFixedDeposits] = useState([]);
  const [renewIndex, setRenewIndex] = useState('');
  const [renewMonths, setRenewMonths] = useState('');
  
  // Contract addresses (you'll need to update these with your deployed contract addresses)
  const VAULT_ADDRESS = "0xb3084451C784c62bAfeEC572B1FF0e5f5CFAD930"; // Replace with your vault contract address
  const TOKEN_ADDRESS = "0x7d2D191E04A267e165C8E61B69223cbCd4B5af94"; // Replace with your token contract address

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask not found. Please install MetaMask.');
        return;
      }

      setLoading(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);

      // Initialize contracts
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      
      setVaultContract(vault);
      setTokenContract(token);
      
      setError('');
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load balances and data
  const loadData = async () => {
    if (!provider || !account || !vaultContract || !tokenContract) return;

    try {
      setLoading(true);
      
      // Get ETH balance
      const ethBal = await provider.getBalance(account);
      setEthBalance(ethers.formatEther(ethBal));
      
      // Get token balance
      const tokenBal = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.formatEther(tokenBal));
      
      // Get vault ETH balance
      const vaultEthBal = await vaultContract.getVaultETHBalance();
      setVaultEthBalance(ethers.formatEther(vaultEthBal));
      
      // Get fixed deposits
      const fds = await vaultContract.getFDs(account);
      setFixedDeposits(fds);
      
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Convert ETH to mT
  const convertEthToTokens = async () => {
    if (!vaultContract || !ethToConvert) return;

    try {
      setLoading(true);
      const tx = await vaultContract.ETHtomT({
        value: ethers.parseEther(ethToConvert)
      });
      await tx.wait();
      setEthToConvert('');
      await loadData();
      setError('');
    } catch (err) {
      setError('ETH to mT conversion failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Convert mT to ETH
  const convertTokensToEth = async () => {
    if (!vaultContract || !tokensToConvert) return;

    try {
      setLoading(true);
      const amount = ethers.parseEther(tokensToConvert);
      const tx = await vaultContract.mTtoETH(amount);
      await tx.wait();
      setTokensToConvert('');
      await loadData();
      setError('');
    } catch (err) {
      setError('mT to ETH conversion failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Approve tokens
  const approveTokens = async () => {
    if (!tokenContract || !approveAmount) return;

    try {
      setLoading(true);
      const amount = ethers.parseEther(approveAmount);
      const tx = await tokenContract.approve(VAULT_ADDRESS, amount);
      await tx.wait();
      setApproveAmount('');
      setError('');
      alert('Tokens approved successfully!');
    } catch (err) {
      setError('Token approval failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create Fixed Deposit
  const createFixedDeposit = async () => {
    if (!vaultContract || !fdAmount || !fdMonths) return;

    try {
      setLoading(true);
      const amount = ethers.parseEther(fdAmount);
      const tx = await vaultContract.createFD(amount, parseInt(fdMonths));
      await tx.wait();
      setFdAmount('');
      setFdMonths('');
      await loadData();
      setError('');
    } catch (err) {
      setError('Fixed deposit creation failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Withdraw Fixed Deposit
  const withdrawFD = async (index) => {
    if (!vaultContract) return;

    try {
      setLoading(true);
      const tx = await vaultContract.withdrawFD(index);
      await tx.wait();
      await loadData();
      setError('');
    } catch (err) {
      setError('Withdrawal failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Early withdraw Fixed Deposit
  const earlyWithdrawFD = async (index) => {
    if (!vaultContract) return;

    try {
      setLoading(true);
      const tx = await vaultContract.earlyWithdrawFD(index);
      await tx.wait();
      await loadData();
      setError('');
    } catch (err) {
      setError('Early withdrawal failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Renew Fixed Deposit
  const renewFixedDeposit = async () => {
    if (!vaultContract || !renewIndex || !renewMonths) return;

    try {
      setLoading(true);
      const tx = await vaultContract.renewFD(parseInt(renewIndex), parseInt(renewMonths));
      await tx.wait();
      setRenewIndex('');
      setRenewMonths('');
      await loadData();
      setError('');
    } catch (err) {
      setError('Renewal failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Distribute monthly interest
  const distributeInterest = async () => {
    if (!vaultContract) return;

    try {
      setLoading(true);
      const tx = await vaultContract.distributeMonthlyInterest();
      await tx.wait();
      await loadData();
      setError('');
    } catch (err) {
      setError('Interest distribution failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  // Check if FD is matured
  const isFDMatured = (startTime, maturityPeriod) => {
    const maturityTime = Number(startTime) + Number(maturityPeriod);
    return Date.now() / 1000 >= maturityTime;
  };

  // Load data when wallet is connected
  useEffect(() => {
    if (account && vaultContract && tokenContract) {
      loadData();
    }
  }, [account, vaultContract, tokenContract]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Fixed Deposit Vault DApp
          </h1>
          <p className="text-lg text-gray-600">
            Create fixed deposits, earn interest, and manage your crypto investments
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {!account ? (
            <div className="text-center">
              <Wallet className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect MetaMask'}
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Connected Account</p>
                <p className="font-mono text-sm">{account}</p>
              </div>
              <button
                onClick={loadData}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {account && (
          <>
            {/* Balances */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                  <h3 className="font-semibold">ETH Balance</h3>
                </div>
                <p className="text-2xl font-bold">{parseFloat(ethBalance).toFixed(4)} ETH</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <h3 className="font-semibold">mT Balance</h3>
                </div>
                <p className="text-2xl font-bold">{parseFloat(tokenBalance).toFixed(2)} mT</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-6 h-6 text-purple-500" />
                  <h3 className="font-semibold">Vault ETH</h3>
                </div>
                <p className="text-2xl font-bold">{parseFloat(vaultEthBalance).toFixed(4)} ETH</p>
              </div>
            </div>

            {/* Token Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* ETH to mT Conversion */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5" />
                  Convert ETH to mT
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">ETH Amount</label>
                    <input
                      type="number"
                      step="0.001"
                      value={ethToConvert}
                      onChange={(e) => setEthToConvert(e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={convertEthToTokens}
                    disabled={loading || !ethToConvert}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Convert to mT
                  </button>
                  <p className="text-sm text-gray-500">Rate: 1 ETH = 200,000 mT</p>
                </div>
              </div>

              {/* mT to ETH Conversion */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5" />
                  Convert mT to ETH
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">mT Amount</label>
                    <input
                      type="number"
                      value={tokensToConvert}
                      onChange={(e) => setTokensToConvert(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={convertTokensToEth}
                    disabled={loading || !tokensToConvert}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Convert to ETH
                  </button>
                </div>
              </div>
            </div>

            {/* Token Approval */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Approve Tokens for Vault</h3>
              <div className="flex gap-4">
                <input
                  type="number"
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                  placeholder="Amount to approve"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={approveTokens}
                  disabled={loading || !approveAmount}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </div>

            {/* Create Fixed Deposit */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Create Fixed Deposit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (mT)</label>
                  <input
                    type="number"
                    value={fdAmount}
                    onChange={(e) => setFdAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Months</label>
                  <input
                    type="number"
                    value={fdMonths}
                    onChange={(e) => setFdMonths(e.target.value)}
                    placeholder="Duration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={createFixedDeposit}
                    disabled={loading || !fdAmount || !fdMonths}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Create FD
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Interest Rate: 1% per month (compound)</p>
            </div>

            {/* Fixed Deposits List */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Your Fixed Deposits</h3>
              {fixedDeposits.length === 0 ? (
                <p className="text-gray-500">No fixed deposits found.</p>
              ) : (
                <div className="space-y-4">
                  {fixedDeposits.map((fd, index) => {
                    const isMatured = isFDMatured(fd.startTime, fd.maturityPeriod);
                    const maturityDate = new Date((Number(fd.startTime) + Number(fd.maturityPeriod)) * 1000);
                    
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-semibold">{ethers.formatEther(fd.amount)} mT</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Start Date</p>
                            <p>{formatDate(fd.startTime)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Maturity</p>
                            <p>{maturityDate.toLocaleDateString()}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isMatured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isMatured ? 'Matured' : 'Active'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {!fd.withdrawn && (
                              <>
                                {isMatured ? (
                                  <button
                                    onClick={() => withdrawFD(index)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                  >
                                    Withdraw
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => earlyWithdrawFD(index)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                                  >
                                    Early Withdraw
                                  </button>
                                )}
                              </>
                            )}
                            {fd.withdrawn && (
                              <span className="text-gray-500 text-sm">Withdrawn</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Renew FD */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Renew Fixed Deposit</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">FD Index</label>
                  <input
                    type="number"
                    value={renewIndex}
                    onChange={(e) => setRenewIndex(e.target.value)}
                    placeholder="FD Index"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Duration (Months)</label>
                  <input
                    type="number"
                    value={renewMonths}
                    onChange={(e) => setRenewMonths(e.target.value)}
                    placeholder="Months"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={renewFixedDeposit}
                    disabled={loading || !renewIndex || !renewMonths}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Renew FD
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Functions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Admin Functions</h3>
              <button
                onClick={distributeInterest}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                Distribute Monthly Interest
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Distributes 0.5% monthly interest to all token holders
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FixedDepositDApp;