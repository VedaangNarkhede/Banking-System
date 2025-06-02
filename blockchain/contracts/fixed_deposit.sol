// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FixedDepositVault {
    using SafeERC20 for IERC20;

    IERC20 public immutable myToken;
    uint256 public interestRate = 1; // 1% monthly
    uint256 public constant SECONDS_PER_MONTH = 30 days;
    uint256 public penaltyRate = 10; // 10% of interest on renewal

    struct FixedDeposit {
        uint256 amount;
        uint256 startTime;
        uint256 maturityPeriod; // in seconds
        bool withdrawn;
        bool renewed;
    }

    mapping(address => FixedDeposit[]) public fixedDeposits;

    constructor(address _tokenAddress) {
        myToken = IERC20(_tokenAddress); // Address of your deployed myToken contract
    }

    // Deposit tokens into a new Fixed Deposit
    function createFD(uint256 _amount, uint256 _months) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(_months > 0, "Must lock for at least 1 month");

        // Transfer tokens from user to this contract
        myToken.safeTransferFrom(msg.sender, address(this), _amount);

        fixedDeposits[msg.sender].push(FixedDeposit({
            amount: _amount,
            startTime: block.timestamp,
            maturityPeriod: _months * SECONDS_PER_MONTH,
            withdrawn: false,
            renewed: false
        }));
    }

    // Internal interest calculator (simple interest)
    function calculateInterest(FixedDeposit memory fd) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - fd.startTime;
        uint256 monthsElapsed = timeElapsed / SECONDS_PER_MONTH;

        uint256 interest = (fd.amount * interestRate * monthsElapsed) / 100;

        if (fd.renewed) {
            uint256 penalty = (interest * penaltyRate) / 100;
            interest -= penalty;
        }

        return interest;
    }

    // Withdraw after maturity
    function withdrawFD(uint256 _index) external {
        FixedDeposit storage fd = fixedDeposits[msg.sender][_index];

        require(!fd.withdrawn, "Already withdrawn");
        require(block.timestamp >= fd.startTime + fd.maturityPeriod, "FD not yet matured");

        fd.withdrawn = true;

        uint256 interest = calculateInterest(fd);
        uint256 total = fd.amount + interest;

        myToken.safeTransfer(msg.sender, total);
    }

    // Renew FD after maturity
    function renewFD(uint256 _index, uint256 _newMonths) external {
        FixedDeposit storage fd = fixedDeposits[msg.sender][_index];

        require(!fd.withdrawn, "Already withdrawn");
        require(block.timestamp >= fd.startTime + fd.maturityPeriod, "FD not yet matured");

        fd.startTime = block.timestamp;
        fd.maturityPeriod = _newMonths * SECONDS_PER_MONTH;
        fd.renewed = true;
    }

    // View all FDs of a user
    function getFDs(address user) external view returns (FixedDeposit[] memory) {
        return fixedDeposits[user];
    }
}
