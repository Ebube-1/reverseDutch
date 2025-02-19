import { ethers } from "hardhat";

async function main() {
    const AUCTION_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    const [seller] = await ethers.getSigners();
    const auctionContract = await ethers.getContractAt("ReverseDutchAuction", AUCTION_CONTRACT_ADDRESS, seller);
    const token = await ethers.getContractAt("IERC20", TOKEN_ADDRESS, seller);

    const amount = ethers.parseUnits("100", 18);
    const initialPrice = ethers.parseUnits("1000", 18);
    const duration = 300; // 5 minutes
    const priceDecreaseRate = ethers.parseUnits("2", 18);

    console.log("🔹 Approving tokens...");
    await token.approve(await auctionContract.getAddress(), amount);

    console.log("🔹 Listing tokens on auction...");
    const tx = await auctionContract.createAuction(
        await token.getAddress(),
        amount,
        initialPrice,
        duration,
        priceDecreaseRate
    );

    await tx.wait();
    console.log(` Tokens listed successfully on auction!`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});