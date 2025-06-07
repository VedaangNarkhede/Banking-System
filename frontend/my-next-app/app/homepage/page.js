"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, Contract, parseEther } from "ethers";

const contractAddress = "0x52e1d2b03D0434D7acC42308d38591A7A1E7163a";
const contractABI = require("../../abi/FixedDepositVaultABI.json");

export default function Homepage() {
    const [wallet, setWallet] = useState(null);
    const [fdAmount, setFdAmount] = useState("");
    const [recipient, setRecipient] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [contract, setContract] = useState(null);

    useEffect(() => {
        if (typeof window.ethereum !== "undefined") {
            window.ethereum.on("accountsChanged", () => connectWallet());
        }
    }, []);

    const connectWallet = async () => {
        if (window.ethereum) {
            const provider = new BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const userWallet = await signer.getAddress();
            setWallet(userWallet);

            const fdContract = new Contract(contractAddress, contractABI, signer);
            setContract(fdContract);
        } else {
            alert("Please install MetaMask to use this app.");
        }
    };

    const createFD = async () => {
        if (!contract || !fdAmount) return;
        try {
            const amount = parseEther(fdAmount);
            const tx = await contract.createFD(amount);
            await tx.wait();
            alert("Fixed Deposit created successfully!");
        } catch (err) {
            console.error(err);
            alert("Transaction failed.");
        }
    };

    const transferTokens = async () => {
        if (!contract || !recipient || !transferAmount) return;
        try {
            const amount = parseEther(transferAmount);
            const tx = await contract.transferToUser(recipient, amount);
            await tx.wait();
            alert("Tokens transferred successfully!");
        } catch (err) {
            console.error(err);
            alert("Transfer failed.");
        }
    };

    return (
        <div className="p-10 space-y-6">
            <h1 className="text-3xl font-bold">DeFi Fixed Deposit Dashboard</h1>

            {!wallet ? (
                <button
                    onClick={connectWallet}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Connect Wallet
                </button>
            ) : (
                <p className="text-green-600">Connected: {wallet}</p>
            )}

            <div className="border p-4 rounded shadow">
                <h2 className="text-xl font-semibold mb-2">Create Fixed Deposit</h2>
                <input
                    type="number"
                    placeholder="Amount in Tokens"
                    value={fdAmount}
                    onChange={(e) => setFdAmount(e.target.value)}
                    className="border px-2 py-1 rounded mr-2"
                />
                <button onClick={createFD} className="bg-green-500 px-4 py-1 text-white rounded hover:bg-green-600">
                    Create FD
                </button>
            </div>

            <div className="border p-4 rounded shadow">
                <h2 className="text-xl font-semibold mb-2">Transfer Tokens</h2>
                <input
                    type="text"
                    placeholder="Recipient Address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="border px-2 py-1 rounded mb-2 w-full"
                />
                <input
                    type="number"
                    placeholder="Amount in Tokens"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="border px-2 py-1 rounded mr-2"
                />
                <button
                    onClick={transferTokens}
                    className="bg-purple-500 px-4 py-1 text-white rounded hover:bg-purple-600"
                >
                    Send Tokens
                </button>
            </div>
        </div>
    );
}
