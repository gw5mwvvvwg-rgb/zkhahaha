// Mock 合约地址和功能
import { ethers } from 'ethers';

// Mock 合约地址（有效的以太坊地址格式，看起来更真实）
// 使用固定的随机地址，确保每次访问都一致
export const MOCK_PLAYGROUND_ADDRESS = '0xa7b3c9d2e4f6a8b1c5d9e3f7a2b6c0d4e8f1a5b';
export const MOCK_KYC_PASS_ADDRESS = '0x9c8e7d6b5a4f3c2e1d0b9a8f7e6d5c4b3a2f1e0';
export const MOCK_CONTRACT_ADDRESS = '0x5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f';

// Mock 验证结果存储（内存）
const mockResults: Map<string, { done: boolean; ok: boolean; ts: bigint; verifier: string }> = new Map();
const mockPassOwners: Set<string> = new Set();

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock 批量验证
export async function mockVerifyBatch(jobs: Array<{
  id: string;
  publicInputHash: string;
  proof: string;
  work: number;
  deadline: number;
}>) {
  // 模拟网络延迟
  await delay(500 + Math.random() * 1000);

  // 为每个job生成mock结果
  const mockVerifier = '0x3f8e9d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1';
  const now = BigInt(Math.floor(Date.now() / 1000));

  for (const job of jobs) {
    // 90% 概率通过验证
    const ok = Math.random() > 0.1;
    mockResults.set(job.id, {
      done: true,
      ok,
      ts: now,
      verifier: mockVerifier,
    });
  }

  // 生成mock交易哈希
  const txHash = ethers.hexlify(ethers.randomBytes(32));
  
  return {
    hash: txHash,
    wait: async () => ({
      hash: txHash,
      gasUsed: BigInt(100000 + jobs.length * 5000),
      blockNumber: 12345678,
    }),
  };
}

// Mock 查询结果（始终返回成功）
export async function mockGetResult(proofId: string) {
  await delay(100 + Math.random() * 200);
  
  const result = mockResults.get(proofId);
  if (result) {
    return result;
  }
  
  // 如果不存在，自动创建成功的记录（用于演示）
  const mockVerifier = '0x3f8e9d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1';
  const now = BigInt(Math.floor(Date.now() / 1000));
  const successResult = {
    done: true,
    ok: true,
    ts: now,
    verifier: mockVerifier,
  };
  
  // 保存到内存中，以便后续查询也能找到
  mockResults.set(proofId, successResult);
  
  return successResult;
}

// Mock 批量查询结果
export async function mockGetBatchResults(proofIds: string[]) {
  await delay(200 + Math.random() * 300);
  
  const results = [];
  for (const id of proofIds) {
    results.push(await mockGetResult(id));
  }
  return results;
}

// Mock 查询事件（始终返回成功事件）
export async function mockGetEvents(proofId: string) {
  await delay(150 + Math.random() * 250);
  
  // 确保有结果记录
  const result = await mockGetResult(proofId);
  
  if (result && result.done) {
    return [{
      args: [
        proofId,
        result.ok,
        150, // work
        result.verifier,
        '12345678', // blockNumber
        result.ts.toString(),
      ],
      transactionHash: ethers.hexlify(ethers.randomBytes(32)),
      blockNumber: 12345678,
    }];
  }
  return [];
}

// Mock 检查 Pass
export async function mockHasPass(address: string) {
  await delay(100 + Math.random() * 200);
  return mockPassOwners.has(address.toLowerCase());
}

// Mock Mint Pass（单个）
export async function mockMint(to: string, proofId: string) {
  await delay(300 + Math.random() * 500);
  
  mockPassOwners.add(to.toLowerCase());
  
  const txHash = ethers.hexlify(ethers.randomBytes(32));
  return {
    hash: txHash,
    wait: async () => ({
      hash: txHash,
      gasUsed: BigInt(80000),
    }),
  };
}

// Mock 批量 Mint Pass
export async function mockMintBatch(tos: string[], proofIds: string[]) {
  await delay(500 + Math.random() * 1000);
  
  for (const to of tos) {
    mockPassOwners.add(to.toLowerCase());
  }
  
  const txHash = ethers.hexlify(ethers.randomBytes(32));
  return {
    hash: txHash,
    wait: async () => ({
      hash: txHash,
      gasUsed: BigInt(100000 + tos.length * 30000),
    }),
  };
}

// 清空所有mock数据（用于测试）
export function clearMockData() {
  mockResults.clear();
  mockPassOwners.clear();
}
