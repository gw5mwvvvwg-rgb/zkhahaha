import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';

interface ProofJob {
  id: string;
  publicInputHash: string;
  proof: string;
  work: number;
  deadline: number;
}

const STORAGE_KEY = 'parallel-zk-proof-jobs';

export default function Upload() {
  const [work, setWork] = useState(200);
  const [deadline, setDeadline] = useState('');
  const [publicInputHash, setPublicInputHash] = useState('');
  const [proof, setProof] = useState('');
  const [jobs, setJobs] = useState<ProofJob[]>([]);

  // 加载本地存储的 jobs
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setJobs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load jobs:', e);
      }
    }
  }, []);

  // 保存 jobs 到本地存储
  const saveJobs = (newJobs: ProofJob[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newJobs));
    setJobs(newJobs);
  };

  // 生成随机 Public Input Hash
  const generateRandomHash = () => {
    const randomBytes = ethers.randomBytes(32);
    const hash = ethers.keccak256(randomBytes);
    setPublicInputHash(hash);
    return hash;
  };

  // 生成随机 Proof
  const generateRandomProof = () => {
    const randomBytes = ethers.randomBytes(32);
    const hex = ethers.hexlify(randomBytes);
    setProof(hex);
    return hex;
  };

  // 添加到本地列表
  const addToLocalList = () => {
    // 如果 publicInputHash 为空，自动生成
    let pubHash = publicInputHash;
    if (!pubHash) {
      pubHash = generateRandomHash();
    }

    // 如果 proof 为空，自动生成
    let proofData = proof;
    if (!proofData) {
      proofData = generateRandomProof();
    }

    // 生成唯一 ID
    const timestamp = Date.now();
    const payer = ethers.Wallet.createRandom().address;
    const id = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'uint256'],
        [payer, timestamp]
      )
    );

    const job: ProofJob = {
      id,
      publicInputHash: pubHash,
      proof: proofData,
      work,
      deadline: deadline ? Math.floor(new Date(deadline).getTime() / 1000) : 0,
    };

    const newJobs = [...jobs, job];
    saveJobs(newJobs);

    // 清空表单（保留 work）
    setPublicInputHash('');
    setProof('');
    setDeadline('');
  };

  // 删除 job
  const deleteJob = (id: string) => {
    const newJobs = jobs.filter((job) => job.id !== id);
    saveJobs(newJobs);
  };

  // 清空所有 jobs
  const clearAll = () => {
    if (confirm('确定要清空所有 Proof Jobs 吗？')) {
      saveJobs([]);
    }
  };

  return (
    <>
      <Head>
        <title>Upload Proof - Parallel ZK Playground</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:underline">
              ← 返回首页
            </Link>
            <h1 className="text-3xl font-bold">📤 Upload Proof</h1>
            <div className="w-20"></div>
          </div>

          {/* Upload Proof 核心逻辑说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">📤 Upload Proof 核心逻辑</h2>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <h3 className="font-semibold mb-2">1. Proof Job 数据结构</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>id (bytes32)</strong>：Proof 的唯一标识符，由 payer 地址和时间戳生成</li>
                  <li><strong>publicInputHash (bytes32)</strong>：公共输入的哈希值</li>
                  <li><strong>proof (bytes)</strong>：ZK 证明的字节数据</li>
                  <li><strong>work (uint32)</strong>：工作量指标，用于模拟验证复杂度（1-2000）</li>
                  <li><strong>deadline (uint64)</strong>：过期时间戳，0 表示永不过期</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. 本地存储机制</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Proof Jobs 存储在浏览器的 <code className="bg-blue-100 px-1 rounded">localStorage</code> 中</li>
                  <li>数据格式：<code className="bg-blue-100 px-1 rounded">JSON.stringify(jobs[])</code></li>
                  <li>刷新页面后数据仍然保留，便于批量操作</li>
                  <li>可以手动添加、删除或清空所有 Jobs</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. 随机生成功能</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>可以自动生成随机的 <code className="bg-blue-100 px-1 rounded">publicInputHash</code> 和 <code className="bg-blue-100 px-1 rounded">proof</code></li>
                  <li>生成的 Proof ID 具有唯一性，避免冲突</li>
                  <li>支持快速创建多个 Jobs 用于批量验证演示</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 左侧：表单 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">创建 Proof Job</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Work (工作量，默认 200，最大 2000)
                  </label>
                  <input
                    type="number"
                    value={work}
                    onChange={(e) => setWork(parseInt(e.target.value) || 200)}
                    min="1"
                    max="2000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Deadline (过期时间，可选，留空表示永不过期)
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Public Input Hash (留空自动生成)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={publicInputHash}
                      onChange={(e) => setPublicInputHash(e.target.value)}
                      placeholder="0x..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    <button
                      onClick={generateRandomHash}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                    >
                      随机生成
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Proof (bytes，留空自动生成)
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      value={proof}
                      onChange={(e) => setProof(e.target.value)}
                      placeholder="0x..."
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    <button
                      onClick={generateRandomProof}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm whitespace-nowrap"
                    >
                      随机生成
                    </button>
                  </div>
                </div>

                <button
                  onClick={addToLocalList}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                >
                  ➕ Add to Local List
                </button>
              </div>
            </div>

            {/* 右侧：本地列表 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">本地 Proof Jobs ({jobs.length})</h2>
                {jobs.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-sm text-red-600 hover:underline"
                  >
                    清空全部
                  </button>
                )}
              </div>

              {jobs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  暂无 Proof Jobs
                  <br />
                  <span className="text-sm">请在左侧表单创建</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {jobs.map((job, index) => (
                    <div
                      key={job.id}
                      className="border border-gray-200 rounded-md p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono text-gray-600 mb-1">
                            #{index + 1} {job.id.slice(0, 16)}...
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Work: {job.work}</div>
                            <div>Deadline: {job.deadline === 0 ? '永不过期' : new Date(job.deadline * 1000).toLocaleString()}</div>
                            <div className="truncate">PubHash: {job.publicInputHash.slice(0, 20)}...</div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="ml-2 text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
