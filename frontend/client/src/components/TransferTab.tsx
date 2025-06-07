import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import { contractService } from "@/lib/contracts";

interface TransferTabProps {
  userBalance?: string;
  onTransactionStart: () => void;
  onTransactionEnd: (success: boolean, message: string) => void;
  onBalanceUpdate: () => void;
}

export function TransferTab({ userBalance, onTransactionStart, onTransactionEnd, onBalanceUpdate }: TransferTabProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransfer = async () => {
    if (!recipient || !amount) return;
    
    // Basic address validation
    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      onTransactionEnd(false, "Please enter a valid Ethereum address");
      return;
    }

    setIsProcessing(true);
    onTransactionStart();
    
    try {
      const tx = await contractService.transferTokens(recipient, amount);
      await tx.wait();
      
      onTransactionEnd(true, "Tokens transferred successfully!");
      onBalanceUpdate();
      setRecipient("");
      setAmount("");
    } catch (error) {
      console.error("Transfer failed:", error);
      onTransactionEnd(false, "Transfer failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="card-shadow">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-6 h-6 text-cyan-600" />
          </div>
          <CardTitle>Transfer mT Tokens</CardTitle>
          <p className="text-sm text-neutral-600">Send tokens to another wallet address</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono text-sm mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="transfer-amount">Amount</Label>
            <div className="relative mt-2">
              <Input
                id="transfer-amount"
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-12"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-neutral-500 text-sm">mT</span>
              </div>
            </div>
            {userBalance && (
              <div className="text-xs text-neutral-500 mt-1">
                Available: {parseFloat(userBalance).toLocaleString()} mT
              </div>
            )}
          </div>
          
          <Button 
            className="w-full bg-cyan-600 hover:bg-cyan-700"
            onClick={handleTransfer}
            disabled={!recipient || !amount || isProcessing}
          >
            Send Tokens
          </Button>
        </CardContent>
      </Card>
      
      {/* Recent Transfers section can be added here if needed */}
      <Card className="mt-8 card-shadow">
        <CardContent className="p-4">
          <div className="text-sm text-neutral-600 mb-2">Recent Transfers</div>
          <div className="text-center py-8">
            <p className="text-neutral-500 text-sm">No recent transfers</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
