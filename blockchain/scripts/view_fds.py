from brownie import FixedDepositVault, accounts

def main():
    user = accounts[0]
    vault = FixedDepositVault[-1]

    fds = vault.getFDs(user.address)
    print(f"Found {len(fds)} fixed deposits:")
    for i, fd in enumerate(fds):
        print(f"\nFD #{i}")
        print(f"  Amount: {fd[0] / 10**18:.4f} tokens")
        print(f"  Start Time: {fd[1]}")
        print(f"  Maturity Period: {fd[2]} seconds")
        print(f"  Withdrawn: {fd[3]}")
        print(f"  Renewed: {fd[4]}")
