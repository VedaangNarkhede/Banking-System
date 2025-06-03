// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract myToken is ERC20, Ownable {
    bool public minted = false;

    constructor(
        address initialOwner
    ) ERC20("myToken", "mT") Ownable(initialOwner) {
        // Nothing more needed
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(!minted, "Mint already done");
        minted = true;
        amount = amount * 10 ** 18;
        _mint(to, amount);
    }

    function transferToUser(address recipient, uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, recipient, amount);
    }
}
