# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```



```npx hardhat run scripts/deploy.ts --network blast_sepolia```
Deploying Piggy Bank...
Deployer:  0x4d052115975db4a43D7471fa6E08696D4c0355A4
Piggy Bank contract deployed to:  0x1bCec961363dC355558421E8a66423006aB75a25

Piggy Bank Ether Balance: 0.0 ETH
               
```npx hardhat verify --network blast_sepolia --constructor-args args.js 0x1bCec961363dC355558421E8a66423006aB75a25```                             
[INFO] Sourcify Verification Skipped: Sourcify verification is currently disabled. To enable it, add the following entry to your Hardhat configuration:

sourcify: {
  enabled: true
}

Or set 'enabled' to false to hide this message.

For more information, visit https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify#verifying-on-sourcify
Successfully submitted source code for contract
contracts/HikuruPiggyBank.sol:HikuruPiggyBank at 0x1bCec961363dC355558421E8a66423006aB75a25
for verification on the block explorer. Waiting for verification result...

Successfully verified contract HikuruPiggyBank on the block explorer.
https://testnet.blastscan.io/address/0x1bCec961363dC355558421E8a66423006aB75a25#code
