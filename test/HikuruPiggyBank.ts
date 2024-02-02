const { expect } = require("chai");
const { ethers } = require("hardhat");

const tetherABI = [{"inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "value", "type": "uint256"}], "name": "transfer", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}];


describe("HikuruPiggyBank", function () {
  let piggyBank: {
    target: any;
      getTransaction(arg0: number): any;
      waitForDeployment(): unknown; deployed: () => any; numConfirmationsRequired: () => any; getOwners: () => any; connect: (arg0: any) => {
        confirmRemoveOwner(address: any): any;
        confirmAddNewOwner(newOwner: any): any;
          revokeConfirmation(txIndex: any): unknown; (): any; new(): any; addOwner: { (arg0: any): any; new(): any; }; removeOwner: { (arg0: any): any; new(): any; }; createTransaction: { (arg0: {
            to: any,
            data: string,
            value: any
          }[], arg2: string): any; new(): any; }; confirmTransaction: { (arg0: number): any; new(): any; }; 
}; getLastTransactionId: () => any; 
};

    let piggyBankMoreOwner: {
      target(target: any, arg1: any): unknown;
        getTransaction(arg0: number): any;
        confirmAddNewOwner(newOwner: any): any;
        confirmRemoveOwner(address: any): any;
        waitForDeployment(): unknown; deployed: () => any; numConfirmationsRequired: () => any; getOwners: () => any; connect: (arg0: any) => {
            revokeConfirmation(txIndex: any): unknown; (): any; new(): any; addOwner: { (arg0: any): any; new(): any; }; removeOwner: { (arg0: any): any; new(): any; }; createTransaction: { (arg0: {
              to: any,
              data: string,
              value: any
            }[], arg2: string): any; new(): any; }; confirmTransaction: { (arg0: number): any; new(): any; }; 
  }; getLastTransactionId: () => any; 
  };


  let owner1: { address: any; };
  let owner2: { address: any; };
  let owner3: { address: any; };
  let tetherContract: {
    balanceOf(target: any): any; waitForDeployment: () => any; target: any; mint: (arg0: (target: any, arg1: any) => unknown, arg1: any) => any; 
};
  let user1: {
    sendTransaction(tx: { to: any; value: any; }): any; address: any; 
};
  let nonOwner: { address: any; };

  beforeEach(async function () {
    [owner1, owner2, owner3, nonOwner, user1] = await ethers.getSigners();
    const PiggyBank = await ethers.getContractFactory("HikuruPiggyBank");
    piggyBank = await PiggyBank.deploy([owner1.address, owner2.address], 1); // Set 2 confirmations required
    await piggyBank.waitForDeployment();
    const PiggyBankMoreOwner = await ethers.getContractFactory("HikuruPiggyBank");
    piggyBankMoreOwner = await PiggyBankMoreOwner.deploy([owner1.address, owner2.address, owner3.address], 2); // Set 2 confirmations required
    await piggyBankMoreOwner.waitForDeployment();



    // deposite eth to piggyBanks
    const tx = {
      to: piggyBank.target,
        value: ethers.parseEther("2")
    };

    const receipt = await user1.sendTransaction(tx);
    await receipt.wait();

    const tx2 = {
      to: piggyBankMoreOwner.target,
        value: ethers.parseEther("2")
    };

    const receipt2 = await user1.sendTransaction(tx2);
    await receipt2.wait();


    tetherContract = await ethers.deployContract("Tether", [], {
    });
    await tetherContract.waitForDeployment();
    console.log(`Tether deployed: ${tetherContract.target}`);

    await tetherContract.mint(piggyBank.target, ethers.parseUnits("10000", 18));
    await tetherContract.mint(piggyBankMoreOwner.target, ethers.parseUnits("10000", 18));
  });

  describe("Constructor Initialization", function () {
    it("should correctly initialize with given owners and confirmations", async function () {
      expect(await piggyBank.numConfirmationsRequired()).to.equal(1);

      const owners = await piggyBank.getOwners();
      expect(owners).to.include(owner1.address);
      expect(owners).to.include(owner2.address);
    });

    it("should correctly initialize with given owners and confirmations for more owners", async function () {
        expect(await piggyBankMoreOwner.numConfirmationsRequired()).to.equal(2);
  
        const owners = await piggyBankMoreOwner.getOwners();
        expect(owners).to.include(owner1.address);
        expect(owners).to.include(owner2.address);
        expect(owners).to.include(owner3.address);
      });
  });

  describe("Add New Owner", function () {
    it("should allow an owner to add a new owner", async function () {
      const newOwner = nonOwner.address;
      const txResponse = await piggyBank.connect(owner1).addOwner(newOwner);
      await txResponse.wait()

      const owners1 = await piggyBank.getOwners();
      expect(owners1).not.to.include(newOwner);

      const txResponse2 = await piggyBank.connect(owner2).confirmAddNewOwner(newOwner);
      await txResponse2.wait()

      const owners = await piggyBank.getOwners();
      expect(owners).to.include(newOwner);
    });

    it("should not allow a non-owner to add a new owner", async function () {
      const newOwner = nonOwner.address;
      await expect(piggyBank.connect(nonOwner).addOwner(newOwner)).to.be.revertedWith("not owner");
    });
  });

  describe("Remove Owner", function () {
    it("should allow an owner to remove another owner", async function () {
      const txResponse =await piggyBank.connect(owner1).removeOwner(owner2.address);
      await txResponse.wait()

      const owners1= await piggyBank.getOwners();
      expect(owners1).to.include(owner2.address);

      const txResponse2 = await piggyBank.connect(owner2).confirmRemoveOwner(owner2.address);
      await txResponse2.wait()

      const owners = await piggyBank.getOwners();
      expect(owners).not.to.include(owner2.address);
    });

    it("should not allow a non-owner to remove an owner", async function () {
      await expect(piggyBank.connect(nonOwner).removeOwner(owner1.address)).to.be.revertedWith("not owner");
    });
  });

  describe("Create Transaction", function () {
    it("should allow an owner to create a transaction", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: 0
      };
  
      const comment = "Test Transaction";
  
      const txResponse = await piggyBank.connect(owner1).createTransaction([txData], comment);
      await txResponse.wait();
      const lastId = await piggyBank.getLastTransactionId();
      expect(lastId).to.equal(0); // as it's the first transaction
    });

    it("should not allow a non-owner to create a transaction", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: 0
      };
      const comment = "Test Transaction";
  
      await expect(piggyBank.connect(nonOwner).createTransaction([txData], comment)).to.be.revertedWith("not owner");
    });

    it("should require confirmations from owners", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: 0
      };
      const comment = "Test Transaction";

      const txResponse = await piggyBank.connect(owner1).createTransaction([txData], comment);
      await txResponse.wait();


      // Transaction should exist
      const transaction = await piggyBank.getTransaction(0);
      expect(transaction.transList[0].to).to.equal(nonOwner.address);
      expect(transaction.transList[0].data).to.equal("0x");
      expect(transaction.transList[0].comment).to.equal("Test Transaction");
      expect(transaction.numConfirmations).to.equal(0);
      expect(transaction.transList[0].value).to.equal(0);

      // Confirm the transaction with owner2
      await piggyBank.connect(owner2).confirmTransaction(0);
      const confirmedTransaction = await piggyBank.getTransaction(0);
      expect(confirmedTransaction.numConfirmations).to.equal(1);
      expect(confirmedTransaction.transList[0].value).to.equal(0);

    });


    it("should require confirmations from owners with next ID", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: 0
      };
      const comment = "Test Transaction";

        const txResponse = await piggyBank.connect(owner1).createTransaction([txData], comment);
        await txResponse.wait();

        const txResponse2 = await piggyBank.connect(owner1).createTransaction([txData], comment);
        await txResponse2.wait();

        const lastId = await piggyBank.getLastTransactionId();

        expect(lastId).to.equal(1);

  
        // Transaction should exist
        const transaction = await piggyBank.getTransaction(0);
        expect(transaction.transList[0].to).to.equal(nonOwner.address);
        expect(transaction.transList[0].data).to.equal("0x");
        expect(transaction.transList[0].comment).to.equal("Test Transaction");
        expect(transaction.numConfirmations).to.equal(0);
        expect(transaction.transList[0].value).to.equal(0);

        // Confirm the transaction with owner2
        await piggyBank.connect(owner2).confirmTransaction(0);
        const confirmedTransaction = await piggyBank.getTransaction(0);
        expect(confirmedTransaction.numConfirmations).to.equal(1);
        expect(confirmedTransaction.transList[0].value).to.equal(0);

      });
    
  });

  describe("Add Owner", function () {
    it("should allow an owner to add a new owner", async function () {
      const newOwner = nonOwner.address;
      // await piggyBank.connect(owner1).addOwner(newOwner);
      const txResponse = await piggyBank.connect(owner1).addOwner(newOwner);
      await txResponse.wait()

      const owners1 = await piggyBank.getOwners();
      expect(owners1).not.to.include(newOwner);

      const txResponse2 = await piggyBank.connect(owner2).confirmAddNewOwner(newOwner);
      await txResponse2.wait()

      const owners = await piggyBank.getOwners();
      expect(owners).to.include(newOwner);
    });
  
    it("should not allow a non-owner to add a new owner", async function () {
      const newOwner = nonOwner.address;
      await expect(piggyBank.connect(nonOwner).addOwner(newOwner)).to.be.revertedWith("not owner");
    });
  });
  
  describe("Remove Owner", function () {
    it("should allow an owner to remove another owner", async function () {
      const txResponse = await piggyBank.connect(owner1).removeOwner(owner2.address);
      await txResponse.wait()

      const owners1 = await piggyBank.getOwners();
      expect(owners1).to.include(owner2.address);

      const txResponse2 = await piggyBank.connect(owner2).confirmRemoveOwner(owner2.address);
      await txResponse2.wait()

      const owners = await piggyBank.getOwners();
      expect(owners).not.to.include(owner2.address);
    });
  
    it("should not allow a non-owner to remove an owner", async function () {
      await expect(piggyBank.connect(nonOwner).removeOwner(owner1.address)).to.be.revertedWith("not owner");
    });
  });
  
  describe("Submit and Confirm Transaction", function () {
    it("should allow an owner to create and confirm a transaction", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: ethers.parseEther("0.1")
      };
      const comment = "Test Transaction";

      const txResponse = await piggyBank.connect(owner1).createTransaction([txData], comment);
      await txResponse.wait();
  
      const txIndex = await piggyBank.getLastTransactionId();
  
      expect(await piggyBank.numConfirmationsRequired()).to.equal(1);
  
      // Transaction should exist
      const transaction = await piggyBank.getTransaction(txIndex);
      expect(transaction.transList[0].to).to.equal(nonOwner.address);
      expect(transaction.transList[0].data).to.equal("0x");
      expect(transaction.transList[0].comment).to.equal("Test Transaction");
      expect(transaction.numConfirmations).to.equal(0);
      expect(transaction.transList[0].value).to.equal(ethers.parseEther("0.1"));
  
      // Confirm the transaction with owner2
      await piggyBank.connect(owner2).confirmTransaction(txIndex);
      const confirmedTransaction = await piggyBank.getTransaction(txIndex);
      expect(confirmedTransaction.numConfirmations).to.equal(1);
      expect(confirmedTransaction.transList[0].value).to.equal(ethers.parseEther("0.1"));
    });
  
    it("should not allow a non-owner to confirm a transaction", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: 0
      };
      const comment = "Test Transaction";

      const txResponse = await piggyBank.connect(owner1).createTransaction([txData], comment);
      await txResponse.wait();
  
      const txIndex = await piggyBank.getLastTransactionId();
  
      await expect(piggyBank.connect(nonOwner).confirmTransaction(txIndex)).to.be.revertedWith("not owner");
    });
  
    it("should require required number of confirmations to execute a transaction", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: 0
      };
      const comment = "Test Transaction";

      const txResponse = await piggyBank.connect(owner1).createTransaction([txData], comment);
      await txResponse.wait();
  
      const txIndex = await piggyBank.getLastTransactionId();
  
      // Transaction should not be executed yet
      const transaction = await piggyBank.getTransaction(txIndex);
      expect(transaction.executed).to.be.false;
  
      // Try executing the transaction, but it should fail
  
      // Confirm the transaction with owner2
      let tx = await piggyBank.connect(owner2).confirmTransaction(txIndex);
      await tx.wait();
  
      // Now, execute the transaction
  
      // Transaction should be executed
      const confirmedTransaction = await piggyBank.getTransaction(txIndex);
      expect(confirmedTransaction.executed).to.be.true;
    });



    it("You cant confirm transaction which you created!", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: 0
      };
      const comment = "Test Transaction";
        const txResponse = await piggyBank.connect(owner1).createTransaction([txData], comment);
        await txResponse.wait();
    
        const txIndex = await piggyBank.getLastTransactionId();
    
        // Confirm the transaction with owner1
        await expect(piggyBank.connect(owner1).confirmTransaction(txIndex)).to.be.revertedWith("You cant confirm transaction which you created!");

        
        // Transaction should not be executed yet
        const transaction = await piggyBank.getTransaction(txIndex);
        expect(transaction.executed).to.be.false;
    
        // Try executing the transaction, but it should fail
    
        // Confirm the transaction with owner2
        await piggyBank.connect(owner2).confirmTransaction(txIndex);
    
        // Now, execute the transaction
    
        // Transaction should be executed
        const confirmedTransaction = await piggyBank.getTransaction(txIndex);
        expect(confirmedTransaction.executed).to.be.true;
      });
  });
  
  describe("Revoke Confirmation", function () {
    it("should allow an owner to revoke their confirmation", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: 0
      };
      const comment = "Test Transaction";
      const txResponse = await piggyBankMoreOwner.connect(owner1).createTransaction([txData], comment);
      await txResponse.wait();
  
      const txIndex = await piggyBankMoreOwner.getLastTransactionId();
  
  
      await piggyBankMoreOwner.connect(owner2).confirmTransaction(txIndex);

      // Revoke the confirmation by owner2
      await piggyBankMoreOwner.connect(owner2).revokeConfirmation(txIndex);
  
      const transaction = await piggyBankMoreOwner.getTransaction(txIndex);
      expect(transaction.numConfirmations).to.equal(0);
      expect(transaction.executed).to.be.false;
    });
  });

  describe("Revoke Confirmation and Confirm again", function () {
    it("should allow an owner to revoke their confirmation", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: 0
      };
      const comment = "Test Transaction";
      const txResponse = await piggyBankMoreOwner.connect(owner1).createTransaction([txData], comment);
      await txResponse.wait();
  
      const txIndex = await piggyBankMoreOwner.getLastTransactionId();
  
  
      await piggyBankMoreOwner.connect(owner2).confirmTransaction(txIndex);

      // Revoke the confirmation by owner2
      await piggyBankMoreOwner.connect(owner2).revokeConfirmation(txIndex);

      await piggyBankMoreOwner.connect(owner2).confirmTransaction(txIndex);
      await piggyBankMoreOwner.connect(owner3).confirmTransaction(txIndex);
  
      const transaction = await piggyBankMoreOwner.getTransaction(txIndex);
      expect(transaction.numConfirmations).to.equal(2);
      expect(transaction.executed).to.be.true;
    });
  });


  describe("Submit and Confirm Transaction check Balance", function () {
    it("send 0.1 ETH once", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: ethers.parseEther("0.1")
      };
      const comment = "Test Transaction";



      // Get initial balances
      const initialPiggyBankBalance = await ethers.provider.getBalance(piggyBank.target);
      const initialRecipientBalance = await ethers.provider.getBalance(nonOwner.address);


      const txResponse = await piggyBank.connect(owner1).createTransaction([txData], comment);
      await txResponse.wait();
  
      const txIndex = await piggyBank.getLastTransactionId();
  
      expect(await piggyBank.numConfirmationsRequired()).to.equal(1);
  
      // Transaction should exist
      const transaction = await piggyBank.getTransaction(txIndex);
      expect(transaction.transList[0].to).to.equal(nonOwner.address);
      expect(transaction.transList[0].data).to.equal("0x");
      expect(transaction.transList[0].comment).to.equal("Test Transaction");
      expect(transaction.numConfirmations).to.equal(0);
      expect(transaction.transList[0].value).to.equal(ethers.parseEther("0.1"));
  
      // Confirm the transaction with owner2
      await piggyBank.connect(owner2).confirmTransaction(txIndex);
      const confirmedTransaction = await piggyBank.getTransaction(txIndex);
      expect(confirmedTransaction.numConfirmations).to.equal(1);
      expect(confirmedTransaction.transList[0].value).to.equal(ethers.parseEther("0.1"));



        // Get final balances
      const finalPiggyBankBalance = await ethers.provider.getBalance(piggyBank.target);
      const finalRecipientBalance = await ethers.provider.getBalance(nonOwner.address);

      expect(finalPiggyBankBalance).to.equal(initialPiggyBankBalance-ethers.parseEther("0.1"));
      expect(finalRecipientBalance).to.equal(initialRecipientBalance+ethers.parseEther("0.1"));

    });

    it("send 0.1 ETH x5", async function () {
      const txData = {
        to: nonOwner.address,
        data: "0x",
        value: ethers.parseEther("0.1")
      };
      const comment = "Test Transaction";



      // Get initial balances
      const initialPiggyBankBalance = await ethers.provider.getBalance(piggyBank.target);
      const initialRecipientBalance = await ethers.provider.getBalance(nonOwner.address);


      const txResponse = await piggyBank.connect(owner1).createTransaction([txData, txData, txData, txData, txData], comment);
      await txResponse.wait();
  
      const txIndex = await piggyBank.getLastTransactionId();
  
      expect(await piggyBank.numConfirmationsRequired()).to.equal(1);
  
      // Transaction should exist
      const transaction = await piggyBank.getTransaction(txIndex);
      expect(transaction.transList[0].to).to.equal(nonOwner.address);
      expect(transaction.transList[0].data).to.equal("0x");
      expect(transaction.transList[0].comment).to.equal("Test Transaction");
      expect(transaction.numConfirmations).to.equal(0);
      expect(transaction.transList[0].value).to.equal(ethers.parseEther("0.1"));
      expect(transaction.transList[2].value).to.equal(ethers.parseEther("0.1"));
  
      // Confirm the transaction with owner2
      await piggyBank.connect(owner2).confirmTransaction(txIndex);
      const confirmedTransaction = await piggyBank.getTransaction(txIndex);
      expect(confirmedTransaction.numConfirmations).to.equal(1);
      expect(confirmedTransaction.transList[0].value).to.equal(ethers.parseEther("0.1"));
      expect(confirmedTransaction.transList[4].value).to.equal(ethers.parseEther("0.1"));



        // Get final balances
      const finalPiggyBankBalance = await ethers.provider.getBalance(piggyBank.target);
      const finalRecipientBalance = await ethers.provider.getBalance(nonOwner.address);

      expect(finalPiggyBankBalance).to.equal(initialPiggyBankBalance-ethers.parseEther("0.1")-ethers.parseEther("0.1")-ethers.parseEther("0.1")-ethers.parseEther("0.1")-ethers.parseEther("0.1"));
      expect(finalRecipientBalance).to.equal(initialRecipientBalance+ethers.parseEther("0.1")+ethers.parseEther("0.1")+ethers.parseEther("0.1")+ethers.parseEther("0.1")+ethers.parseEther("0.1"));

    });

    it("send 100 USDT once", async function () {
      const amount = ethers.parseUnits("100", 18); // Sending 100 USDT (assuming Tether has 6 decimals)

      // Encode the ERC20 transfer function call
      const tetherInterface = new ethers.Interface(tetherABI);
      const data = tetherInterface.encodeFunctionData("transfer", [nonOwner.address, amount]);
  
      const txData = {
          to: tetherContract.target,
          data: data,
          value: 0 // For ERC20 transfer, the value is typically 0 as no Ether is being sent
      };
  
      const comment = "Transfer 100 USDT";


      // Get initial balances
      const initialPiggyBankBalance = await ethers.provider.getBalance(piggyBank.target);
      const initialRecipientBalance = await ethers.provider.getBalance(nonOwner.address);

      const initUSDTPIGGYBANK = await tetherContract.balanceOf(piggyBank.target);
      const initUSDTRecipient= await tetherContract.balanceOf(nonOwner.address);


      const txResponse = await piggyBank.connect(owner1).createTransaction([txData], comment);
      await txResponse.wait();
  
      const txIndex = await piggyBank.getLastTransactionId();
  
      expect(await piggyBank.numConfirmationsRequired()).to.equal(1);
  
      // Transaction should exist
      const transaction = await piggyBank.getTransaction(txIndex);
      expect(transaction.transList[0].to).to.equal(tetherContract.target);
      expect(transaction.transList[0].data).to.not.equal("0x");
      expect(transaction.transList[0].comment).to.equal("Transfer 100 USDT");
      expect(transaction.numConfirmations).to.equal(0);
      expect(transaction.transList[0].value).to.equal(0);
  
      // Confirm the transaction with owner2
      await piggyBank.connect(owner2).confirmTransaction(txIndex);
      const confirmedTransaction = await piggyBank.getTransaction(txIndex);
      expect(confirmedTransaction.numConfirmations).to.equal(1);
      expect(confirmedTransaction.transList[0].data).to.equal(`0xa9059cbb000000000000000000000000${nonOwner.address.slice(2).toLowerCase()}0000000000000000000000000000000000000000000000056bc75e2d63100000`);
      expect(confirmedTransaction.transList[0].value).to.equal(0);


        // Get final balances
      const finalPiggyBankBalance = await ethers.provider.getBalance(piggyBank.target);
      const finalRecipientBalance = await ethers.provider.getBalance(nonOwner.address);

      const finalUSDTPIGGYBANK = await tetherContract.balanceOf(piggyBank.target);
      const finalUSDTRecipient= await tetherContract.balanceOf(nonOwner.address);

      // eth balance should be same
      expect(finalPiggyBankBalance).to.equal(initialPiggyBankBalance);
      expect(finalRecipientBalance).to.equal(initialRecipientBalance);


      expect(finalUSDTPIGGYBANK).to.equal(initUSDTPIGGYBANK-amount);
      expect(finalUSDTRecipient).to.equal(initUSDTRecipient+amount);

    });
    it("send 100 USDT twice", async function () {
      const amount = ethers.parseUnits("100", 18); // Sending 100 USDT (assuming Tether has 6 decimals)

      // Encode the ERC20 transfer function call
      const tetherInterface = new ethers.Interface(tetherABI);
      const data = tetherInterface.encodeFunctionData("transfer", [nonOwner.address, amount]);
  
      const txData = {
          to: tetherContract.target,
          data: data,
          value: 0 // For ERC20 transfer, the value is typically 0 as no Ether is being sent
      };
  
      const comment = "Transfer 100 USDT";


      // Get initial balances
      const initialPiggyBankBalance = await ethers.provider.getBalance(piggyBank.target);
      const initialRecipientBalance = await ethers.provider.getBalance(nonOwner.address);

      const initUSDTPIGGYBANK = await tetherContract.balanceOf(piggyBank.target);
      const initUSDTRecipient= await tetherContract.balanceOf(nonOwner.address);


      const txResponse = await piggyBank.connect(owner1).createTransaction([txData, txData], comment);
      await txResponse.wait();
  
      const txIndex = await piggyBank.getLastTransactionId();
  
      expect(await piggyBank.numConfirmationsRequired()).to.equal(1);
  
      // Transaction should exist
      const transaction = await piggyBank.getTransaction(txIndex);
      expect(transaction.transList[0].to).to.equal(tetherContract.target);
      expect(transaction.transList[0].data).to.not.equal("0x");
      expect(transaction.transList[0].comment).to.equal("Transfer 100 USDT");
      expect(transaction.numConfirmations).to.equal(0);
      expect(transaction.transList[0].value).to.equal(0);
  
      // Confirm the transaction with owner2
      await piggyBank.connect(owner2).confirmTransaction(txIndex);
      const confirmedTransaction = await piggyBank.getTransaction(txIndex);
      expect(confirmedTransaction.numConfirmations).to.equal(1);
      expect(confirmedTransaction.transList[0].data).to.equal(`0xa9059cbb000000000000000000000000${nonOwner.address.slice(2).toLowerCase()}0000000000000000000000000000000000000000000000056bc75e2d63100000`);
      expect(confirmedTransaction.transList[0].value).to.equal(0);


        // Get final balances
      const finalPiggyBankBalance = await ethers.provider.getBalance(piggyBank.target);
      const finalRecipientBalance = await ethers.provider.getBalance(nonOwner.address);

      const finalUSDTPIGGYBANK = await tetherContract.balanceOf(piggyBank.target);
      const finalUSDTRecipient= await tetherContract.balanceOf(nonOwner.address);

      // eth balance should be same
      expect(finalPiggyBankBalance).to.equal(initialPiggyBankBalance);
      expect(finalRecipientBalance).to.equal(initialRecipientBalance);


      expect(finalUSDTPIGGYBANK).to.equal(initUSDTPIGGYBANK-amount-amount);
      expect(finalUSDTRecipient).to.equal(initUSDTRecipient+amount+amount);

    });

    it("send 100 USDT + 0.1 ETH", async function () {
      const amount = ethers.parseUnits("100", 18); // Sending 100 USDT (assuming Tether has 6 decimals)

      // Encode the ERC20 transfer function call
      const tetherInterface = new ethers.Interface(tetherABI);
      const data = tetherInterface.encodeFunctionData("transfer", [nonOwner.address, amount]);
  
      const txData = {
          to: tetherContract.target,
          data: data,
          value: 0 // For ERC20 transfer, the value is typically 0 as no Ether is being sent
      };

      const ethtxData = {
        to: nonOwner.address,
        data: "0x",
        value: ethers.parseEther("0.25")
      };
  
      const comment = "Transfer 100 USDT";


      // Get initial balances
      const initialPiggyBankBalance = await ethers.provider.getBalance(piggyBank.target);
      const initialRecipientBalance = await ethers.provider.getBalance(nonOwner.address);

      const initUSDTPIGGYBANK = await tetherContract.balanceOf(piggyBank.target);
      const initUSDTRecipient= await tetherContract.balanceOf(nonOwner.address);


      const txResponse = await piggyBank.connect(owner1).createTransaction([txData, ethtxData], comment);
      await txResponse.wait();
  
      const txIndex = await piggyBank.getLastTransactionId();
  
      expect(await piggyBank.numConfirmationsRequired()).to.equal(1);
  
      // Transaction should exist
      const transaction = await piggyBank.getTransaction(txIndex);
      expect(transaction.transList[0].to).to.equal(tetherContract.target);
      expect(transaction.transList[0].data).to.not.equal("0x");
      expect(transaction.transList[0].comment).to.equal("Transfer 100 USDT");
      expect(transaction.numConfirmations).to.equal(0);
      expect(transaction.transList[0].value).to.equal(0);
  
      // Confirm the transaction with owner2
      await piggyBank.connect(owner2).confirmTransaction(txIndex);
      const confirmedTransaction = await piggyBank.getTransaction(txIndex);
      expect(confirmedTransaction.numConfirmations).to.equal(1);
      expect(confirmedTransaction.transList[0].data).to.equal(`0xa9059cbb000000000000000000000000${nonOwner.address.slice(2).toLowerCase()}0000000000000000000000000000000000000000000000056bc75e2d63100000`);
      expect(confirmedTransaction.transList[0].value).to.equal(0);


        // Get final balances
      const finalPiggyBankBalance = await ethers.provider.getBalance(piggyBank.target);
      const finalRecipientBalance = await ethers.provider.getBalance(nonOwner.address);

      const finalUSDTPIGGYBANK = await tetherContract.balanceOf(piggyBank.target);
      const finalUSDTRecipient= await tetherContract.balanceOf(nonOwner.address);

      // eth balance should be same
      expect(finalPiggyBankBalance).to.equal(initialPiggyBankBalance-ethers.parseEther("0.25"));
      expect(finalRecipientBalance).to.equal(initialRecipientBalance+ethers.parseEther("0.25"));


      expect(finalUSDTPIGGYBANK).to.equal(initUSDTPIGGYBANK-amount);
      expect(finalUSDTRecipient).to.equal(initUSDTRecipient+amount);

    });
  });
  
});
