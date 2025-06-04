// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./myToken.sol";

contract FixedDepositVault {
    MyToken public myToken;

    uint256 public interestRate = 1; // 1% per month
    uint256 public earlyWithdrawalRate = 75; // 0.75% monthly in basis points
    uint256 public constant SECONDS_PER_MONTH = 30 days;

    struct FixedDeposit {
        uint256 amount;
        uint256 startTime;
        uint256 maturityPeriod; // in seconds
        bool withdrawn;
        bool renewed;
    }

    mapping(address => FixedDeposit[]) public fixedDeposits;

    constructor() {
        myToken = new MyToken(address(this));
        myToken.mint(address(this), 1000 * 10 ** 18);
    }
    function ETHtomT() external payable {
        require(msg.value > 0, "Send ETH to get tokens");
        uint256 tokenAmount = msg.value * 200000;
        myToken.mint(msg.sender, tokenAmount);
    }
    function mTtoETH(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Invalid amount");

        uint256 ethAmount = tokenAmount / 100;
        require(address(this).balance >= ethAmount, "Vault lacks ETH");

        myToken.transferFrom(msg.sender, address(this), tokenAmount);
        payable(msg.sender).transfer(ethAmount);
    }

    // Create Fixed Deposit
    function createFD(uint256 _amount, uint256 _months) external {
        require(_amount > 0, "Amount must be > 0");
        require(_months > 0, "Must be at least 1 month");

        myToken.transferFrom(msg.sender, address(this), _amount);

        fixedDeposits[msg.sender].push(
            FixedDeposit({
                amount: _amount,
                startTime: block.timestamp,
                maturityPeriod: _months * SECONDS_PER_MONTH,
                withdrawn: false,
                renewed: false
            })
        );
    }

    function calculateCompoundInterest(
        uint256 principal,
        uint256 ratePerMonth, // Use 1% as 100, 0.75% as 75 (basis points)
        uint256 months
    ) internal pure returns (uint256) {
        if (months == 0) return 0;

        uint256 multiplier = 1e18 + (ratePerMonth * 1e14); // Convert basis points to 18-decimal fixed-point
        uint256 compoundFactor = 1e18;

        for (uint256 i = 0; i < months; i++) {
            compoundFactor = (compoundFactor * multiplier) / 1e18;
        }

        uint256 totalAmount = (principal * compoundFactor) / 1e18;
        return totalAmount - principal;
    }

    // Withdraw after maturity
    function withdrawFD(uint256 _index) external {
        FixedDeposit storage fd = fixedDeposits[msg.sender][_index];

        require(!fd.withdrawn, "Already withdrawn");
        require(
            block.timestamp >= fd.startTime + fd.maturityPeriod,
            "FD not yet matured"
        );

        fd.withdrawn = true;

        uint256 monthsElapsed = (fd.maturityPeriod) / SECONDS_PER_MONTH;
        uint256 interest = calculateCompoundInterest(
            fd.amount,
            interestRate * 100,
            monthsElapsed
        ); // 1% -> 100 basis points

        myToken.transfer(msg.sender, fd.amount + interest);
    }

    // Early withdrawal before maturity
    function earlyWithdrawFD(uint256 _index) external {
        FixedDeposit storage fd = fixedDeposits[msg.sender][_index];

        require(!fd.withdrawn, "Already withdrawn");
        require(
            block.timestamp < fd.startTime + fd.maturityPeriod,
            "FD already matured - use regular withdraw"
        );

        fd.withdrawn = true;

        uint256 timeElapsed = block.timestamp - fd.startTime;
        uint256 monthsElapsed = timeElapsed / SECONDS_PER_MONTH;

        uint256 interest = calculateCompoundInterest(
            fd.amount,
            earlyWithdrawalRate,
            monthsElapsed
        );
        myToken.transfer(msg.sender, fd.amount + interest);
    }

    function renewFD(uint256 _index, uint256 _newMonths) external {
        FixedDeposit storage fd = fixedDeposits[msg.sender][_index];

        require(!fd.withdrawn, "Already withdrawn");
        require(
            block.timestamp >= fd.startTime + fd.maturityPeriod,
            "FD not matured"
        );

        fd.startTime = block.timestamp;
        fd.maturityPeriod = _newMonths * SECONDS_PER_MONTH;
        fd.renewed = true;
    }

    function getFDs(
        address user
    ) external view returns (FixedDeposit[] memory) {
        return fixedDeposits[user];
    }

    // View vault ETH balance
    function getVaultETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
