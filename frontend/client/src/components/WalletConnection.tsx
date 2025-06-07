import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, RefreshCw } from "lucide-react";
import { web3Service } from "@/lib/web3";
import { contractService } from "@/lib/contracts";

interface WalletConnectionProps {
  onConnectionChange: (connected: boolean, address?: string) => void;
  onRefresh: () => void;
}

export function WalletConnection({ onConnectionChange, onRefresh }: WalletConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if already connected
    if (web3Service.isConnected()) {
      const address = web3Service.getWalletAddress();
      if (address) {
        setWalletAddress(address);
        setIsConnected(true);
        onConnectionChange(true, address);
      }
    }

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [onConnectionChange]);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      setIsConnected(false);
      setWalletAddress(null);
      onConnectionChange(false);
    } else {
      // User switched accounts
      setWalletAddress(accounts[0]);
      onConnectionChange(true, accounts[0]);
    }
  };

  const handleChainChanged = () => {
    // Reload the page on chain change
    window.location.reload();
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const { address } = await web3Service.connectWallet();
      await contractService.initialize();
      
      setWalletAddress(address);
      setIsConnected(true);
      onConnectionChange(true, address);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center space-x-4">
      {isConnected && walletAddress ? (
        <>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
            {formatAddress(walletAddress)}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      )}
    </div>
  );
}
