import { expect } from "chai";
import { ethers } from "hardhat";

describe("ReverseDutchAuction", function () {
    let auction: any;
    let token: any;
    let owner: any;
    let buyer: any;
    let buyer2: any;
    let auctionId = 1;

    before(async function () {
        [owner, buyer, buyer2] = await ethers.getSigners();

        // Deploy ERC20 Mock Token
        const Token = await ethers.getContractFactory("ERC20Mock");
        token = await Token.deploy("Test Token", "TT", owner.address, ethers.parseUnits("10000", 18));
        await token.waitForDeployment();

        // Deploy Reverse Dutch Auction contract
        const ReverseDutchAuction = await ethers.getContractFactory("ReverseDutchAuction");
        auction = await ReverseDutchAuction.deploy();
        await auction.waitForDeployment();
    });

    it("Should allow a seller to list tokens for auction", async function () {
        const amount = ethers.parseUnits("100", 18);
        const initialPrice = ethers.parseUnits("1000", 18);
        const duration = 300; // 5 minutes
        const priceDecreaseRate = ethers.parseUnits("2", 18);

        await token.connect(owner).approve(await auction.getAddress(), amount);
        await auction.createAuction(await token.getAddress(), amount, initialPrice, duration, priceDecreaseRate);

        const auctionData = await auction.auctions(auctionId);
        expect(auctionData.seller).to.equal(owner.address);
        expect(auctionData.amount).to.equal(amount);
    });

    it("Should decrease price over time", async function () {
        const priceBefore = await auction.getCurrentPrice(auctionId);
        console.log(`🔹 Price before time increase: ${ethers.formatUnits(priceBefore, 18)} TT`);

        await ethers.provider.send("evm_increaseTime", [120]); // Simulate 2 minutes passed
        await ethers.provider.send("evm_mine");

        const priceAfter = await auction.getCurrentPrice(auctionId);
        console.log(`🔹 Price after 2 minutes: ${ethers.formatUnits(priceAfter, 18)} TT`);

        expect(priceAfter).to.be.lessThan(priceBefore);
    });

    it("Should allow only one buyer to purchase", async function () {
        await ethers.provider.send("evm_increaseTime", [120]); // Advance another 2 minutes
        await ethers.provider.send("evm_mine");

        const currentPrice = await auction.getCurrentPrice(auctionId);
        console.log(`🔹 Buying at price: ${ethers.formatUnits(currentPrice, 18)} TT`);

        await token.connect(buyer).approve(await auction.getAddress(), currentPrice);
        await auction.connect(buyer).buy(auctionId);

        await expect(auction.connect(buyer2).buy(auctionId)).to.be.revertedWith("Auction is not active");
    });

    it("Should correctly swap funds and tokens", async function () {
        const buyerBalanceBefore = await token.balanceOf(buyer.address);
        const sellerBalanceBefore = await token.balanceOf(owner.address);

        console.log(`🔹 Buyer Balance Before: ${ethers.formatUnits(buyerBalanceBefore, 18)} TT`);
        console.log(`🔹 Seller Balance Before: ${ethers.formatUnits(sellerBalanceBefore, 18)} TT`);

        await ethers.provider.send("evm_increaseTime", [180]); // Advance 3 more minutes
        await ethers.provider.send("evm_mine");

        const currentPrice = await auction.getCurrentPrice(auctionId);
        await token.connect(buyer).approve(await auction.getAddress(), currentPrice);
        await auction.connect(buyer).buy(auctionId);

        const buyerBalanceAfter = await token.balanceOf(buyer.address);
        const sellerBalanceAfter = await token.balanceOf(owner.address);

        console.log(`✅ Buyer Balance After: ${ethers.formatUnits(buyerBalanceAfter, 18)} TT`);
        console.log(`✅ Seller Balance After: ${ethers.formatUnits(sellerBalanceAfter, 18)} TT`);

        expect(buyerBalanceAfter).to.be.greaterThan(buyerBalanceBefore);
        expect(sellerBalanceAfter).to.be.lessThan(sellerBalanceBefore);
    });

    it("Should handle no buyer before auction ends", async function () {
        const amount = ethers.parseUnits("50", 18);
        const initialPrice = ethers.parseUnits("500", 18);
        const duration = 60; // 1 minute
        const priceDecreaseRate = ethers.parseUnits("5", 18);

        await token.connect(owner).approve(await auction.getAddress(), amount);
        await auction.createAuction(await token.getAddress(), amount, initialPrice, duration, priceDecreaseRate);

        auctionId++;

        await ethers.provider.send("evm_increaseTime", [70]); // Simulate auction expiration
        await ethers.provider.send("evm_mine");

        await expect(auction.connect(buyer).buy(auctionId)).to.be.revertedWith("Auction is not active");
    });
});