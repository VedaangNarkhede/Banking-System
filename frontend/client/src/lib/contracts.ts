import { Contract } from "ethers";
import { web3Service } from "./web3";

// Replace with your deployed contract addresses
const VAULT_ADDRESS = "0xb3084451C784c62bAfeEC572B1FF0e5f5CFAD930"; // Placeholder - replace with actual deployed address

// Import ABIs
import vaultABI from "../assets/fixeddepositvault.json";
import tokenABI from "../assets/mytoken.json";

export interface FixedDepositData {
  amount: string;
  startTime: string;
  maturityPeriod: string;
  withdrawn: boolean;
  renewed: boolean;
}

export class ContractService {
  private vaultContract: Contract | null = null;
  private tokenContract: Contract | null = null;
  private demoMode: boolean = false;
  private demoData = {
    tokenBalance: "50000",
    ethBalance: "2.5",
    fixedDeposits: [] as FixedDepositData[]
  };

  async initialize() {
    const signer = web3Service.getSigner();
    if (!signer) throw new Error("Wallet not connected");

    // Check if contracts are deployed
    if (VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      console.log("Running in demo mode - contracts not deployed");
      this.demoMode = true;
      return;
    }

    try {
      // Initialize vault contract
      this.vaultContract = new Contract(VAULT_ADDRESS, vaultABI.abi, signer);

      // Get token address from vault and initialize token contract
      const tokenAddress = await this.vaultContract.myToken();
      this.tokenContract = new Contract(tokenAddress, tokenABI.abi, signer);
      this.demoMode = false;
    } catch (error) {
      console.error("Contract initialization failed, falling back to demo mode:", error);
      this.demoMode = true;
    }
  }

  // Token Operations
  async getTokenBalance(address: string): Promise<string> {
    if (this.demoMode) {
      return this.demoData.tokenBalance;
    }
    if (!this.tokenContract) throw new Error("Contracts not initialized");
    const balance = await this.tokenContract.balanceOf(address);
    return web3Service.formatTokenAmount(balance.toString());
  }

  async getVaultTokenBalance(): Promise<string> {
    if (this.demoMode) {
      return "1000000";
    }
    if (!this.tokenContract) throw new Error("Contracts not initialized");
    const balance = await this.tokenContract.balanceOf(VAULT_ADDRESS);
    return web3Service.formatTokenAmount(balance.toString());
  }

  async getVaultETHBalance(): Promise<string> {
    if (this.demoMode) {
      return this.demoData.ethBalance;
    }
    if (!this.vaultContract) throw new Error("Contracts not initialized");
    const balance = await this.vaultContract.getVaultETHBalance();
    return web3Service.formatEthAmount(balance.toString());
  }

  async getAllowance(owner: string): Promise<string> {
    if (this.demoMode) {
      return "10000";
    }
    if (!this.tokenContract) throw new Error("Contracts not initialized");
    const allowance = await this.tokenContract.allowance(owner, VAULT_ADDRESS);
    return web3Service.formatTokenAmount(allowance.toString());
  }

  // Conversion Operations
  async convertETHtoMT(ethAmount: string): Promise<any> {
    if (this.demoMode) {
      const ethNum = parseFloat(ethAmount);
      const mtTokens = ethNum * 200000;
      this.demoData.tokenBalance = (parseFloat(this.demoData.tokenBalance) + mtTokens).toString();
      return { wait: async () => ({ transactionHash: "0xdemo123..." }) };
    }
    if (!this.vaultContract) throw new Error("Contracts not initialized");
    const ethValue = web3Service.parseEthAmount(ethAmount);
    return await this.vaultContract.ETHtomT({ value: ethValue });
  }

  async convertMTtoETH(tokenAmount: string): Promise<any> {
    if (this.demoMode) {
      const mtNum = parseFloat(tokenAmount);
      const ethAmount = mtNum / 200000;
      this.demoData.tokenBalance = (parseFloat(this.demoData.tokenBalance) - mtNum).toString();
      return { wait: async () => ({ transactionHash: "0xdemo456..." }) };
    }
    if (!this.vaultContract) throw new Error("Contracts not initialized");
    const amount = web3Service.parseTokenAmount(tokenAmount);
    return await this.vaultContract.mTtoETH(amount);
  }

  async approveTokens(amount: string): Promise<any> {
    if (this.demoMode) {
      return { wait: async () => ({ transactionHash: "0xdemo789..." }) };
    }
    if (!this.tokenContract) throw new Error("Contracts not initialized");
    const tokenAmount = web3Service.parseTokenAmount(amount);
    return await this.tokenContract.approve(VAULT_ADDRESS, tokenAmount);
  }

  // Fixed Deposit Operations
  async createFixedDeposit(tokenAmount: string, months: number): Promise<any> {
    if (this.demoMode) {
      const newFD: FixedDepositData = {
        amount: tokenAmount,
        startTime: Math.floor(Date.now() / 1000).toString(),
        maturityPeriod: (months * 30 * 24 * 60 * 60).toString(),
        withdrawn: false,
        renewed: false
      };
      this.demoData.fixedDeposits.push(newFD);
      this.demoData.tokenBalance = (parseFloat(this.demoData.tokenBalance) - parseFloat(tokenAmount)).toString();
      return { wait: async () => ({ transactionHash: "0xdemofd..." }) };
    }
    if (!this.vaultContract) throw new Error("Contracts not initialized");
    const amount = web3Service.parseTokenAmount(tokenAmount);
    return await this.vaultContract.createFD(amount, months);
  }

  async getFixedDeposits(userAddress: string): Promise<FixedDepositData[]> {
    if (this.demoMode) {
      return this.demoData.fixedDeposits;
    }
    if (!this.vaultContract) throw new Error("Contracts not initialized");
    const fds = await this.vaultContract.getFDs(userAddress);
    return fds.map((fd: any) => ({
      amount: web3Service.formatTokenAmount(fd.amount.toString()),
      startTime: fd.startTime.toString(),
      maturityPeriod: fd.maturityPeriod.toString(),
      withdrawn: fd.withdrawn,
      renewed: fd.renewed
    }));
  }

  async withdrawFixedDeposit(index: number): Promise<any> {
    if (this.demoMode) {
      const fd = this.demoData.fixedDeposits[index];
      if (fd && !fd.withdrawn) {
        fd.withdrawn = true;
        const interest = this.calculateInterest(fd.amount, 1, parseInt(fd.maturityPeriod) / (30 * 24 * 60 * 60));
        this.demoData.tokenBalance = (parseFloat(this.demoData.tokenBalance) + parseFloat(fd.amount) + parseFloat(interest)).toString();
      }
      return { wait: async () => ({ transactionHash: "0xdemowd..." }) };
    }
    if (!this.vaultContract) throw new Error("Contracts not initialized");
    return await this.vaultContract.withdrawFD(index);
  }

  async earlyWithdrawFixedDeposit(index: number): Promise<any> {
    if (this.demoMode) {
      const fd = this.demoData.fixedDeposits[index];
      if (fd && !fd.withdrawn) {
        fd.withdrawn = true;
        // Early withdrawal with penalty - 75% of normal rate
        const timeElapsed = Date.now() / 1000 - parseInt(fd.startTime);
        const monthsElapsed = timeElapsed / (30 * 24 * 60 * 60);
        const interest = this.calculateInterest(fd.amount, 0.75, monthsElapsed);
        this.demoData.tokenBalance = (parseFloat(this.demoData.tokenBalance) + parseFloat(fd.amount) + parseFloat(interest)).toString();
      }
      return { wait: async () => ({ transactionHash: "0xdemoewd..." }) };
    }
    if (!this.vaultContract) throw new Error("Contracts not initialized");
    return await this.vaultContract.earlyWithdrawFD(index);
  }

  async renewFixedDeposit(index: number, newMonths: number): Promise<any> {
    if (this.demoMode) {
      const fd = this.demoData.fixedDeposits[index];
      if (fd && !fd.withdrawn) {
        fd.startTime = Math.floor(Date.now() / 1000).toString();
        fd.maturityPeriod = (newMonths * 30 * 24 * 60 * 60).toString();
        fd.renewed = true;
      }
      return { wait: async () => ({ transactionHash: "0xdemorenew..." }) };
    }
    if (!this.vaultContract) throw new Error("Contracts not initialized");
    return await this.vaultContract.renewFD(index, newMonths);
  }

  // Transfer Operations
  async transferTokens(recipient: string, amount: string): Promise<any> {
    if (this.demoMode) {
      this.demoData.tokenBalance = (parseFloat(this.demoData.tokenBalance) - parseFloat(amount)).toString();
      return { wait: async () => ({ transactionHash: "0xdemotx..." }) };
    }
    if (!this.tokenContract) throw new Error("Contracts not initialized");
    const tokenAmount = web3Service.parseTokenAmount(amount);
    return await this.tokenContract.transferToUser(recipient, tokenAmount);
  }

  // Interest Operations
  async distributeMonthlyInterest(): Promise<any> {
    if (this.demoMode) {
      const interest = parseFloat(this.demoData.tokenBalance) * 0.005; // 0.5% monthly
      this.demoData.tokenBalance = (parseFloat(this.demoData.tokenBalance) + interest).toString();
      return { wait: async () => ({ transactionHash: "0xdemointerest..." }) };
    }
    if (!this.vaultContract) throw new Error("Contracts not initialized");
    return await this.vaultContract.distributeMonthlyInterest();
  }

  // Utility functions
  calculateMaturityDate(startTime: string, maturityPeriod: string): Date {
    const start = new Date(parseInt(startTime) * 1000);
    const period = parseInt(maturityPeriod) * 1000;
    return new Date(start.getTime() + period);
  }

  isMatured(startTime: string, maturityPeriod: string): boolean {
    const maturityDate = this.calculateMaturityDate(startTime, maturityPeriod);
    return new Date() >= maturityDate;
  }

  calculateInterest(principal: string, rate: number, months: number): string {
    const principalNum = parseFloat(principal);
    const multiplier = 1 + (rate / 100);
    const compoundFactor = Math.pow(multiplier, months);
    const totalAmount = principalNum * compoundFactor;
    return (totalAmount - principalNum).toFixed(2);
  }

  isDemoMode(): boolean {
    return this.demoMode;
  }
}

export const contractService = new ContractService();
