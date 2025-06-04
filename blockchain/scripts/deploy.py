from brownie import accounts, FixedDepositVault

def main():
    dev = accounts[0]

    print("Deploying FixedDepositVault (which also deploys MyToken)...")
    vault = FixedDepositVault.deploy({"from": dev})

    print(f"Vault deployed at: {vault.address}")
    print(f"MyToken deployed at: {vault.myToken()}")

    return vault
