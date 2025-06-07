import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent } from "lucide-react";
import { contractService } from "@/lib/contracts";

interface InterestTabProps {
  userBalance?: string;
  onTransactionStart: () => void;
  onTransactionEnd: (success: boolean, message: string) => void;
  onBalanceUpdate: () => void;
}

export function InterestTab({ userBalance, onTransactionStart, onTransactionEnd, onBalanceUpdate }: InterestTabProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const MONTHLY_RATE = 0.5; // 0.5% monthly
  
  const calculatePendingInterest = (): string => {
    if (!userBalance) return "0";
    const balance = parseFloat(userBalance);
    // This is a simplified calculation - in reality you'd need to track last claim time
    return (balance * MONTHLY_RATE / 100).toFixed(2);
  };

  const handleClaimInterest = async () => {
    setIsProcessing(true);
    onTransactionStart();
    
    try {
      const tx = await contractService.distributeMonthlyInterest();
      await tx.wait();
      
      onTransactionEnd(true, "Interest distributed successfully!");
      onBalanceUpdate();
    } catch (error) {
      console.error("Interest claim failed:", error);
      onTransactionEnd(false, "Interest claim failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Interest Overview */}
      <div className="text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Percent className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Balance Interest</h3>
        <p className="text-neutral-600">Earn 0.5% monthly interest on your mT token balance</p>
      </div>
      
      {/* Interest Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-shadow text-center">
          <CardContent className="p-6">
            <div className="text-2xl font-semibold text-yellow-600 mb-2">0.5%</div>
            <div className="text-sm text-neutral-600">Monthly Rate</div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow text-center">
          <CardContent className="p-6">
            <div className="text-2xl font-semibold text-green-600 mb-2">{calculatePendingInterest()}</div>
            <div className="text-sm text-neutral-600">Pending Interest</div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow text-center">
          <CardContent className="p-6">
            <div className="text-2xl font-semibold mb-2">0</div>
            <div className="text-sm text-neutral-600">Total Earned</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Claim Interest */}
      <Card className="gradient-warning border-yellow-200">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold mb-2">Claim Monthly Interest</h4>
            <p className="text-sm text-neutral-600">Interest is calculated on your token balance and distributed monthly</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-600">Eligible Balance:</span>
              <span className="font-medium">{userBalance ? parseFloat(userBalance).toLocaleString() : "0"} mT</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-600">Interest Rate:</span>
              <span className="font-medium">0.5% monthly</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Estimated Interest:</span>
              <span className="font-medium">{calculatePendingInterest()} mT</span>
            </div>
          </div>
          
          <Button 
            className="w-full bg-yellow-600 hover:bg-yellow-700"
            onClick={handleClaimInterest}
            disabled={isProcessing || !userBalance || parseFloat(userBalance) === 0}
          >
            Distribute Interest ({calculatePendingInterest()} mT)
          </Button>
        </CardContent>
      </Card>
      
      {/* Interest History */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Interest History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-neutral-500">No interest history available</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
