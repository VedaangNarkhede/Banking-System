// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MyToken.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract FixedDepositVault is ReentrancyGuard, Ownable, Pausable {
    MyToken public myToken;

    // Constants for better maintainability
    uint256 public constant EXCHANGE_RATE = 200000; // mT per 1 ETH
    uint256 public constant SECONDS_PER_MONTH = 30 days;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Configurable rates (in basis points)
    uint256 public interestRate = 100; // 1% per month (100 basis points)
    uint256 public earlyWithdrawalRate = 75; // 0.75% per month (75 basis points)
    uint256 public balanceInterestRate = 50; // 0.5% per month (50 basis points)
    
    // Maximum limits for safety
    uint256 public constant MAX_DEPOSIT_MONTHS = 60; // 5 years max
    uint256 public constant MIN_DEPOSIT_AMOUNT = 1e15; // 0.001 mT minimum

    struct FixedDeposit {
        uint256 amount;
        uint256 startTime;
        uint256 maturityPeriod; // in seconds
        bool withdrawn;
        bool renewed;
    }

    mapping(address => FixedDeposit[]) public fixedDeposits;
    mapping(address => uint256) public lastBalanceInterestClaim;
    
    // Track total ETH backing the mT tokens
    uint256 public totalETHBacking;

    // Events
    event ETHConverted(address indexed user, uint256 ethAmount, uint256 mtAmount);
    event MTConverted(address indexed user, uint256 mtAmount, uint256 ethAmount);
    event FixedDepositCreated(address indexed user, uint256 amount, uint256 months, uint256 index);
    event FixedDepositWithdrawn(address indexed user, uint256 index, uint256 principal, uint256 interest);
    event FixedDepositRenewed(address indexed user, uint256 index, uint256 newMonths);
    event BalanceInterestClaimed(address indexed user, uint256 interest);
    event RatesUpdated(uint256 interestRate, uint256 earlyWithdrawalRate, uint256 balanceInterestRate);

    constructor(address tokenAddress, address initialOwner) Ownable(initialOwner) {
        myToken = MyToken(tokenAddress);
    }

    modifier validAmount(uint256 amount) {
        require(amount >= MIN_DEPOSIT_AMOUNT, "Amount below minimum");
        _;
    }

    modifier validMonths(uint256 months) {
        require(months > 0 && months <= MAX_DEPOSIT_MONTHS, "Invalid months");
        _;
    }

    function ETHtomT() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Send ETH to get tokens");

        uint256 tokenAmount = (EXCHANGE_RATE * 1e18 * msg.value) / 1 ether;
        
        // Track ETH backing
        totalETHBacking += msg.value;

        myToken.mint(msg.sender, tokenAmount);
        
        emit ETHConverted(msg.sender, msg.value, tokenAmount);
    }

    function mTtoETH(uint256 tokenAmount) external nonReentrant whenNotPaused validAmount(tokenAmount) {
        require(tokenAmount > 0, "Invalid amount");
        require(myToken.balanceOf(msg.sender) >= tokenAmount, "Insufficient mT balance");

        uint256 ethAmount = (tokenAmount * 1 ether) / (EXCHANGE_RATE * 1e18);
        require(address(this).balance >= ethAmount, "Insufficient ETH in vault");
        require(totalETHBacking >= ethAmount, "Insufficient ETH backing");

        // Burn the mT tokens instead of transferring to vault
        myToken.burnFrom(msg.sender, tokenAmount);
        
        // Reduce ETH backing
        totalETHBacking -= ethAmount;

        payable(msg.sender).transfer(ethAmount);
        
        emit MTConverted(msg.sender, tokenAmount, ethAmount);
    }

    function createFD(uint256 _amount, uint256 _months) 
        external 
        nonReentrant 
        whenNotPaused 
        validAmount(_amount) 
        validMonths(_months) 
    {
        require(myToken.balanceOf(msg.sender) >= _amount, "Insufficient balance");
        require(myToken.allowance(msg.sender, address(this)) >= _amount, "Insufficient allowance");

        myToken.transferFrom(msg.sender, address(this), _amount);

        uint256 index = fixedDeposits[msg.sender].length;
        fixedDeposits[msg.sender].push(
            FixedDeposit({
                amount: _amount,
                startTime: block.timestamp,
                maturityPeriod: _months * SECONDS_PER_MONTH,
                withdrawn: false,
                renewed: false
            })
        );

        emit FixedDepositCreated(msg.sender, _amount, _months, index);
    }

    function calculateCompoundInterest(
        uint256 principal,
        uint256 rateInBasisPoints,
        uint256 months
    ) internal pure returns (uint256) {
        if (months == 0) return 0;

        // Convert basis points to decimal (scaled by 1e18)
        uint256 monthlyRate = (rateInBasisPoints * 1e18) / BASIS_POINTS;
        uint256 multiplier = 1e18 + monthlyRate;
        uint256 compoundFactor = 1e18;

        for (uint256 i = 0; i < months; i++) {
            compoundFactor = (compoundFactor * multiplier) / 1e18;
        }

        uint256 totalAmount = (principal * compoundFactor) / 1e18;
        return totalAmount > principal ? totalAmount - principal : 0;
    }

    function withdrawFD(uint256 _index) external nonReentrant whenNotPaused {
        require(_index < fixedDeposits[msg.sender].length, "Invalid FD index");
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
            interestRate,
            monthsElapsed
        );

        uint256 totalAmount = fd.amount + interest;
        
        // Mint interest tokens
        if (interest > 0) {
            myToken.mint(address(this), interest);
        }

        myToken.transfer(msg.sender, totalAmount);
        
        emit FixedDepositWithdrawn(msg.sender, _index, fd.amount, interest);
    }

    function earlyWithdrawFD(uint256 _index) external nonReentrant whenNotPaused {
        require(_index < fixedDeposits[msg.sender].length, "Invalid FD index");
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

        uint256 totalAmount = fd.amount + interest;
        
        // Mint interest tokens
        if (interest > 0) {
            myToken.mint(address(this), interest);
        }

        myToken.transfer(msg.sender, totalAmount);
        
        emit FixedDepositWithdrawn(msg.sender, _index, fd.amount, interest);
    }

    function renewFD(uint256 _index, uint256 _newMonths) 
        external 
        nonReentrant 
        whenNotPaused 
        validMonths(_newMonths) 
    {
        require(_index < fixedDeposits[msg.sender].length, "Invalid FD index");
        FixedDeposit storage fd = fixedDeposits[msg.sender][_index];

        require(!fd.withdrawn, "Already withdrawn");
        require(
            block.timestamp >= fd.startTime + fd.maturityPeriod,
            "FD not matured"
        );

        // Calculate and add maturity interest to principal
        uint256 monthsElapsed = fd.maturityPeriod / SECONDS_PER_MONTH;
        uint256 interest = calculateCompoundInterest(
            fd.amount,
            interestRate,
            monthsElapsed
        );

        if (interest > 0) {
            myToken.mint(address(this), interest);
            fd.amount += interest;
        }

        fd.startTime = block.timestamp;
        fd.maturityPeriod = _newMonths * SECONDS_PER_MONTH;
        fd.renewed = true;

        emit FixedDepositRenewed(msg.sender, _index, _newMonths);
    }

    function getFDs(address user) external view returns (FixedDeposit[] memory) {
        return fixedDeposits[user];
    }

    function getFDCount(address user) external view returns (uint256) {
        return fixedDeposits[user].length;
    }

    function pendingBalanceInterest(address _user) public view returns (uint256) {
        uint256 lastClaim = lastBalanceInterestClaim[_user];
        if (lastClaim == 0) return 0;

        uint256 elapsed = block.timestamp - lastClaim;
        uint256 fullMonths = elapsed / SECONDS_PER_MONTH;
        if (fullMonths == 0) return 0;

        uint256 principal = myToken.balanceOf(_user);
        uint256 interest = (principal * balanceInterestRate * fullMonths) / BASIS_POINTS;
        return interest;
    }

    function claimBalanceInterest() external nonReentrant whenNotPaused {
        uint256 lastClaim = lastBalanceInterestClaim[msg.sender];

        if (lastClaim == 0) {
            lastBalanceInterestClaim[msg.sender] = block.timestamp;
            return;
        }

        uint256 interest = pendingBalanceInterest(msg.sender);
        require(interest > 0, "No interest to claim");

        uint256 elapsed = block.timestamp - lastClaim;
        uint256 fullMonths = elapsed / SECONDS_PER_MONTH;

        lastBalanceInterestClaim[msg.sender] = lastClaim + (fullMonths * SECONDS_PER_MONTH);

        myToken.mint(msg.sender, interest);
        
        emit BalanceInterestClaimed(msg.sender, interest);
    }

    // Admin functions
    function updateRates(
        uint256 _interestRate,
        uint256 _earlyWithdrawalRate,
        uint256 _balanceInterestRate
    ) external onlyOwner {
        require(_interestRate <= 1000, "Interest rate too high"); // Max 10%
        require(_earlyWithdrawalRate <= 500, "Early withdrawal rate too high"); // Max 5%
        require(_balanceInterestRate <= 200, "Balance interest rate too high"); // Max 2%

        interestRate = _interestRate;
        earlyWithdrawalRate = _earlyWithdrawalRate;
        balanceInterestRate = _balanceInterestRate;

        emit RatesUpdated(_interestRate, _earlyWithdrawalRate, _balanceInterestRate);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdrawETH() external onlyOwner {
        require(paused(), "Can only withdraw when paused");
        payable(owner()).transfer(address(this).balance);
    }

    // View functions
    function getVaultETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getTotalETHBacking() external view returns (uint256) {
        return totalETHBacking;
    }

    function getExchangeRate() external pure returns (uint256) {
        return EXCHANGE_RATE;
    }

    function getCurrentRates() external view returns (uint256, uint256, uint256) {
        return (interestRate, earlyWithdrawalRate, balanceInterestRate);
    }

    receive() external payable {
        // Allow receiving ETH
    }
}