// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor(
        address initialOwner
    ) ERC20("myToken", "mT") Ownable(initialOwner) {
        // Nothing more needed
    }

    function mint(address to, uint256 amount) external onlyOwner {
        amount = amount * 10 ** 18;
        _mint(to, amount);
    }

    function transferToUser(address recipient, uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, recipient, amount);
    }
}
