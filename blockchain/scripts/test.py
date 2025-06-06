from brownie import MyToken, FixedDepositVault, accounts, chain, Wei
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print
import time

console = Console()

def deploy_contracts():
    """Deploy contracts for testing"""
    deployer = accounts[0]
    
    # Deploy MyToken
    token = MyToken.deploy(deployer.address, "0x0000000000000000000000000000000000000000", {"from": deployer})
    
    # Deploy FixedDepositVault
    vault = FixedDepositVault.deploy(token.address, deployer.address, {"from": deployer})
    
    # Grant minter role to vault
    minter_role = token.MINTER_ROLE()
    token.grantRole(minter_role, vault.address, {"from": deployer})
    
    # Add ETH to vault
    deployer.transfer(vault.address, Wei("10 ether"))
    
    return vault, token

def display_user_info(vault, token, user, title="User Info"):
    """Display user's current status"""
    table = Table(title=title)
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")
    
    eth_balance = user.balance() / 1e18
    mt_balance = token.balanceOf(user) / 1e18
    fd_count = vault.getFDCount(user)
    pending_interest = vault.pendingBalanceInterest(user) / 1e18
    
    table.add_row("ETH Balance", f"{eth_balance:.4f} ETH")
    table.add_row("mT Balance", f"{mt_balance:.4f} mT")
    table.add_row("Active FDs", str(fd_count))
    table.add_row("Pending Balance Interest", f"{pending_interest:.4f} mT")
    
    console.print(table)

def display_fd_info(vault, user):
    """Display all FDs for a user"""
    fds = vault.getFDs(user)
    
    if len(fds) == 0:
        console.print("[yellow]No Fixed Deposits found[/yellow]")
        return
    
    table = Table(title="Fixed Deposits")
    table.add_column("Index", style="cyan")
    table.add_column("Amount (mT)", style="green")
    table.add_column("Start Time", style="blue")
    table.add_column("Maturity (days)", style="magenta")
    table.add_column("Status", style="yellow")
    table.add_column("Time Left", style="red")
    
    current_time = chain.time()
    
    for i, fd in enumerate(fds):
        amount = fd[0] / 1e18
        start_time = fd[1]
        maturity_period = fd[2]
        withdrawn = fd[3]
        renewed = fd[4]
        
        maturity_days = maturity_period // (24 * 3600)
        maturity_time = start_time + maturity_period
        
        if withdrawn:
            status = "Withdrawn"
            time_left = "N/A"
        elif current_time >= maturity_time:
            status = "Matured"
            time_left = "Ready"
        else:
            status = "Active"
            time_left_seconds = maturity_time - current_time
            time_left = f"{time_left_seconds // (24 * 3600)} days"
        
        table.add_row(
            str(i),
            f"{amount:.4f}",
            time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(start_time)),
            str(maturity_days),
            status,
            time_left
        )
    
    console.print(table)

def test_eth_to_mt_conversion(vault, token, user):
    """Test ETH to mT conversion"""
    console.print(Panel("[bold blue]Testing ETH to mT Conversion[/bold blue]"))
    
    eth_amount = Wei("1 ether")
    console.print(f"Converting {eth_amount} ETH to mT...")
    
    tx = vault.ETHtomT({"from": user, "value": eth_amount})
    
    expected_mt = vault.getExchangeRate() * eth_amount / 1e18
    actual_mt = token.balanceOf(user) / 1e18
    
    console.print(f"[green]✓ Conversion successful![/green]")
    console.print(f"Expected mT: {expected_mt:,.0f}")
    console.print(f"Actual mT: {actual_mt:,.0f}")
    
    return tx

def test_create_fd(vault, token, user, amount_mt, months):
    """Test creating a fixed deposit"""
    console.print(Panel(f"[bold blue]Creating FD: {amount_mt} mT for {months} months[/bold blue]"))
    
    # Approve vault to spend tokens
    token_amount = Wei(f"{amount_mt} ether")
    token.approve(vault.address, token_amount, {"from": user})
    
    # Create FD
    tx = vault.createFD(token_amount, months, {"from": user})
    
    console.print(f"[green]✓ FD Created successfully![/green]")
    console.print(f"Transaction hash: {tx.txid}")
    
    return tx

def test_withdraw_fd(vault, token, user, fd_index):
    """Test withdrawing a matured FD"""
    console.print(Panel(f"[bold blue]Withdrawing FD at index {fd_index}[/bold blue]"))
    
    # Get FD info before withdrawal
    fds = vault.getFDs(user)
    if fd_index >= len(fds):
        console.print("[red]Invalid FD index![/red]")
        return None
    
    fd = fds[fd_index]
    principal = fd[0] / 1e18
    start_time = fd[1]
    maturity_period = fd[2]
    
    console.print(f"Principal: {principal:.4f} mT")
    console.print(f"Maturity Period: {maturity_period // (30 * 24 * 3600)} months")
    
    # Check if matured
    current_time = chain.time()
    if current_time < start_time + maturity_period:
        console.print("[yellow]FD not yet matured. Use early withdrawal instead.[/yellow]")
        return None
    
    # Get balance before withdrawal
    balance_before = token.balanceOf(user)
    
    # Withdraw
    tx = vault.withdrawFD(fd_index, {"from": user})
    
    # Get balance after withdrawal
    balance_after = token.balanceOf(user)
    received = (balance_after - balance_before) / 1e18
    interest = received - principal
    
    console.print(f"[green]✓ FD Withdrawn successfully![/green]")
    console.print(f"Principal: {principal:.4f} mT")
    console.print(f"Interest: {interest:.4f} mT")
    console.print(f"Total Received: {received:.4f} mT")
    
    return tx

def test_early_withdraw_fd(vault, token, user, fd_index):
    """Test early withdrawal of FD"""
    console.print(Panel(f"[bold blue]Early Withdrawing FD at index {fd_index}[/bold blue]"))
    
    # Get FD info before withdrawal
    fds = vault.getFDs(user)
    if fd_index >= len(fds):
        console.print("[red]Invalid FD index![/red]")
        return None
    
    fd = fds[fd_index]
    principal = fd[0] / 1e18
    start_time = fd[1]
    maturity_period = fd[2]
    
    console.print(f"Principal: {principal:.4f} mT")
    console.print(f"Maturity Period: {maturity_period // (30 * 24 * 3600)} months")
    
    # Check if not yet matured
    current_time = chain.time()
    if current_time >= start_time + maturity_period:
        console.print("[yellow]FD already matured. Use regular withdrawal instead.[/yellow]")
        return None
    
    # Calculate time elapsed
    time_elapsed = current_time - start_time
    months_elapsed = time_elapsed // (30 * 24 * 3600)
    
    console.print(f"Time elapsed: {months_elapsed} months")
    
    # Get balance before withdrawal
    balance_before = token.balanceOf(user)
    
    # Early withdraw
    tx = vault.earlyWithdrawFD(fd_index, {"from": user})
    
    # Get balance after withdrawal
    balance_after = token.balanceOf(user)
    received = (balance_after - balance_before) / 1e18
    interest = received - principal
    
    console.print(f"[green]✓ FD Early Withdrawn successfully![/green]")
    console.print(f"Principal: {principal:.4f} mT")
    console.print(f"Interest (Early): {interest:.4f} mT")
    console.print(f"Total Received: {received:.4f} mT")
    
    return tx

def test_renew_fd(vault, token, user, fd_index, new_months):
    """Test renewing a matured FD"""
    console.print(Panel(f"[bold blue]Renewing FD at index {fd_index} for {new_months} months[/bold blue]"))
    
    # Get FD info before renewal
    fds = vault.getFDs(user)
    if fd_index >= len(fds):
        console.print("[red]Invalid FD index![/red]")
        return None
    
    fd = fds[fd_index]
    principal_before = fd[0] / 1e18
    start_time = fd[1]
    maturity_period = fd[2]
    
    console.print(f"Current Principal: {principal_before:.4f} mT")
    
    # Check if matured
    current_time = chain.time()
    if current_time < start_time + maturity_period:
        console.print("[yellow]FD not yet matured. Cannot renew.[/yellow]")
        return None
    
    # Renew FD
    tx = vault.renewFD(fd_index, new_months, {"from": user})
    
    # Get updated FD info
    fds_after = vault.getFDs(user)
    fd_after = fds_after[fd_index]
    principal_after = fd_after[0] / 1e18
    
    interest_added = principal_after - principal_before
    
    console.print(f"[green]✓ FD Renewed successfully![/green]")
    console.print(f"Previous Principal: {principal_before:.4f} mT")
    console.print(f"Interest Added: {interest_added:.4f} mT")
    console.print(f"New Principal: {principal_after:.4f} mT")
    console.print(f"New Term: {new_months} months")
    
    return tx

def simulate_time_passage(months):
    """Simulate time passage for testing"""
    seconds_to_advance = months * 30 * 24 * 3600  # 30 days per month
    chain.sleep(seconds_to_advance)
    chain.mine()
    console.print(f"[yellow]⏰ Simulated {months} months passage[/yellow]")

def test_balance_interest(vault, token, user):
    """Test balance interest claiming"""
    console.print(Panel("[bold blue]Testing Balance Interest[/bold blue]"))
    
    # Check pending interest
    pending = vault.pendingBalanceInterest(user) / 1e18
    console.print(f"Pending Balance Interest: {pending:.4f} mT")
    
    if pending == 0:
        # Initialize balance interest tracking
        console.print("Initializing balance interest tracking...")
        vault.claimBalanceInterest({"from": user})
        
        # Simulate 2 months
        simulate_time_passage(2)
        
        pending = vault.pendingBalanceInterest(user) / 1e18
        console.print(f"Pending after 2 months: {pending:.4f} mT")
    
    if pending > 0:
        balance_before = token.balanceOf(user)
        tx = vault.claimBalanceInterest({"from": user})
        balance_after = token.balanceOf(user)
        
        interest_received = (balance_after - balance_before) / 1e18
        console.print(f"[green]✓ Balance Interest Claimed: {interest_received:.4f} mT[/green]")
    else:
        console.print("[yellow]No balance interest to claim[/yellow]")

def main():
    """Main testing function"""
    console.print(Panel("[bold green]🏦 DeFi Banking System - Feature Testing[/bold green]"))
    
    # Deploy contracts
    console.print("\n[yellow]Deploying contracts...[/yellow]")
    vault, token = deploy_contracts()
    
    # Test user
    user = accounts[1]
    
    console.print("\n[yellow]Initial State:[/yellow]")
    display_user_info(vault, token, user, "Initial User State")
    
    # Test 1: Convert ETH to mT
    console.print("\n" + "="*50)
    test_eth_to_mt_conversion(vault, token, user)
    display_user_info(vault, token, user, "After ETH Conversion")
    
    # Test 2: Create multiple FDs
    console.print("\n" + "="*50)
    test_create_fd(vault, token, user, 50000, 3)  # 3 months
    test_create_fd(vault, token, user, 30000, 6)  # 6 months
    test_create_fd(vault, token, user, 20000, 1)  # 1 month
    
    display_user_info(vault, token, user, "After Creating FDs")
    display_fd_info(vault, user)
    
    # Test 3: Simulate 1 month passage and early withdraw
    console.print("\n" + "="*50)
    simulate_time_passage(1)
    
    console.print("\nAfter 1 month:")
    display_fd_info(vault, user)
    
    # Early withdraw the 1-month FD (should be matured)
    test_withdraw_fd(vault, token, user, 2)  # 1-month FD
    
    # Early withdraw the 3-month FD (should be early withdrawal)
    test_early_withdraw_fd(vault, token, user, 0)  # 3-month FD
    
    display_user_info(vault, token, user, "After Withdrawals")
    display_fd_info(vault, user)
    
    # Test 4: Simulate more time and test renewal
    console.print("\n" + "="*50)
    simulate_time_passage(5)  # Total 6 months now
    
    console.print("\nAfter 6 months total:")
    display_fd_info(vault, user)
    
    # Renew the 6-month FD
    test_renew_fd(vault, token, user, 1, 3)  # Renew for 3 more months
    
    display_user_info(vault, token, user, "After Renewal")
    display_fd_info(vault, user)
    
    # Test 5: Balance Interest
    console.print("\n" + "="*50)
    test_balance_interest(vault, token, user)
    
    # Final state
    console.print("\n" + "="*50)
    display_user_info(vault, token, user, "Final State")
    display_fd_info(vault, user)
    
    console.print("\n[bold green]🎉 All tests completed successfully![/bold green]")

if __name__ == "__main__":
    main()