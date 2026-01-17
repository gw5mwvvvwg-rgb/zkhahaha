import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

interface ProofJob {
  id: string;
  publicInputHash: string;
  proof: string;
  work: number;
  deadline: number;
}

interface BatchResult {
  batchSize: number;
  txHash: string;
  gasUsed: bigint;
  gasPerProof: number;
  latencyMs: number;
  successCount: number;
  totalCount: number;
}

/**
 * 生成随机 ProofJob
 */
function generateProofJob(index: number, work: number = 200): ProofJob {
  const timestamp = Date.now();
  const payer = ethers.Wallet.createRandom().address;
  const id = ethers.keccak256(
    ethers.solidityPacked(
      ["address", "uint256", "uint256"],
      [payer, index, timestamp]
    )
  );
  const publicInputHash = ethers.keccak256(ethers.toUtf8Bytes(`input_${index}_${timestamp}`));
  
  // 生成随机 proof bytes（32 bytes）
  const randomProof = ethers.randomBytes(32);
  const proof = ethers.hexlify(randomProof);

  return {
    id,
    publicInputHash,
    proof,
    work,
    deadline: 0, // 0 表示永不过期
  };
}

/**
 * 执行批量验证并返回指标
 */
async function runBatchVerification(
  contract: any,
  batchSize: number,
  work: number = 200
): Promise<BatchResult> {
  console.log(`\n📦 Preparing batch of ${batchSize} proofs...`);

  // 生成 ProofJob 数组
  const jobs: ProofJob[] = [];
  for (let i = 0; i < batchSize; i++) {
    jobs.push(generateProofJob(i, work));
  }

  // 转换为合约调用格式
  const contractJobs = jobs.map((job) => ({
    id: job.id,
    publicInputHash: job.publicInputHash,
    proof: job.proof,
    work: job.work,
    deadline: job.deadline,
  }));

  // 执行批量验证（前端打点）
  const startTime = Date.now();
  
  console.log(`🔄 Sending verifyBatch transaction...`);
  const tx = await contract.verifyBatch(contractJobs);
  console.log(`   TX Hash: ${tx.hash}`);

  console.log(`⏳ Waiting for confirmation...`);
  const receipt = await tx.wait();
  
  const endTime = Date.now();
  const latencyMs = endTime - startTime;
  const gasUsed = receipt.gasUsed;

  // 读取验证结果（统计成功数量）
  let successCount = 0;
  for (let i = 0; i < jobs.length; i++) {
    const result = await contract.results(jobs[i].id);
    if (result.done && result.ok) {
      successCount++;
    }
  }

  return {
    batchSize,
    txHash: receipt.hash,
    gasUsed,
    gasPerProof: Number(gasUsed) / batchSize,
    latencyMs,
    successCount,
    totalCount: batchSize,
  };
}

/**
 * 格式化输出结果
 */
function printBatchResult(result: BatchResult) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`📊 Batch Verification Result`);
  console.log(`${"═".repeat(60)}`);
  console.log(`Batch Size:      ${result.batchSize}`);
  console.log(`TX Hash:         ${result.txHash}`);
  console.log(`Gas Used:        ${result.gasUsed.toLocaleString()}`);
  console.log(`Gas/Proof:       ${result.gasPerProof.toFixed(0)}`);
  console.log(`Latency (ms):    ${result.latencyMs}`);
  console.log(`Success Rate:    ${result.successCount}/${result.totalCount} (${((result.successCount / result.totalCount) * 100).toFixed(1)}%)`);
  console.log(`${"═".repeat(60)}\n`);
}

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not found in .env file");
    console.error("   Please run 'pnpm deploy:testnet' first or set CONTRACT_ADDRESS manually");
    process.exit(1);
  }

  console.log("🚀 Parallel ZK Playground - Batch Verification Demo");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🌐 Network: Monad Testnet\n");

  // 连接合约
  const ParallelZKPlayground = await ethers.getContractFactory("ParallelZKPlayground");
  const contract = ParallelZKPlayground.attach(contractAddress);

  const [signer] = await ethers.getSigners();
  console.log("👤 Signer:", signer.address);
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "MON\n");

  // 测试不同的 batch sizes
  const batchSizes = [10, 50, 100];
  const work = 200; // 默认工作量

  console.log("🎯 Starting batch verification tests...");
  console.log(`   Work per proof: ${work}\n`);

  const allResults: BatchResult[] = [];

  for (const batchSize of batchSizes) {
    try {
      const result = await runBatchVerification(contract, batchSize, work);
      allResults.push(result);
      printBatchResult(result);
    } catch (error: any) {
      console.error(`❌ Batch size ${batchSize} failed:`, error.message);
      if (error.reason) {
        console.error(`   Reason: ${error.reason}`);
      }
    }
  }

  // 汇总报告
  if (allResults.length > 0) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`📈 Summary Report`);
    console.log(`${"═".repeat(60)}`);
    console.log(`Total Batches:   ${allResults.length}`);
    
    const totalGas = allResults.reduce((sum, r) => sum + r.gasUsed, 0n);
    const avgGasPerProof = allResults.reduce((sum, r) => sum + r.gasPerProof, 0) / allResults.length;
    const avgLatency = allResults.reduce((sum, r) => sum + r.latencyMs, 0) / allResults.length;
    const totalSuccess = allResults.reduce((sum, r) => sum + r.successCount, 0);
    const totalProofs = allResults.reduce((sum, r) => sum + r.totalCount, 0);

    console.log(`Total Gas Used:  ${totalGas.toLocaleString()}`);
    console.log(`Avg Gas/Proof:   ${avgGasPerProof.toFixed(0)}`);
    console.log(`Avg Latency:     ${avgLatency.toFixed(0)} ms`);
    console.log(`Total Success:   ${totalSuccess}/${totalProofs} (${((totalSuccess / totalProofs) * 100).toFixed(1)}%)`);
    console.log(`${"═".repeat(60)}\n`);
  }

  console.log("✅ Demo completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  });
