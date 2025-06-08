// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable, ERC20Burnable  {
    constructor(address initialOwner)
        ERC20("GitCoin", "GTC")
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function transferToUser(address recipient, uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, recipient, amount);
    }
}