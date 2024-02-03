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
Deployer:  0x45B6cEBF3528fC8A52657E73b7dEDAfe122c1308
Piggy Bank contract deployed to:  0xBc1BB7B2E3D0995355a25993B1800E80d196241a
Deployer:  0x45B6cEBF3528fC8A52657E73b7dEDAfe122c1308


Piggy Bank Ether Balance: 0.0 ETH
               
```npx hardhat verify --network blast_sepolia --constructor-args args.js 0xBc1BB7B2E3D0995355a25993B1800E80d196241a      ```                             
[INFO] Sourcify Verification Skipped: Sourcify verification is currently disabled. To enable it, add the following entry to your Hardhat configuration:

sourcify: {
  enabled: true
}

Or set 'enabled' to false to hide this message.

For more information, visit https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify#verifying-on-sourcify
Successfully submitted source code for contract
contracts/HikuruPiggyBank.sol:HikuruPiggyBank at 0xBc1BB7B2E3D0995355a25993B1800E80d196241a
for verification on the block explorer. Waiting for verification result...

Successfully verified contract HikuruPiggyBank on the block explorer.
https://testnet.blastscan.io/address/0xBc1BB7B2E3D0995355a25993B1800E80d196241a#code
