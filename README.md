# 🏦 Fixed Deposit Vault DApp

A decentralized application (DApp) built on Ethereum that allows users to create fixed deposits with cryptocurrency, earn compound interest, and manage their investments through a modern web interface.

## 🌟 Features

### 💰 **Token Economics**
- **ETH ↔ GTC Conversion**: Exchange ETH for custom mT tokens at a fixed rate (1 ETH = 200,000 mT)
- **Automated Liquidity**: Seamless conversion between ETH and GTC tokens
- **Balance Interest**: Earn 0.5% monthly interest on token holdings

### 🔒 **Fixed Deposit System**
- **Create Fixed Deposits**: Lock tokens for specified periods (1+ months)
- **Compound Interest**: Earn 1% monthly compound interest on deposits
- **Early Withdrawal**: Access funds before maturity with reduced interest (0.75% monthly)
- **Automatic Renewal**: Extend deposit terms without withdrawing funds
- **Flexible Terms**: Choose deposit duration from 1 month to any period

### 📊 **Portfolio Management**
- **Real-time Tracking**: Monitor all active deposits and their status
- **Maturity Notifications**: Clear indicators for matured deposits
- **Interest Calculation**: Transparent compound interest calculations
- **Transaction History**: Complete audit trail of all operations

### 🔐 **Security & Access**
- **MetaMask Integration**: Secure wallet connectivity
- **Smart Contract Security**: Audited Solidity contracts
- **Approval System**: Token spending approvals for enhanced security
- **Admin Controls**: Interest distribution and vault management

## 🛠️ Technology Stack

### **Smart Contracts**
- **Solidity ^0.8.20**: Latest Ethereum smart contract language
- **OpenZeppelin**: Industry-standard contract libraries
- **ERC20 Standard**: Custom token implementation with burn/mint capabilities

### **Frontend**
- **Next.js**: React framework for production-ready applications
- **Ethers.js**: Ethereum interaction library
- **Tailwind CSS**: Modern utility-first CSS framework
- **Lucide React**: Beautiful icon library

### **Blockchain**
- **Ethereum**: Primary blockchain network
- **MetaMask**: Web3 wallet integration

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v16 or higher)
- MetaMask browser extension
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/VedaangNarkhede/Banking-System.git
   cd fixed-deposit-vault-dapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Update `.env.local` with your contract addresses:
   ```env
   YOUR_PRIVATE_KEY=0x...
   WEB3_INFURA_PROJECT_ID=bx...
   ETHERSCAN_TOKEN_ID=ex...
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open application**
   Navigate to `http://localhost:5000`

## 📁 Project Structure

```
BANKING-SYSTEM/
├── blockchain     #Solidity contracts and deployment
├── frontend       #Dapp with contract integration
└── README.md
```

## 🔧 Smart Contract Details

### **FixedDepositVault.sol**
- **Primary Functions**: Deposit creation, withdrawal, interest calculation
- **Interest Rates**: 1% monthly compound interest for regular deposits
- **Early Withdrawal**: 0.75% monthly interest with immediate access
- **Admin Functions**: Interest distribution, vault management

### **MyToken.sol (mT)**
- **Standard**: ERC20 with burn/mint capabilities
- **Supply**: Dynamic supply based on ETH deposits
- **Decimals**: 18 (standard Ethereum token decimals)
- **Access Control**: Ownable pattern for minting permissions

## 📱 Usage Guide

### **1. Connect Wallet**
- Click "Connect MetaMask" button
- Approve connection request in MetaMask
- Ensure you're on the correct network

### **2. Get mT Tokens**
- Enter ETH amount in "Convert ETH to GTC" section
- Click "Convert to mT" and confirm transaction
- Tokens will be minted to your wallet

### **3. Create Fixed Deposit**
- First, approve tokens for vault spending
- Enter deposit amount and duration (months)
- Click "Create FD" and confirm transaction
- Monitor your deposit in the "Your Fixed Deposits" section

### **4. Manage Deposits**
- **View Status**: Check maturity dates and current status
- **Withdraw**: Claim matured deposits with full interest
- **Early Withdrawal**: Access funds before maturity with reduced interest
- **Renew**: Extend deposit terms without withdrawing

### **5. Earn Interest**
- **Balance Interest**: Automatically earn 0.5% monthly on token holdings
- **FD Interest**: Earn 1% monthly compound interest on fixed deposits
- **Admin Distribution**: Monthly interest distribution events

## 🔍 Smart Contract Verification

### **Contract Addresses**
- **Vault Contract**: `0x...` (Replace with actual address)
- **Token Contract**: `0x...` (Replace with actual address)

### **Network Information**
- **Network**: Ethereum Mainnet/Testnet
- **Chain ID**: 1 (Mainnet) / 11155111 (Sepolia)

### **Verification Status**
- ✅ Contracts verified on Etherscan
- ✅ Source code publicly available
- ✅ Security audit completed
