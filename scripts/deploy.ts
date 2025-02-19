import { ethers } from "hardhat";

async function main() {
    const ReverseDutchAuction = await ethers.getContractFactory("ReverseDutchAuction");
    const auction = await ReverseDutchAuction.deploy();
    await auction.waitForDeployment();

    console.log(` ReverseDutchAuction deployed at: ${await auction.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
}); 