// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract myToken is ERC20 {
    constructor() ERC20("myToken", "mT") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    
}