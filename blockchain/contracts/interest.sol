// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMyToken {
    function balanceOf(address account) external view returns (uint256);
    function mint(address to, uint256 amount) external;
}

contract SavingsInterest {
    IMyToken public token;
    uint256 public monthlyRate = 5; 

    mapping(address => uint256) public lastUpdated;

    constructor(address tokenAddress) {
        token = IMyToken(tokenAddress);
    }

    function applyInterest(address user) public {
        uint256 last = lastUpdated[user];

        if (last == 0) {
            lastUpdated[user] = block.timestamp;
            return;
        }

        uint256 monthsElapsed = (block.timestamp - last) / 30 days;
        if (monthsElapsed == 0) return;

        uint256 balance = token.balanceOf(user);
        if (balance == 0) {
            lastUpdated[user] = block.timestamp;
            return;
        }

        uint256 interest = (balance * monthlyRate * monthsElapsed) / 1000;
        token.mint(user, interest);

        lastUpdated[user] = block.timestamp;
    }

    function testApplyInterest(address user) public {
        uint256 balance = token.balanceOf(user);
        require(balance > 0, "No balance");

        uint256 interest = (balance * monthlyRate) / 1000;
        token.mint(user, interest);
    }
}