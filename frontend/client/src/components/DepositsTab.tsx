import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, PiggyBank, AlertTriangle } from "lucide-react";
import { contractService, FixedDepositData } from "@/lib/contracts";
import { web3Service } from "@/lib/web3";

interface DepositsTabProps {
  walletAddress?: string;
  onTransactionStart: () => void;
  onTransactionEnd: (success: boolean, message: string) => void;
  onBalanceUpdate: () => void;
}

export function DepositsTab({ walletAddress, onTransactionStart, onTransactionEnd, onBalanceUpdate }: DepositsTabProps) {
  const [fdAmount, setFdAmount] = useState("");
  const [fdMonths, setFdMonths] = useState("");
  const [fixedDeposits, setFixedDeposits] = useState<FixedDepositData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadFixedDeposits();
    }
  }, [walletAddress]);

  const loadFixedDeposits = async () => {
    if (!walletAddress) return;
    
    try {
      const fds = await contractService.getFixedDeposits(walletAddress);
      setFixedDeposits(fds);
    } catch (error) {
      console.error("Failed to load fixed deposits:", error);
    }
  };

  const calculateExpectedReturns = (principal: string, months: string): string => {
    if (!principal || !months) return "0";
    const principalNum = parseFloat(principal);
    const monthsNum = parseInt(months);
    const interest = contractService.calculateInterest(principal, 1, monthsNum);
    return (principalNum + parseFloat(interest)).toFixed(2);
  };

  const handleCreateFD = async () => {
    if (!fdAmount || !fdMonths) return;
    
    setIsProcessing(true);
    onTransactionStart();
    
    try {
      const tx = await contractService.createFixedDeposit(fdAmount, parseInt(fdMonths));
      await tx.wait();
      
      onTransactionEnd(true, "Fixed deposit created successfully!");
      onBalanceUpdate();
      await loadFixedDeposits();
      setFdAmount("");
      setFdMonths("");
    } catch (error) {
      console.error("Failed to create FD:", error);
      onTransactionEnd(false, "Failed to create fixed deposit. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async (index: number, isEarly = false) => {
    if (isEarly && !confirm("Early withdrawal incurs penalties. Continue?")) {
      return;
    }
    
    setIsProcessing(true);
    onTransactionStart();
    
    try {
      const tx = isEarly 
        ? await contractService.earlyWithdrawFixedDeposit(index)
        : await contractService.withdrawFixedDeposit(index);
      await tx.wait();
      
      onTransactionEnd(true, `Fixed deposit ${isEarly ? 'early ' : ''}withdrawn successfully!`);
      onBalanceUpdate();
      await loadFixedDeposits();
    } catch (error) {
      console.error("Failed to withdraw FD:", error);
      onTransactionEnd(false, "Failed to withdraw fixed deposit. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenew = async (index: number, newMonths: number) => {
    setIsProcessing(true);
    onTransactionStart();
    
    try {
      const tx = await contractService.renewFixedDeposit(index, newMonths);
      await tx.wait();
      
      onTransactionEnd(true, "Fixed deposit renewed successfully!");
      await loadFixedDeposits();
    } catch (error) {
      console.error("Failed to renew FD:", error);
      onTransactionEnd(false, "Failed to renew fixed deposit. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (timestamp: string): string => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const getMaturityDate = (startTime: string, maturityPeriod: string): string => {
    const maturity = contractService.calculateMaturityDate(startTime, maturityPeriod);
    return maturity.toLocaleDateString();
  };

  const isMatured = (startTime: string, maturityPeriod: string): boolean => {
    return contractService.isMatured(startTime, maturityPeriod);
  };

  return (
    <div className="space-y-8">
      {/* Create New FD */}
      <Card className="gradient-primary border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Create Fixed Deposit</h3>
              <p className="text-sm text-neutral-600 font-normal">Lock your tokens and earn 1% monthly interest</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="fd-amount">Token Amount</Label>
              <Input
                id="fd-amount"
                type="number"
                placeholder="1000"
                value={fdAmount}
                onChange={(e) => setFdAmount(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="fd-months">Lock Period</Label>
              <Select value={fdMonths} onValueChange={setFdMonths}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleCreateFD}
                disabled={!fdAmount || !fdMonths || isProcessing}
              >
                Create FD
              </Button>
            </div>
          </div>
          
          {fdAmount && fdMonths && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
              <div className="text-sm text-neutral-600">Expected Returns:</div>
              <div className="text-lg font-semibold text-green-600">
                {calculateExpectedReturns(fdAmount, fdMonths)} mT (1% monthly)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active FDs */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Your Fixed Deposits</h3>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {fixedDeposits.filter(fd => !fd.withdrawn).length} Active
          </Badge>
        </div>
        
        {fixedDeposits.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="text-center py-12">
              <PiggyBank className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-neutral-600 mb-2">No Fixed Deposits</h4>
              <p className="text-neutral-500">Create your first fixed deposit to start earning interest</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {fixedDeposits.map((fd, index) => {
              const matured = isMatured(fd.startTime, fd.maturityPeriod);
              const withdrawn = fd.withdrawn;
              
              return (
                <Card 
                  key={index} 
                  className={`card-shadow hover:card-shadow-hover transition-shadow duration-200 ${
                    matured && !withdrawn ? 'border-green-200' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm text-neutral-600">Deposit #{index + 1}</div>
                        <div className="text-xl font-semibold">{parseFloat(fd.amount).toLocaleString()} mT</div>
                      </div>
                      <Badge 
                        variant={withdrawn ? "secondary" : matured ? "default" : "outline"}
                        className={
                          withdrawn ? "bg-gray-100 text-gray-700" :
                          matured ? "bg-green-100 text-green-700" :
                          "bg-blue-100 text-blue-700"
                        }
                      >
                        {withdrawn ? "Withdrawn" : matured ? "Matured" : "Active"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Lock Period:</span>
                        <span className="font-medium">{Math.round(parseInt(fd.maturityPeriod) / (30 * 24 * 60 * 60))} Months</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Start Date:</span>
                        <span className="font-medium">{formatDate(fd.startTime)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Maturity:</span>
                        <span className="font-medium">{getMaturityDate(fd.startTime, fd.maturityPeriod)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Interest Rate:</span>
                        <span className="font-medium text-green-600">1% per month</span>
                      </div>
                    </div>
                    
                    {!withdrawn && (
                      <>
                        <div className={`rounded-lg p-3 mb-4 ${matured ? 'bg-green-50 border border-green-200' : 'bg-neutral-50'}`}>
                          <div className={`text-sm mb-1 ${matured ? 'text-green-700' : 'text-neutral-600'}`}>
                            {matured ? 'Ready to Withdraw' : 'Expected Maturity Value'}
                          </div>
                          <div className={`text-lg font-semibold ${matured ? 'text-green-700' : 'text-neutral-800'}`}>
                            {calculateExpectedReturns(fd.amount, Math.round(parseInt(fd.maturityPeriod) / (30 * 24 * 60 * 60)).toString())} mT
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          {matured ? (
                            <Button 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleWithdraw(index)}
                              disabled={isProcessing}
                            >
                              Withdraw Now
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleWithdraw(index, true)}
                                disabled={isProcessing}
                              >
                                Early Withdraw
                              </Button>
                              <Button 
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleRenew(index, 3)}
                                disabled={isProcessing}
                              >
                                Renew
                              </Button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
