from brownie import accounts, myToken, FixedDepositVault

def main():
    dev = accounts[0]

    print("Deploying myToken...")
    token = myToken.deploy(dev.address, {"from": dev})  # ✅ Pass owner explicitly
    print(f"myToken deployed at: {token.address}")

    print("Minting tokens to deployer...")
    token.mint(dev.address, 1000, {"from": dev})  # Don't multiply by 10**18, it's done in contract

    print("Deploying FixedDepositVault...")
    vault = FixedDepositVault.deploy(token.address, {"from": dev})
    print(f"FixedDepositVault deployed at: {vault.address}")

    print("Deployment complete!")
