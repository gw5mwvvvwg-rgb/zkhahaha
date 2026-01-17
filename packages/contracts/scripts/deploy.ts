import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying ParallelZKPlayground to Monad Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MON\n");

  // 部署合约
  const ParallelZKPlayground = await ethers.getContractFactory("ParallelZKPlayground");
  const contract = await ParallelZKPlayground.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed to:", contractAddress);
  console.log("📋 Transaction hash:", contract.deploymentTransaction()?.hash);

  // 尝试更新 .env 文件
  const envPath = path.join(__dirname, "../../../.env");
  const envExamplePath = path.join(__dirname, "../../../.env.example");

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    
    // 更新或添加 CONTRACT_ADDRESS
    if (envContent.includes("CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=.*/,
        `CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
    }

    fs.writeFileSync(envPath, envContent, "utf-8");
    console.log("\n✅ Updated .env file with CONTRACT_ADDRESS");
  } else {
    console.log("\n⚠️  .env file not found. Please manually add:");
    console.log(`CONTRACT_ADDRESS=${contractAddress}`);
    console.log("\nYou can copy from .env.example and fill in the values.");
  }

  console.log("\n🎉 Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
