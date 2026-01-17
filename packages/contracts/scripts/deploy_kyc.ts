import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// 确保加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  console.log("🚀 Deploying KycPass to Monad Testnet...\n");

  // 检查环境变量
  console.log("🔍 Checking environment variables...");
  console.log("MONAD_RPC:", process.env.MONAD_RPC || "Not set");
  console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? `${process.env.PRIVATE_KEY.substring(0, 10)}...` : "Not set");

  const signers = await ethers.getSigners();
  console.log("📋 Signers found:", signers.length);
  
  if (signers.length === 0) {
    throw new Error("No signers found. Please check PRIVATE_KEY in .env file.");
  }
  const deployer = signers[0];
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MON\n");

  // 读取或部署 ParallelZKPlayground
  let playgroundAddress = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

  if (!playgroundAddress) {
    console.log("⚠️  ParallelZKPlayground address not found, deploying new one...\n");
    const ParallelZKPlayground = await ethers.getContractFactory("ParallelZKPlayground");
    const playground = await ParallelZKPlayground.deploy();
    await playground.waitForDeployment();
    playgroundAddress = await playground.getAddress();
    console.log("✅ ParallelZKPlayground deployed to:", playgroundAddress);
  } else {
    console.log("✅ Using existing ParallelZKPlayground:", playgroundAddress);
  }

  // 部署 KycPass
  console.log("\n📦 Deploying KycPass...");
  const KycPass = await ethers.getContractFactory("KycPass");
  const kycPass = await KycPass.deploy(playgroundAddress);
  await kycPass.waitForDeployment();
  const kycPassAddress = await kycPass.getAddress();

  console.log("✅ KycPass deployed to:", kycPassAddress);
  console.log("📋 Transaction hash:", kycPass.deploymentTransaction()?.hash);

  // 输出地址
  console.log("\n" + "=".repeat(60));
  console.log("📋 Deployment Summary");
  console.log("=".repeat(60));
  console.log("PLAYGROUND_ADDRESS=" + playgroundAddress);
  console.log("KYC_PASS_ADDRESS=" + kycPassAddress);
  console.log("=".repeat(60));

  // 尝试更新 .env 文件
  const envPath = path.join(__dirname, "../../.env");

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    
    // 更新或添加 CONTRACT_ADDRESS (Playground)
    if (envContent.includes("CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=.*/,
        `CONTRACT_ADDRESS=${playgroundAddress}`
      );
    } else {
      envContent += `\nCONTRACT_ADDRESS=${playgroundAddress}\n`;
    }

    // 更新或添加 NEXT_PUBLIC_CONTRACT_ADDRESS
    if (envContent.includes("NEXT_PUBLIC_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_CONTRACT_ADDRESS=${playgroundAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${playgroundAddress}\n`;
    }

    // 更新或添加 NEXT_PUBLIC_PLAYGROUND_ADDRESS
    if (envContent.includes("NEXT_PUBLIC_PLAYGROUND_ADDRESS=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_PLAYGROUND_ADDRESS=.*/,
        `NEXT_PUBLIC_PLAYGROUND_ADDRESS=${playgroundAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_PLAYGROUND_ADDRESS=${playgroundAddress}\n`;
    }

    // 更新或添加 NEXT_PUBLIC_KYC_PASS_ADDRESS
    if (envContent.includes("NEXT_PUBLIC_KYC_PASS_ADDRESS=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_KYC_PASS_ADDRESS=.*/,
        `NEXT_PUBLIC_KYC_PASS_ADDRESS=${kycPassAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_KYC_PASS_ADDRESS=${kycPassAddress}\n`;
    }

    // 更新或添加 KYC_PASS_ADDRESS
    if (envContent.includes("KYC_PASS_ADDRESS=")) {
      envContent = envContent.replace(
        /^KYC_PASS_ADDRESS=.*$/m,
        `KYC_PASS_ADDRESS=${kycPassAddress}`
      );
    } else {
      envContent += `\nKYC_PASS_ADDRESS=${kycPassAddress}\n`;
    }

    fs.writeFileSync(envPath, envContent, "utf-8");
    console.log("\n✅ Updated .env file with contract addresses");
  } else {
    console.log("\n⚠️  .env file not found. Please manually add:");
    console.log(`NEXT_PUBLIC_PLAYGROUND_ADDRESS=${playgroundAddress}`);
    console.log(`NEXT_PUBLIC_KYC_PASS_ADDRESS=${kycPassAddress}`);
    console.log("\nYou can copy from .env.example and fill in the values.");
  }

  console.log("\n🎉 Deployment completed!");
  console.log("\n💡 Next steps:");
  console.log("   1. Update Vercel environment variables if needed");
  console.log("   2. Visit /kyc page to start KYC verification");
  console.log("   3. Visit /gate page to check pass status");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
