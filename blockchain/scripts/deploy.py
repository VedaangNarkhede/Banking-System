from brownie import accounts, FixedDepositVault, MyToken

def main():
    dev = accounts[0]
    
    # 1. Deploy MyToken with account 0 as owner
    print("Deploying MyToken...")
    token = MyToken.deploy(dev.address, {"from": dev})
    print(f"MyToken deployed at: {token.address}")
    
    # 2. Deploy FixedDepositVault with MyToken address
    print("\nDeploying FixedDepositVault...")
    vault = FixedDepositVault.deploy(token.address, {"from": dev})
    print(f"FixedDepositVault deployed at: {vault.address}")
    
    # 3. Transfer ownership of MyToken to FixedDepositVault
    print("\nTransferring MyToken ownership to FixedDepositVault...")
    token.transferOwnership(vault.address, {"from": dev})
    print("Ownership transferred successfully")
    
    # 4. Generate buffer currency
    print("\nGenerating buffer currency...")
    # Note: generate_currency is internal, so we need to call it through a transaction
    # that will trigger it internally. We can do this by sending some ETH to the vault
    # which will trigger the receive function and then generate_currency
    dev.transfer(vault.address, "0.1 ether")
    print("Buffer currency generated successfully")
    
    return vault, token


# def main():
#     dev = accounts[0]

#     print("Deploying FixedDepositVault (which also deploys MyToken)...")
#     vault = FixedDepositVault.deploy({"from": dev})

#     print(f"Vault deployed at: {vault.address}")
#     print(f"MyToken deployed at: {vault.myToken()}")

#     return vault
