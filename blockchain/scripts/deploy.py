from brownie import accounts, FixedDepositVault, MyToken

def main():
    acc = accounts[0]
    
    # 1. Deploy MyToken with account 0 as owner
    print("Deploying MyToken...")
    token = MyToken.deploy(acc.address, {"from": acc})
    print(f"MyToken deployed at: {token.address}")
    
    # 2. Deploy FixedDepositVault with MyToken address
    print("\nDeploying FixedDepositVault...")
    vault = FixedDepositVault.deploy(token.address, {"from": acc})
    print(f"FixedDepositVault deployed at: {vault.address}")
    
    # 3. Transfer ownership of MyToken to FixedDepositVault
    print("\nTransferring MyToken ownership to FixedDepositVault...")
    token.transferOwnership(vault.address, {"from": acc})
    print("Ownership transferred successfully")
    
    # 4. Generate buffer currency
    print("\nGenerating buffer currency...")
    vault.generate_currency({"from": acc})
    acc.transfer(vault.address, "1 ether")
    print("Buffer currency generated successfully")
    
    return vault, token


# def main():
#     acc = accounts[0]

#     print("Deploying FixedDepositVault (which also deploys MyToken)...")
#     vault = FixedDepositVault.deploy({"from": acc})

#     print(f"Vault deployed at: {vault.address}")
#     print(f"MyToken deployed at: {vault.myToken()}")

#     return vault
