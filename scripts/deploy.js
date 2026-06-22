const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying sa adrese:", deployer.address);

    const DeadMansSwitch = await ethers.getContractFactory("DeadMansSwitch");
    const contract = await DeadMansSwitch.deploy(
        "0xBaa5c8dF8f58E984205B9e28f5d4f7aFA237d22e", // beneficiary adresa
        86400,   // 1 dan
        true,    // isRevocable
        true,    // isBeneficiaryChangeable
        true     // isMessageChangeable
    );

    await contract.waitForDeployment();
    console.log("Contract deployovan na:", await contract.getAddress());
}

main().catch(console.error);