from brownie import FixedDepositVault, accounts

def main():
    user = accounts[0]
    vault = FixedDepositVault[-1]
    index = int(input("Enter FD index to renew: "))
    new_months = int(input("Enter new maturity period in months: "))

    print(f"Renewing FD for {new_months} months...")
    tx = vault.renewFD(index, new_months, {"from": user})
    tx.wait(1)
    print("FD renewed successfully!")
