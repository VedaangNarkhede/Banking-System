from brownie import FixedDepositVault, Contract, accounts, MyToken
from rich import print
from rich.console import Console
from rich.table import Table
import time

console = Console()

# Global variable to track current user
current_user_account = None

def get_user():
    """Get the current user account"""
    global current_user_account
    if current_user_account is None:
        current_user_account = accounts[0]
    return current_user_account

def select_account():
    """Allow user to select which account to use"""
    global current_user_account
    
    print("\n[bold cyan]Available Accounts:[/bold cyan]")
    for i, account in enumerate(accounts[:5]):  # Show first 5 accounts
        balance = account.balance() / 1e18
        current_indicator = " ← Current" if account == current_user_account else ""
        print(f"{i}: {account.address} (ETH: {balance:.4f}){current_indicator}")
    
    while True:
        try:
            choice = int(input("\nSelect account (0-4): "))
            if 0 <= choice < 5:
                current_user_account = accounts[choice]
                return current_user_account
            else:
                print("[red]Invalid choice. Please select 0-4.[/red]")
        except ValueError:
            print("[red]Please enter a valid number.[/red]")

def get_vault_and_token():
    """Get the deployed vault and token contracts"""
    if len(FixedDepositVault) == 0:
        raise Exception("No FixedDepositVault contract deployed. Run deploy.py first.")
    
    vault = FixedDepositVault[-1]
    token = MyToken.at(vault.myToken())
    return vault, token

def eth_to_mt():
    """Convert ETH to mT tokens"""
    user = get_user()
    vault, token = get_vault_and_token()
    
    print(f"\n[cyan]Current ETH Balance: {user.balance() / 1e18:.4f} ETH[/cyan]")
    
    try:
        eth_amount = float(input("Enter ETH amount to convert to mT: "))
        if eth_amount <= 0:
            print("[red]Amount must be positive[/red]")
            return
        
        if eth_amount > user.balance() / 1e18:
            print("[red]Insufficient ETH balance[/red]")
            return
        
        # Calculate expected mT tokens
        exchange_rate = vault.getExchangeRate()
        expected_mt = eth_amount * exchange_rate
        
        print(f"[yellow]You will receive: {expected_mt:.4f} mT tokens[/yellow]")
        confirm = input("Confirm transaction? (y/n): ").lower()
        
        if confirm == 'y':
            tx = vault.ETHtomT({"from": user, "value": int(eth_amount * 1e18)})
            tx.wait(1)
            
            new_mt_balance = token.balanceOf(user) / 1e18
            print(f"[green]✓ Conversion successful![/green]")
            print(f"[green]New mT Balance: {new_mt_balance:.4f} mT[/green]")
        else:
            print("[yellow]Transaction cancelled[/yellow]")
            
    except ValueError:
        print("[red]Please enter a valid number[/red]")
    except Exception as e:
        print(f"[red]Error: {e}[/red]")

def mt_to_eth():
    """Convert mT tokens back to ETH"""
    user = get_user()
    vault, token = get_vault_and_token()
    
    current_balance = token.balanceOf(user) / 1e18
    print(f"\n[cyan]Current mT Balance: {current_balance:.4f} mT[/cyan]")
    
    if current_balance == 0:
        print("[red]No mT tokens to convert[/red]")
        return
    
    try:
        mt_amount = float(input("Enter mT tokens to convert back to ETH: "))
        if mt_amount <= 0:
            print("[red]Amount must be positive[/red]")
            return
        
        if mt_amount > current_balance:
            print("[red]Insufficient mT balance[/red]")
            return
        
        amount_wei = int(mt_amount * 1e18)
        
        # Calculate expected ETH
        exchange_rate = vault.getExchangeRate()
        expected_eth = mt_amount / exchange_rate
        
        print(f"[yellow]You will receive: {expected_eth:.6f} ETH[/yellow]")
        confirm = input("Confirm transaction? (y/n): ").lower()
        
        if confirm == 'y':
            # Check and approve if necessary
            current_allowance = token.allowance(user, vault.address)
            if current_allowance < amount_wei:
                print("[yellow]Approving tokens...[/yellow]")
                token.approve(vault.address, amount_wei, {"from": user}).wait(1)
            
            old_eth_balance = user.balance() / 1e18
            tx = vault.mTtoETH(amount_wei, {"from": user})
            tx.wait(1)
            
            new_eth_balance = user.balance() / 1e18
            eth_received = new_eth_balance - old_eth_balance
            
            print(f"[green]✓ mT → ETH conversion successful![/green]")
            print(f"[green]ETH received: {eth_received:.6f} ETH[/green]")
        else:
            print("[yellow]Transaction cancelled[/yellow]")
            
    except ValueError:
        print("[red]Please enter a valid number[/red]")
    except Exception as e:
        print(f"[red]Error: {e}[/red]")

def transfer_mt():
    """Transfer mT tokens to another user"""
    user = get_user()
    _, token = get_vault_and_token()
    
    current_balance = token.balanceOf(user) / 1e18
    print(f"\n[cyan]Current mT Balance: {current_balance:.4f} mT[/cyan]")
    
    if current_balance == 0:
        print("[red]No mT tokens to transfer[/red]")
        return
    
    try:
        recipient = input("Enter recipient address: ").strip()
        if not recipient or len(recipient) != 42 or not recipient.startswith('0x'):
            print("[red]Invalid address format[/red]")
            return
        
        amount = float(input("Enter amount of mT to transfer: "))
        if amount <= 0:
            print("[red]Amount must be positive[/red]")
            return
        
        if amount > current_balance:
            print("[red]Insufficient mT balance[/red]")
            return
        
        print(f"[yellow]Transferring {amount:.4f} mT to {recipient}[/yellow]")
        confirm = input("Confirm transaction? (y/n): ").lower()
        
        if confirm == 'y':
            tx = token.transferToUser(recipient, int(amount * 1e18), {"from": user})
            tx.wait(1)
            
            new_balance = token.balanceOf(user) / 1e18
            recipient_balance = token.balanceOf(recipient) / 1e18
            
            print(f"[green]✓ Transfer successful![/green]")
            print(f"[green]Your new balance: {new_balance:.4f} mT[/green]")
            print(f"[green]Recipient balance: {recipient_balance:.4f} mT[/green]")
        else:
            print("[yellow]Transaction cancelled[/yellow]")
            
    except ValueError:
        print("[red]Please enter a valid number[/red]")
    except Exception as e:
        print(f"[red]Error: {e}[/red]")

def check_balance():
    """Check mT token balance for any address"""
    _, token = get_vault_and_token()
    
    address = input("Enter address (leave blank for your own): ").strip()
    if address == "":
        address = get_user().address
    elif len(address) != 42 or not address.startswith('0x'):
        print("[red]Invalid address format[/red]")
        return
    
    try:
        balance = token.balanceOf(address) / 1e18
        print(f"[cyan]Balance of {address}: {balance:.4f} mT[/cyan]")
    except Exception as e:
        print(f"[red]Error checking balance: {e}[/red]")

def show_vault_info():
    """Display vault information"""
    vault, token = get_vault_and_token()
    
    try:
        table = Table(title="Vault Information")
        table.add_column("Property", style="cyan")
        table.add_column("Value", style="yellow")
        
        eth_balance = vault.getVaultETHBalance() / 1e18
        eth_backing = vault.getTotalETHBacking() / 1e18
        exchange_rate = vault.getExchangeRate()
        rates = vault.getCurrentRates()
        
        table.add_row("Vault ETH Balance", f"{eth_balance:.6f} ETH")
        table.add_row("Total ETH Backing", f"{eth_backing:.6f} ETH")
        table.add_row("Exchange Rate", f"{exchange_rate:,} mT per ETH")
        table.add_row("FD Interest Rate", f"{rates[0] / 100:.2f}% per month")
        table.add_row("Early Withdrawal Rate", f"{rates[1] / 100:.2f}% per month")
        table.add_row("Balance Interest Rate", f"{rates[2] / 100:.2f}% per month")
        
        console.print(table)
        
    except Exception as e:
        print(f"[red]Error fetching vault info: {e}[/red]")

def show_account_info():
    """Show detailed account information"""
    user = get_user()
    vault, token = get_vault_and_token()
    
    try:
        table = Table(title=f"Account Information: {user.address}")
        table.add_column("Property", style="cyan")
        table.add_column("Value", style="yellow")
        
        eth_balance = user.balance() / 1e18
        mt_balance = token.balanceOf(user) / 1e18
        pending_interest = vault.pendingBalanceInterest(user) / 1e18
        
        table.add_row("ETH Balance", f"{eth_balance:.6f} ETH")
        table.add_row("mT Balance", f"{mt_balance:.4f} mT")
        table.add_row("Pending Balance Interest", f"{pending_interest:.4f} mT")
        
        # Show FD count
        fd_count = vault.getFDCount(user)
        table.add_row("Fixed Deposits", str(fd_count))
        
        console.print(table)
        
    except Exception as e:
        print(f"[red]Error fetching account info: {e}[/red]")

def menu():
    """Display the main menu"""
    print("\n" + "="*60)
    print("[bold magenta]🏦 DeFi Banking System — Transaction Menu 🏦[/bold magenta]")
    print("="*60)
    print("1. 💱 Convert ETH to mT")
    print("2. 💰 Convert mT to ETH")
    print("3. 📤 Transfer mT to another user")
    print("4. 💳 Check mT balance")
    print("5. 📊 Show vault information")
    print("6. 👤 Show account information")
    print("7. 🔄 Switch account")
    print("8. 🚪 Exit")
    print("="*60)

def main():
    """Main application loop"""
    global current_user_account
    current_user_account = accounts[0]  # Initialize with first account
    
    print(f"[green]Welcome to DeFi Banking System![/green]")
    print(f"[cyan]Current account: {current_user_account.address}[/cyan]")
    
    while True:
        menu()
        choice = input("\nSelect option (1-8): ").strip()
        
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
                show_vault_info()
            elif choice == "6":
                show_account_info()
            elif choice == "7":
                new_account = select_account()
                print(f"[green]Switched to account: {new_account.address}[/green]")
            elif choice == "8":
                print("[green]Thank you for using DeFi Banking System! 👋[/green]")
                break
            else:
                print("[red]Invalid choice. Please select 1-8.[/red]")
                
        except KeyboardInterrupt:
            print("\n[yellow]Operation cancelled by user[/yellow]")
        except Exception as e:
            print(f"[red]Unexpected error: {e}[/red]")
            print("[yellow]Please try again or contact support[/yellow]")
        
        # Small pause for better UX
        time.sleep(1)

if __name__ == "__main__":
    main()