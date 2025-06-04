from brownie import FixedDepositVault, accounts
from brownie.network.contract import Contract

def main():
    user = accounts[0]
    vault = FixedDepositVault[-1]
    amount = int(input("Enter amount of tokens to deposit: "))
    months = int(input("Enter lock period in months: "))

    print(f"Creating FD of {amount} tokens for {months} months...")
    tx = vault.createFD(amount * 10**18, months, {"from": user})
    tx.wait(1)
    print("FD created successfully!")
