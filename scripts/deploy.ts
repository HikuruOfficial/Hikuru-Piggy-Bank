import { ethers } from "hardhat";

async function main() {
	const tetherContract = await ethers.deployContract("Tether", [], {
	});
	await tetherContract.waitForDeployment();
	console.log(`Tether deployed: ${tetherContract.target}`);


    const [deployer, owner_1, owner_2] = await ethers.getSigners();
    console.log("Deploying Piggy Bank...");


    // Deploying the contract
    const contractFactory = await ethers.getContractFactory("HikuruPiggyBank");
    const contract = await contractFactory.deploy(
        [owner_1.address, owner_2.address],
        1
    );
    await contract.waitForDeployment();
    


    console.log("Piggy Bank contract deployed to: ", contract.target);
    console.log("Deployer: ", deployer.address);


    // Send 10 ETH to the contract
    const tx = {
        to: contract.target,
        value: ethers.parseEther("10")
    };

    const receipt = await deployer.sendTransaction(tx);
    await receipt.wait();


    await tetherContract.mint(contract.target, ethers.parseUnits("1000", 18));

    const piggyBankBalance = await ethers.provider.getBalance(contract.target);
    console.log(`\n\nPiggy Bank Ether Balance: ${ethers.formatEther(piggyBankBalance)} ETH`);
    console.log(`Piggy Bank Tether Balance: ${ethers.formatEther(await tetherContract.balanceOf(contract.target))} USDT`);

    return { contract, deployer };
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

