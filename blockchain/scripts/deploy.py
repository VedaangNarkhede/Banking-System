from brownie import accounts, myToken, FixedDepositVault


def main():
    # Select deployer account
    dev = accounts[0]

    print("Deploying myToken...")
    token = myToken.deploy({"from": dev})
    print(f"myToken deployed at: {token.address}")

    # Check if minting has already been done
    if not token.minted():
        print("Minting tokens to deployer (only once)...")
        tx = token.mint(dev.address, 1000, {"from": dev})  # Amount in tokens (not wei), contract scales
        tx.wait(1)
        print(f"Minted 1000 tokens to {dev.address}")
    else:
        print("Minting already done. Skipping...")

    print("Deploying FixedDepositVault...")
    vault = FixedDepositVault.deploy(token.address, {"from": dev})
    print(f"FixedDepositVault deployed at: {vault.address}")

    print("Deployment complete!")
