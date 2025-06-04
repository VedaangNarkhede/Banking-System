from brownie import accounts, myToken, FixedDepositVault

def main():
    dev = accounts[0]

    print("Deploying myToken...")
    token = myToken.deploy(dev.address, {"from": dev})  # ✅ Pass owner explicitly
    print(f"myToken deployed at: {token.address}")

    print("Minting tokens to deployer...")
    token.mint(dev.address, 1000, {"from": dev})  # Assuming token uses 18 decimals internally

    print("Deploying FixedDepositVault...")
    vault = FixedDepositVault.deploy(token.address, {"from": dev})
    print(f"FixedDepositVault deployed at: {vault.address}")

    print("Approving FixedDepositVault to spend tokens on behalf of deployer...")
    token.approve(vault.address, 1000, {"from": dev})  # Or token.totalSupply() if you want to approve all

    print("Deployment complete!")
