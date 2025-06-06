// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./myToken.sol";

contract FixedDepositVault {
    MyToken public myToken;

    uint256 public interestRate = 1; // 1% per month
    uint256 public earlyWithdrawalRate = 75; // 0.75% monthly in basis points
    uint256 public constant SECONDS_PER_MONTH = 30 days;
    uint256 public constant balance_interest = 50;

    constructor(address tokenAddress) {
        myToken = MyToken(tokenAddress);

        // Mint some tokens to the vault (optional)
    }

    function ETHtomT() external payable {
        require(msg.value > 0, "Send ETH to get tokens");

        // Properly scaled token mint (200,000 tokens per 1 ETH)
        uint256 tokenAmount = (200000 * 10 ** 18 * msg.value) / 1 ether;

        myToken.mint(msg.sender, tokenAmount);
    }

    function mTtoETH(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Invalid amount");

        // Calculate how much ETH to return
        uint256 ethAmount = (tokenAmount * 1 ether) / (200000 * 10 ** 18);

        require(myToken.allowance(msg.sender, address(this)) >= tokenAmount, "Vault not approved");
        require(address(this).balance >= ethAmount, "Vault lacks ETH");

        myToken.transferFrom(msg.sender, address(this), tokenAmount);
        payable(msg.sender).transfer(ethAmount);
    }

    struct FixedDeposit {
        uint256 amount;
        uint256 startTime;
        uint256 maturityPeriod; // in seconds
        bool withdrawn;
        bool renewed;
    }

    mapping(address => FixedDeposit[]) public fixedDeposits;
    mapping(address => uint256) public lastBalanceInterestClaim;

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
        uint256 ratePerMonth,
        uint256 months
    ) internal pure returns (uint256) {
        if (months == 0) return 0;

        uint256 multiplier = 1e18 + (ratePerMonth * 1e14);
        uint256 compoundFactor = 1e18;

        for (uint256 i = 0; i < months; i++) {
            compoundFactor = (compoundFactor * multiplier) / 1e18;
        }

        uint256 totalAmount = (principal * compoundFactor) / 1e18;
        return totalAmount - principal;
    }

    function withdrawFD(uint256 _index) external {
        FixedDeposit storage fd = fixedDeposits[msg.sender][_index];

        require(!fd.withdrawn, "Already withdrawn");
        require(
            block.timestamp >= fd.startTime + fd.maturityPeriod,
            "FD not yet matured"
        );

        fd.withdrawn = true;

        uint256 monthsElapsed = fd.maturityPeriod / SECONDS_PER_MONTH;
        uint256 interest = calculateCompoundInterest(
            fd.amount,
            interestRate * 100,
            monthsElapsed
        );

        myToken.transfer(msg.sender, fd.amount + interest);
    }

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

    function getFDs(address user) external view returns (FixedDeposit[] memory) {
        return fixedDeposits[user];
    }

    function pendingBalanceInterest(address _user) public view returns (uint256) {
        uint256 lastClaim = lastBalanceInterestClaim[_user];
        uint256 elapsed = block.timestamp - lastClaim;
        uint256 fullMonths = elapsed / SECONDS_PER_MONTH;
        if (fullMonths == 0) {
            return 0;
        }

        uint256 principal = myToken.balanceOf(_user);
        uint256 interest = (principal * balance_interest * fullMonths) / 10000;
        return interest;
    }

    function claimBalanceInterest() external {
        uint256 lastClaim = lastBalanceInterestClaim[msg.sender];

        if (lastClaim == 0) {
            lastBalanceInterestClaim[msg.sender] = block.timestamp;
            return;
        }

        uint256 interest = pendingBalanceInterest(msg.sender);
        require(interest > 0, "No full month elapsed or zero balance");

        uint256 elapsed = block.timestamp - lastClaim;
        uint256 fullMonths = elapsed / SECONDS_PER_MONTH;

        lastBalanceInterestClaim[msg.sender] = lastClaim + (fullMonths * SECONDS_PER_MONTH);

        myToken.mint(msg.sender, interest);
    }

    function getVaultETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}

    function generate_currency() internal{
        myToken.mint(address(this), 200000*10**18);
    }
}
