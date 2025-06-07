import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowDown, Coins, AlertTriangle } from "lucide-react";
import { contractService } from "@/lib/contracts";
import { web3Service } from "@/lib/web3";

interface ConvertTabProps {
  onTransactionStart: () => void;
  onTransactionEnd: (success: boolean, message: string) => void;
  onBalanceUpdate: () => void;
}

export function ConvertTab({ onTransactionStart, onTransactionEnd, onBalanceUpdate }: ConvertTabProps) {
  const [ethToMtAmount, setEthToMtAmount] = useState("");
  const [mtToEthAmount, setMtToEthAmount] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const ETH_TO_MT_RATE = 200000;

  const calculateMtTokens = (ethAmount: string): string => {
    const eth = parseFloat(ethAmount) || 0;
    return (eth * ETH_TO_MT_RATE).toLocaleString();
  };

  const calculateEthAmount = (mtAmount: string): string => {
    const mt = parseFloat(mtAmount) || 0;
    return (mt / ETH_TO_MT_RATE).toFixed(6);
  };

  const handleETHtoMT = async () => {
    if (!ethToMtAmount) return;
    
    setIsProcessing(true);
    onTransactionStart();
    
    try {
      const tx = await contractService.convertETHtoMT(ethToMtAmount);
      await tx.wait();
      
      onTransactionEnd(true, "ETH converted to mT tokens successfully!");
      onBalanceUpdate();
      setEthToMtAmount("");
    } catch (error) {
      console.error("ETH to mT conversion failed:", error);
      onTransactionEnd(false, "ETH to mT conversion failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!approveAmount) return;
    
    setIsProcessing(true);
    onTransactionStart();
    
    try {
      const tx = await contractService.approveTokens(approveAmount);
      await tx.wait();
      
      onTransactionEnd(true, "Token approval successful!");
    } catch (error) {
      console.error("Approval failed:", error);
      onTransactionEnd(false, "Token approval failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMTtoETH = async () => {
    if (!mtToEthAmount) return;
    
    setIsProcessing(true);
    onTransactionStart();
    
    try {
      const tx = await contractService.convertMTtoETH(mtToEthAmount);
      await tx.wait();
      
      onTransactionEnd(true, "mT tokens converted to ETH successfully!");
      onBalanceUpdate();
      setMtToEthAmount("");
    } catch (error) {
      console.error("mT to ETH conversion failed:", error);
      onTransactionEnd(false, "mT to ETH conversion failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ETH to mT Conversion */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Coins className="w-4 h-4 text-blue-600" />
            </div>
            <span>ETH → mT Tokens</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-neutral-50 rounded-lg p-4 border">
            <div className="text-sm text-neutral-600 mb-2">Exchange Rate</div>
            <div className="text-lg font-medium">1 ETH = {ETH_TO_MT_RATE.toLocaleString()} mT</div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="eth-amount">ETH Amount</Label>
              <div className="relative mt-2">
                <Input
                  id="eth-amount"
                  type="number"
                  step="0.001"
                  placeholder="0.1"
                  value={ethToMtAmount}
                  onChange={(e) => setEthToMtAmount(e.target.value)}
                  className="pr-12"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-neutral-500 text-sm">ETH</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <ArrowDown className="w-4 h-4 text-neutral-400 mx-auto" />
            </div>
            
            <div>
              <Label>You'll Receive</Label>
              <div className="bg-neutral-100 border rounded-lg px-4 py-3 mt-2">
                <div className="text-lg font-medium">{calculateMtTokens(ethToMtAmount)} mT</div>
              </div>
            </div>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={handleETHtoMT}
              disabled={!ethToMtAmount || isProcessing}
            >
              Convert to mT Tokens
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* mT to ETH Conversion */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
              <Coins className="w-4 h-4 text-cyan-600" />
            </div>
            <span>mT Tokens → ETH</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              <div className="font-medium mb-1">Approval Required</div>
              <div>You need to approve the vault to spend your mT tokens first.</div>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-amount">Approve Amount</Label>
              <div className="flex space-x-3 mt-2">
                <Input
                  id="approve-amount"
                  type="number"
                  placeholder="10000"
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  className="bg-cyan-600 hover:bg-cyan-700"
                  onClick={handleApprove}
                  disabled={!approveAmount || isProcessing}
                >
                  Approve
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="mt-amount">mT Amount</Label>
              <div className="relative mt-2">
                <Input
                  id="mt-amount"
                  type="number"
                  placeholder="20000"
                  value={mtToEthAmount}
                  onChange={(e) => setMtToEthAmount(e.target.value)}
                  className="pr-12"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-neutral-500 text-sm">mT</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <ArrowDown className="w-4 h-4 text-neutral-400 mx-auto" />
            </div>
            
            <div>
              <Label>You'll Receive</Label>
              <div className="bg-neutral-100 border rounded-lg px-4 py-3 mt-2">
                <div className="text-lg font-medium">{calculateEthAmount(mtToEthAmount)} ETH</div>
              </div>
            </div>
            
            <Button 
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              onClick={handleMTtoETH}
              disabled={!mtToEthAmount || isProcessing}
            >
              Convert to ETH
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
