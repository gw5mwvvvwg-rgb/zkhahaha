import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { MOCK_CONTRACT_ADDRESS, mockVerifyBatch, mockGetResult } from '../lib/mock';

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

const STORAGE_KEY = 'parallel-zk-proof-jobs';
const CONTRACT_ABI = [
  'function verifyBatch(tuple(bytes32 id, bytes32 publicInputHash, bytes proof, uint32 work, uint64 deadline)[] calldata jobs) external',
  'function results(bytes32 id) external view returns (bool done, bool ok, uint64 ts, address verifier)',
  'event ProofVerified(bytes32 indexed id, bool ok, uint32 work, address verifier, uint256 blockNumber, uint64 ts)',
];

export default function Batch() {
  const [jobs, setJobs] = useState<ProofJob[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [batchSize, setBatchSize] = useState<10 | 50 | 100>(10);
  const [contractAddress, setContractAddress] = useState('');
  const [result, setResult] = useState<BatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 加载本地存储的 jobs
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loadedJobs = JSON.parse(saved);
        setJobs(loadedJobs);
      } catch (e) {
        console.error('Failed to load jobs:', e);
      }
    }

    // 从环境变量或本地存储读取合约地址，默认使用mock地址
    const savedAddress = localStorage.getItem('contract_address') || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || MOCK_CONTRACT_ADDRESS;
    setContractAddress(savedAddress);
  }, []);

  // 全选/取消全选
  const toggleAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(jobs.map((j) => j.id)));
    }
  };

  // 切换选择
  const toggleJob = (id: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedJobs(newSelected);
  };

  // 批量验证（Mock版本）
  const verifyBatch = async () => {
    if (selectedJobs.size === 0) {
      setError('请至少选择一个 Proof Job');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      // 准备选中的 jobs
      const selectedJobList = jobs.filter((j) => selectedJobs.has(j.id));
      const contractJobs = selectedJobList.map((job) => ({
        id: job.id,
        publicInputHash: job.publicInputHash,
        proof: job.proof,
        work: job.work,
        deadline: job.deadline,
      }));

      // 执行批量验证（Mock）
      const startTime = Date.now();
      const tx = await mockVerifyBatch(contractJobs);
      const receipt = await tx.wait();
      const endTime = Date.now();

      const latencyMs = endTime - startTime;
      const gasUsed = receipt.gasUsed;

      // 读取验证结果（统计成功数量，Mock）
      let successCount = 0;
      for (const job of selectedJobList) {
        const result = await mockGetResult(job.id);
        if (result.done && result.ok) {
          successCount++;
        }
      }

      const batchResult: BatchResult = {
        batchSize: selectedJobList.length,
        txHash: receipt.hash,
        gasUsed,
        gasPerProof: Number(gasUsed) / selectedJobList.length,
        latencyMs,
        successCount,
        totalCount: selectedJobList.length,
      };

      setResult(batchResult);
    } catch (err: any) {
      setError(err.message || '批量验证失败');
      console.error('Batch verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 自动选择 batch size
  const autoSelectBatchSize = (size: 10 | 50 | 100) => {
    setBatchSize(size);
    const maxJobs = Math.min(size, jobs.length);
    const selected = new Set(jobs.slice(0, maxJobs).map((j) => j.id));
    setSelectedJobs(selected);
  };

  return (
    <>
      <Head>
        <title>Batch Verify - Parallel ZK Playground</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:underline">
              ← 返回首页
            </Link>
            <h1 className="text-3xl font-bold">⚡ Batch Verify</h1>
            <div className="w-20"></div>
          </div>

          {/* 合约地址设置 */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <label className="block text-sm font-medium mb-2">
              合约地址 (Contract Address)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => {
                  setContractAddress(e.target.value);
                  localStorage.setItem('contract_address', e.target.value);
                }}
                placeholder="0x..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          {/* Batch Verify 核心逻辑说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">⚡ Batch Verify 核心逻辑</h2>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <h3 className="font-semibold mb-2">1. 批量验证流程</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>调用合约的 <code className="bg-blue-100 px-1 rounded">verifyBatch(ProofJob[] calldata jobs)</code> 方法</li>
                  <li>一次交易可以验证多个 Proof（10/50/100个）</li>
                  <li>每个 Proof 独立验证，结果写入 <code className="bg-blue-100 px-1 rounded">results[proofId]</code></li>
                  <li>验证完成后发送 <code className="bg-blue-100 px-1 rounded">ProofVerified</code> 事件</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. 并行友好设计</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>分散存储</strong>：使用 <code className="bg-blue-100 px-1 rounded">mapping(bytes32 =&gt; Result)</code> 确保每个 proofId 独立存储槽</li>
                  <li><strong>避免写热点</strong>：不同 proofId 的写入在 Monad 上可以并行执行</li>
                  <li><strong>事件驱动统计</strong>：所有统计指标（成功率、gas/proof）从前端从事件聚合，而非链上全局累加器</li>
                  <li><strong>无共享状态</strong>：不使用 <code className="bg-blue-100 px-1 rounded">totalVerified++</code> 等全局状态，减少冲突</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. 性能指标</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Gas 优化</strong>：批量验证分摊固定成本（交易基础费），降低单 Proof 成本</li>
                  <li><strong>延迟测量</strong>：从前端记录交易开始到确认完成的时间</li>
                  <li><strong>成功率统计</strong>：从事件聚合统计验证成功的数量</li>
                  <li><strong>并行优势</strong>：在 Monad 并行执行时，多个 Proof 的验证可以同时进行</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 批量选择 */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                选择 Proof Jobs (已选: {selectedJobs.size}/{jobs.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => autoSelectBatchSize(10)}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  选 10
                </button>
                <button
                  onClick={() => autoSelectBatchSize(50)}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  选 50
                </button>
                <button
                  onClick={() => autoSelectBatchSize(100)}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  选 100
                </button>
                <button
                  onClick={toggleAll}
                  className="px-3 py-1 text-sm bg-blue-200 hover:bg-blue-300 rounded"
                >
                  {selectedJobs.size === jobs.length ? '取消全选' : '全选'}
                </button>
              </div>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                暂无 Proof Jobs
                <br />
                <Link href="/upload" className="text-blue-600 hover:underline text-sm">
                  前往 Upload 页面创建
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {jobs.map((job, index) => (
                  <label
                    key={job.id}
                    className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedJobs.has(job.id)}
                      onChange={() => toggleJob(job.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-mono text-gray-700">
                        #{index + 1} {job.id.slice(0, 20)}...
                      </div>
                      <div className="text-xs text-gray-500">Work: {job.work}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 验证按钮和结果 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <button
              onClick={verifyBatch}
              disabled={loading || selectedJobs.size === 0}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ 验证中...' : '🚀 Verify Batch'}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                ❌ {error}
              </div>
            )}

            {result && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="text-lg font-semibold mb-3">✅ 批量验证结果</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Batch Size:</span> {result.batchSize}
                  </div>
                  <div>
                    <span className="font-medium">TX Hash:</span>{' '}
                    <a
                      href={`https://testnet-explorer.monad.xyz/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono text-xs"
                    >
                      {result.txHash.slice(0, 20)}...
                    </a>
                  </div>
                  <div>
                    <span className="font-medium">Gas Used:</span> {result.gasUsed.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Gas/Proof:</span> {result.gasPerProof.toFixed(0)}
                  </div>
                  <div>
                    <span className="font-medium">Latency (ms):</span> {result.latencyMs}
                  </div>
                  <div>
                    <span className="font-medium">Success Rate:</span> {result.successCount}/{result.totalCount} (
                    {((result.successCount / result.totalCount) * 100).toFixed(1)}%)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
