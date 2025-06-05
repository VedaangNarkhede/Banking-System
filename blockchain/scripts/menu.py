from brownie import FixedDepositVault, Contract, accounts, MyToken
from rich import print

def get_user():
    return accounts[0]

def get_vault_and_token():
    if len(FixedDepositVault) == 0:
        raise Exception("No FixedDepositVault contract deployed. Run deploy.py first.")
    
    vault = FixedDepositVault[-1]

    # Use the stored MyToken interface with address from vault.myToken()
    token = MyToken.at(vault.myToken())

    return vault, token

def eth_to_mt():
    user = get_user()
    vault, _ = get_vault_and_token()
    eth_amount = float(input("Enter ETH amount to convert to mT: "))
    tx = vault.ETHtomT({"from": user, "value": int(eth_amount * 1e18)})
    tx.wait(1)
    print("[green]Conversion successful![/green]")

def mt_to_eth():
    user = get_user()
    vault, token = get_vault_and_token()
    mt_amount = float(input("Enter mT tokens to convert back to ETH: "))
    amount = int(mt_amount * 1e18)
    token.approve(vault.address, amount, {"from": user}).wait(1)
    vault.mTtoETH(amount, {"from": user}).wait(1)
    print("[green]mT → ETH conversion successful![/green]")

def transfer_mt():
    user = get_user()
    _, token = get_vault_and_token()
    recipient = input("Enter recipient address: ")
    amount = float(input("Enter amount of mT to transfer: "))
    token.transferToUser(recipient, int(amount * 1e18), {"from": user}).wait(1)
    print(f"[green]Transferred {amount} mT to {recipient}[/green]")

def check_balance():
    _, token = get_vault_and_token()
    address = input("Enter address (leave blank for your own): ").strip()
    if address == "":
        address = get_user().address
    balance = token.balanceOf(address) / 1e18
    print(f"[cyan]Balance of {address}: {balance:.4f} mT[/cyan]")

def menu():
    print("[bold magenta]\nDeFi Banking System — Transaction Menu[/bold magenta]")
    print("1. Convert ETH to mT")
    print("2. Convert mT to ETH")
    print("3. Transfer mT to another user")
    print("4. Check mT balance")
    print("5. Exit")

def main():
    while True:
        menu()
        choice = input("\nSelect option (1-5): ").strip()
        try:
            if choice == "1":
                eth_to_mt()
            elif choice == "2":
                mt_to_eth()
            elif choice == "3":
                transfer_mt()
            elif choice == "4":
                check_balance()
            elif choice == "5":
                print("Exiting... 👋")
                break
            else:
                print("[red]Invalid choice. Try again.[/red]")
        except Exception as e:
            print(f"[red]Error:[/red] {e}")
