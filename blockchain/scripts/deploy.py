from brownie import MyToken, FixedDepositVault, accounts, network
from rich import print

def main():
    """Deploy the DeFi banking system contracts"""
    
    # Get deployment account
    deployer = accounts[0]
    print(f"[cyan]Deploying from account: {deployer.address}[/cyan]")
    print(f"[cyan]Account balance: {deployer.balance() / 1e18:.4f} ETH[/cyan]")
    
    try:
        print("\n[yellow]Step 1: Deploying MyToken...[/yellow]")
        # Deploy MyToken with deployer as initial owner and placeholder vault address
        # We'll grant minter role to vault after deployment
        token = MyToken.deploy(deployer.address, "0x0000000000000000000000000000000000000000", {"from": deployer})
        print(f"[green]✓ MyToken deployed at: {token.address}[/green]")
        
        print("\n[yellow]Step 2: Deploying FixedDepositVault...[/yellow]")
        # Deploy FixedDepositVault with token address and deployer as owner
        vault = FixedDepositVault.deploy(token.address, deployer.address, {"from": deployer})
        print(f"[green]✓ FixedDepositVault deployed at: {vault.address}[/green]")
        
        print("\n[yellow]Step 3: Granting minter role to vault...[/yellow]")
        # Grant MINTER_ROLE to the vault so it can mint tokens
        minter_role = token.MINTER_ROLE()
        token.grantRole(minter_role, vault.address, {"from": deployer})
        print("[green]✓ Minter role granted to vault[/green]")
        
        print("\n[yellow]Step 4: Adding initial ETH to vault...[/yellow]")
        # Send some ETH to the vault for initial operations
        initial_eth = "1 ether"
        deployer.transfer(vault.address, initial_eth)
        print(f"[green]✓ Added {initial_eth} to vault for operations[/green]")
        
        print("\n[yellow]Step 5: Verifying deployment...[/yellow]")
        # Verify the setup
        vault_eth_balance = vault.getVaultETHBalance() / 1e18
        exchange_rate = vault.getExchangeRate()
        has_minter_role = token.hasRole(minter_role, vault.address)
        
        print(f"[cyan]Vault ETH Balance: {vault_eth_balance:.4f} ETH[/cyan]")
        print(f"[cyan]Exchange Rate: {exchange_rate:,} mT per ETH[/cyan]")
        print(f"[cyan]Vault has minter role: {has_minter_role}[/cyan]")
        
        if has_minter_role:
            print("\n[green]🎉 Deployment completed successfully![/green]")
            print(f"[green]MyToken: {token.address}[/green]")
            print(f"[green]FixedDepositVault: {vault.address}[/green]")
            print(f"[green]Network: {network.show_active()}[/green]")
        else:
            print("\n[red]❌ Deployment verification failed![/red]")
            return None, None
        
        return vault, token
        
    except Exception as e:
        print(f"\n[red]❌ Deployment failed: {e}[/red]")
        return None, None

if __name__ == "__main__":
    vault, token = main()
    if vault and token:
        print("\n[bold green]Ready to use the DeFi Banking System![/bold green]")
        print("[cyan]Run 'brownie run menu' to start the user interface[/cyan]")