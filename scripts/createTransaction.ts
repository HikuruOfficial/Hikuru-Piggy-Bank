// const { ethers } = require("hardhat");

async function transferEther() {

    const piggyBankContract = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"; // Replace with your contract's address
    const tetherContractAddress = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"; // Tether Contract Address
    const [deployer, owner_1, owner_2] = await ethers.getSigners();

    const tetherABI = [{"inputs": [  {    "internalType": "address",    "name": "to",    "type": "address"  },  {    "internalType": "uint256",    "name": "value",    "type": "uint256"  }],"name": "transfer","outputs": [  {    "internalType": "bool",    "name": "",    "type": "bool"  }],"stateMutability": "nonpayable","type": "function"},     {"inputs": [  {    "internalType": "address",    "name": "account",    "type": "address"  }],"name": "balanceOf","outputs": [  {    "internalType": "uint256",    "name": "",    "type": "uint256"  }],"stateMutability": "view","type": "function"}]
    const tetherContract = new ethers.Contract(tetherContractAddress, tetherABI, deployer);


    const contractFactory = await ethers.getContractFactory("HikuruPiggyBank");
    const contract = contractFactory.attach(piggyBankContract);

    const BankWithOwner1 = contract.connect(owner_1);

    const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Replace with the recipient's address
    const amount = ethers.parseUnits("100", 18); // Sending 100 USDT (assuming Tether has 6 decimals)

    
    const txData = {
        to: recipient,
        data: "0x", // For Ether transfer, the data field is usually empty
        value: ethers.parseEther("0.5") // Sending 0.5 Ether
    };
    
    const comment = "Transfer 0.5 ETH to " + recipient;
    
    // Make sure to pass an array of Data structs
    const txResponse = await BankWithOwner1.createTransaction([txData, txData], comment);
    const txReceipt = await txResponse.wait();

    const lastId = await contract.getLastTransactionId();
    // Assuming the event log is the first in the array
    console.log(`Transaction Index: ${lastId}`);
    console.log(`Transaction hash: ${txReceipt.hash}`);


    const piggyBankBalance = await ethers.provider.getBalance(contract.target);
    console.log(`\n\nPiggy Bank Ether Balance: ${ethers.formatEther(piggyBankBalance)} ETH`);
    console.log(`Piggy Bank Tether Balance: ${ethers.formatEther(await tetherContract.balanceOf(contract.target))} USDT`);
}




async function transferTether() {
    const piggyBankContract = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"; // Replace with your contract's address
    const tetherContractAddress = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"; // Tether Contract Address
    const [deployer, owner_1, owner_2] = await ethers.getSigners();

    const tetherABI = [{"inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "value", "type": "uint256"}], "name": "transfer", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}];
    const tetherContract = new ethers.Contract(tetherContractAddress, tetherABI, deployer);

    const contractFactory = await ethers.getContractFactory("HikuruPiggyBank");
    const contract = contractFactory.attach(piggyBankContract);

    const BankWithOwner1 = contract.connect(owner_1);

    const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Replace with the recipient's address
    const amount = ethers.parseUnits("100", 18); // Sending 100 USDT (assuming Tether has 6 decimals)

    // Encode the ERC20 transfer function call
    const tetherInterface = new ethers.Interface(tetherABI);
    const data = tetherInterface.encodeFunctionData("transfer", [recipient, amount]);

    const txData = {
        to: tetherContractAddress,
        data: data,
        value: 0 // For ERC20 transfer, the value is typically 0 as no Ether is being sent
    };

    const comment = "Transfer 100 USDT";

    // Execute the transaction using the createTransaction function in Solidity
    const txResponse = await BankWithOwner1.createTransaction([txData, txData, txData], comment);
    const txReceipt = await txResponse.wait();

    const lastId = await contract.getLastTransactionId();
    console.log(`Transaction Index: ${lastId}`);
    console.log(`Transaction hash: ${txReceipt.hash}`);

    const piggyBankBalance = await ethers.provider.getBalance(contract.target);
    console.log(`\n\nPiggy Bank Ether Balance: ${ethers.formatEther(piggyBankBalance)} ETH`);
    console.log(`Piggy Bank Tether Balance: ${ethers.formatEther(await tetherContract.balanceOf(contract.target))} USDT`);
}


// transferEther().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });


transferTether().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});