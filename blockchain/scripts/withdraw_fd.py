from brownie import FixedDepositVault, accounts

def main():
    user = accounts[0]
    vault = FixedDepositVault[-1]
    index = int(input("Enter FD index to withdraw: "))
    
    print("Attempting normal withdrawal...")
    tx = vault.withdrawFD(index, {"from": user})
    tx.wait(1)
    print("Withdrawal complete!")
