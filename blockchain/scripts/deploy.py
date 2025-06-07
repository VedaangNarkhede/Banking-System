from brownie import accounts, FixedDepositVault, MyToken, network, config
import os

def main():
    acc = accounts.add(config["wallets"]["from_key"])
    
    print("Deploying MyToken...")
    token = MyToken.deploy(acc.address, {"from": acc})
    print(f"MyToken deployed at: {token.address}")

    print("\nDeploying FixedDepositVault...")
    vault = FixedDepositVault.deploy(token.address, {"from": acc})
    print(f"Vault deployed at: {vault.address}")

    print("\nTransferring MyToken ownership to FixedDepositVault...")
    token.transferOwnership(vault.address, {"from": acc})
    print("Ownership transferred successfully")

    print("\nGenerating buffer currency...")
    vault.generate_currency({"from": acc})
    acc.transfer(vault.address, "1 ether")
    print("Buffer currency generated successfully")

    return vault, token
