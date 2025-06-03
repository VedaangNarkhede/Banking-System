// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract myToken is ERC20, Ownable {
    bool public minted = false;

    constructor() ERC20("myToken", "mT") {
        // Set the deployer as the initial owner
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(!minted, "Mint already done");
        minted = true;
        amount = amount * 10 ** 18;
        _mint(to, amount);
    }
}
