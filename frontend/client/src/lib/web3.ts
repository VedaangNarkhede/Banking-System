import { BrowserProvider, Contract, parseEther, parseUnits, formatUnits } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class Web3Service {
  private provider: BrowserProvider | null = null;
  private signer: any = null;
  private walletAddress: string | null = null;

  async connectWallet(): Promise<{ address: string; provider: BrowserProvider; signer: any }> {
    if (!window.ethereum) {
      throw new Error("Please install MetaMask to use this dApp.");
    }

    try {
      this.provider = new BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      this.signer = await this.provider.getSigner();
      this.walletAddress = await this.signer.getAddress();

      return {
        address: this.walletAddress,
        provider: this.provider,
        signer: this.signer
      };
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) throw new Error("Provider not initialized");
    const balance = await this.provider.getBalance(address);
    return formatUnits(balance, 18);
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null && this.walletAddress !== null;
  }

  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  getProvider(): BrowserProvider | null {
    return this.provider;
  }

  getSigner(): any {
    return this.signer;
  }

  async switchToNetwork(chainId: string): Promise<void> {
    if (!window.ethereum) throw new Error("MetaMask not found");
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error("Please add this network to MetaMask");
      }
      throw error;
    }
  }

  formatTokenAmount(amount: string, decimals = 18): string {
    return formatUnits(amount, decimals);
  }

  parseTokenAmount(amount: string, decimals = 18): bigint {
    return parseUnits(amount, decimals);
  }

  formatEthAmount(amount: string): string {
    return formatUnits(amount, 18);
  }

  parseEthAmount(amount: string): bigint {
    return parseEther(amount);
  }
}

export const web3Service = new Web3Service();
