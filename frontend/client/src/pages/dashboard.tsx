import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { University, Coins, PiggyBank, ArrowLeftRight, Send, Percent, AlertTriangle } from "lucide-react";
import { WalletConnection } from "@/components/WalletConnection";
import { ConvertTab } from "@/components/ConvertTab";
import { DepositsTab } from "@/components/DepositsTab";
import { TransferTab } from "@/components/TransferTab";
import { InterestTab } from "@/components/InterestTab";
import { LoadingModal } from "@/components/LoadingModal";
import { contractService } from "@/lib/contracts";
import { web3Service } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userTokenBalance, setUserTokenBalance] = useState("0");
  const [userEthBalance, setUserEthBalance] = useState("0");
  const [totalFDValue, setTotalFDValue] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("convert");
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const { toast } = useToast();

  const handleConnectionChange = async (connected: boolean, address?: string) => {
    setIsConnected(connected);
    if (connected && address) {
      setWalletAddress(address);
      setIsDemoMode(contractService.isDemoMode());
      await loadBalances(address);
    } else {
      setWalletAddress("");
      setUserTokenBalance("0");
      setUserEthBalance("0");
      setTotalFDValue("0");
      setIsDemoMode(false);
    }
  };

  const loadBalances = async (address?: string) => {
    const targetAddress = address || walletAddress;
    if (!targetAddress) return;

    try {
      // Load token balance
      const tokenBalance = await contractService.getTokenBalance(targetAddress);
      setUserTokenBalance(tokenBalance);

      // Load ETH balance
      const ethBalance = await web3Service.getBalance(targetAddress);
      setUserEthBalance(ethBalance);

      // Load fixed deposits and calculate total value
      const fixedDeposits = await contractService.getFixedDeposits(targetAddress);
      const totalValue = fixedDeposits
        .filter(fd => !fd.withdrawn)
        .reduce((sum, fd) => sum + parseFloat(fd.amount), 0);
      setTotalFDValue(totalValue.toString());
    } catch (error) {
      console.error("Failed to load balances:", error);
    }
  };

  const handleTransactionStart = () => {
    setIsLoading(true);
  };

  const handleTransactionEnd = (success: boolean, message: string) => {
    setIsLoading(false);
    toast({
      title: success ? "Success" : "Error",
      description: message,
      variant: success ? "default" : "destructive",
    });
  };

  const handleRefresh = () => {
    if (walletAddress) {
      loadBalances();
      toast({
        title: "Refreshed",
        description: "Data updated successfully",
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <University className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">DeFi Banking</h1>
                  <p className="text-xs text-neutral-500">Fixed Deposit Vault</p>
                </div>
              </div>
              
              <WalletConnection 
                onConnectionChange={handleConnectionChange}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        </header>

        {/* Welcome Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <University className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Welcome to DeFi Banking</h2>
              <p className="text-neutral-600 mb-8">Connect your MetaMask wallet to access fixed deposit services, token conversions, and earn interest on your holdings.</p>
              <div className="space-y-4 text-sm text-neutral-500">
                <div className="flex items-center justify-center space-x-2">
                  <University className="w-4 h-4 text-blue-600" />
                  <span>Secure smart contract based</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <PiggyBank className="w-4 h-4 text-green-600" />
                  <span>Earn competitive interest rates</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <ArrowLeftRight className="w-4 h-4 text-cyan-600" />
                  <span>Easy ETH ↔ mT conversions</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <University className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">DeFi Banking</h1>
                <p className="text-xs text-neutral-500">Fixed Deposit Vault</p>
              </div>
            </div>
            
            <WalletConnection 
              onConnectionChange={handleConnectionChange}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </header>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Demo Mode:</strong> Smart contracts not deployed. This interface demonstrates functionality with simulated data.
                  Deploy your contracts and update the VAULT_ADDRESS in contracts.ts for live functionality.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Your mT Balance</CardTitle>
              <Coins className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(userTokenBalance).toLocaleString()}</div>
              <p className="text-xs text-neutral-500 mt-1">mT Tokens</p>
            </CardContent>
          </Card>
          
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Your ETH Balance</CardTitle>
              <div className="w-4 h-4 rounded-full bg-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(userEthBalance).toFixed(4)}</div>
              <p className="text-xs text-neutral-500 mt-1">ETH</p>
            </CardContent>
          </Card>
          
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Total FD Value</CardTitle>
              <PiggyBank className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(totalFDValue).toLocaleString()}</div>
              <p className="text-xs text-neutral-500 mt-1">mT Tokens</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="card-shadow">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="convert" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none py-4"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Convert
                </TabsTrigger>
                <TabsTrigger 
                  value="deposits"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none py-4"
                >
                  <University className="w-4 h-4 mr-2" />
                  Fixed Deposits
                </TabsTrigger>
                <TabsTrigger 
                  value="transfer"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none py-4"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Transfer
                </TabsTrigger>
                <TabsTrigger 
                  value="interest"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none py-4"
                >
                  <Percent className="w-4 h-4 mr-2" />
                  Interest
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="convert" className="p-6">
              <ConvertTab 
                onTransactionStart={handleTransactionStart}
                onTransactionEnd={handleTransactionEnd}
                onBalanceUpdate={() => loadBalances()}
              />
            </TabsContent>

            <TabsContent value="deposits" className="p-6">
              <DepositsTab 
                walletAddress={walletAddress}
                onTransactionStart={handleTransactionStart}
                onTransactionEnd={handleTransactionEnd}
                onBalanceUpdate={() => loadBalances()}
              />
            </TabsContent>

            <TabsContent value="transfer" className="p-6">
              <TransferTab 
                userBalance={userTokenBalance}
                onTransactionStart={handleTransactionStart}
                onTransactionEnd={handleTransactionEnd}
                onBalanceUpdate={() => loadBalances()}
              />
            </TabsContent>

            <TabsContent value="interest" className="p-6">
              <InterestTab 
                userBalance={userTokenBalance}
                onTransactionStart={handleTransactionStart}
                onTransactionEnd={handleTransactionEnd}
                onBalanceUpdate={() => loadBalances()}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      <LoadingModal isOpen={isLoading} />
    </div>
  );
}
