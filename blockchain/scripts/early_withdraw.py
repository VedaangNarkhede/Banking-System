from brownie import FixedDepositVault, accounts

def main():
    user = accounts[0]
    vault = FixedDepositVault[-1]
    index = int(input("Enter FD index for early withdrawal: "))
    
    print("Attempting early withdrawal...")
    tx = vault.earlyWithdrawFD(index, {"from": user})
    tx.wait(1)
    print("Early withdrawal complete!")
