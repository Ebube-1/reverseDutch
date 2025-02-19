import { ethers } from "hardhat";

async function main() {
    console.log("Deploying Mock ERC20 Token...");
    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy();
    await token.waitForDeployment();

    console.log(`Mock ERC20 Token deployed at: ${await token.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});