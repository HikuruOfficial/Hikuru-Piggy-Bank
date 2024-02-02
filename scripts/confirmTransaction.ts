const { ethers } = require("hardhat");


async function main() {
    const piggyBankContract = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"; // Replace with your contract's address
    const tetherContractAddress = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"; // Tether Contract Address

    const [deployer, owner_1, owner_2] = await ethers.getSigners();

    const tetherABI = [{"inputs": [  {    "internalType": "address",    "name": "to",    "type": "address"  },  {    "internalType": "uint256",    "name": "value",    "type": "uint256"  }],"name": "transfer","outputs": [  {    "internalType": "bool",    "name": "",    "type": "bool"  }],"stateMutability": "nonpayable","type": "function"},     {"inputs": [  {    "internalType": "address",    "name": "account",    "type": "address"  }],"name": "balanceOf","outputs": [  {    "internalType": "uint256",    "name": "",    "type": "uint256"  }],"stateMutability": "view","type": "function"}]
    const tetherContract = new ethers.Contract(tetherContractAddress, tetherABI, deployer);

    const contractFactory = await ethers.getContractFactory("HikuruPiggyBank");
    const contract = contractFactory.attach(piggyBankContract);

    //making approve Tether for HikuruQuestsFactoryV1
    const BankWithOwner2 = contract.connect(owner_2);


    const txIndex = 4; // Replace with the index of the transaction to confirm

    let piggyBankBalance = await ethers.provider.getBalance(contract.target);
    console.log(`Piggy Bank Ether Balance: ${ethers.formatEther(piggyBankBalance)} ETH`);

    const tx = await BankWithOwner2.confirmTransaction(txIndex);
    await tx.wait();

    console.log(`Transaction confirmed: ${tx.hash}`);

    piggyBankBalance = await ethers.provider.getBalance(contract.target);
    console.log(`Piggy Bank Ether Balance: ${ethers.formatEther(piggyBankBalance)} ETH`);
    console.log(`Piggy Bank Tether Balance: ${ethers.formatEther(await tetherContract.balanceOf(contract.target))} USDT`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
