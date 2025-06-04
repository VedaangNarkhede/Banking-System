from brownie import accounts, myToken, FixedDepositVault

def main():
    dev = accounts[0]
    token = myToken.deploy(dev.address, {"from": dev})
    token.mint(dev.address, 1000 * 10**18, {"from": dev})
    vault = FixedDepositVault.deploy(token.address, {"from": dev})
    token.approve(vault.address, 2**256 - 1, {"from": dev})
    print(f"Token deployed at: {token.address}")
    print(f"Vault deployed at: {vault.address}")
    return token, vault
