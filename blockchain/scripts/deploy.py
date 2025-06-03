from brownie import accounts, network, config, myToken, FixedDepositVault


def main():
    # Select a deployer account
    dev = accounts[0]  # or use accounts.load("your_account") if unlocked

    print("Deploying myToken...")
    token = myToken.deploy({"from": dev})
    print(f"myToken deployed at: {token.address}")

    print("Minting tokens to deployer...")
    token.mint(dev.address, 1000 * 10**18, {"from": dev})

    print("Deploying FixedDepositVault...")
    vault = FixedDepositVault.deploy(token.address, {"from": dev})
    print(f"FixedDepositVault deployed at: {vault.address}")

    print("Deployment complete!")
