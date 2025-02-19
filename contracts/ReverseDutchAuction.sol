// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ReverseDutchAuction {
    struct Auction {
        address seller;
        address token;
        uint256 initialPrice;
        uint256 startTime;
        uint256 duration;
        uint256 priceDecreaseRate;
        uint256 amount;
        bool active;
    }

    mapping(uint256 => Auction) public auctions;
    uint256 public auctionCounter;
    address public tokenAddress;

    event AuctionCreated(uint256 auctionId, address seller, address token, uint256 amount, uint256 initialPrice, uint256 duration, uint256 priceDecreaseRate);
    event AuctionFinalized(uint256 auctionId, address buyer, uint256 finalPrice);

    constructor(address _tokenAddress) {
    tokenAddress = _tokenAddress;
}

    function createAuction(
        address token,
        uint256 amount,
        uint256 initialPrice,
        uint256 duration,
        uint256 priceDecreaseRate
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(initialPrice > 0, "Initial price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        // Transfer tokens from seller to contract
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Create new auction
        auctionCounter++;
        auctions[auctionCounter] = Auction({
            seller: msg.sender,
            token: token,
            initialPrice: initialPrice,
            startTime: block.timestamp,
            duration: duration,
            priceDecreaseRate: priceDecreaseRate,
            amount: amount,
            active: true
        });

        emit AuctionCreated(auctionCounter, msg.sender, token, amount, initialPrice, duration, priceDecreaseRate);
    }

    function getCurrentPrice(uint256 auctionId) public view returns (uint256) {
        Auction memory auction = auctions[auctionId];
        require(auction.active, "Auction is not active");

        uint256 elapsedTime = block.timestamp - auction.startTime;
        if (elapsedTime >= auction.duration) {
            return auction.initialPrice - (auction.priceDecreaseRate * auction.duration);
        }

        return auction.initialPrice - (auction.priceDecreaseRate * elapsedTime);
    }

    function buy(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction is not active");

        uint256 currentPrice = getCurrentPrice(auctionId);
        auction.active = false;

        // Transfer payment from buyer to seller
        IERC20(auction.token).transferFrom(msg.sender, auction.seller, currentPrice);

        // Transfer tokens from contract to buyer
        IERC20(auction.token).transfer(msg.sender, auction.amount);

        emit AuctionFinalized(auctionId, msg.sender, currentPrice);
    }
}