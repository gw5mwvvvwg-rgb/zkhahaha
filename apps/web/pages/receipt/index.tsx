import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { MOCK_CONTRACT_ADDRESS, mockGetResult, mockGetEvents } from '../../lib/mock';

interface Result {
  done: boolean;
  ok: boolean;
  ts: bigint;
  verifier: string;
}

const CONTRACT_ABI = [
  'function results(bytes32 id) external view returns (bool done, bool ok, uint64 ts, address verifier)',
  'event ProofVerified(bytes32 indexed id, bool ok, uint32 work, address verifier, uint256 blockNumber, uint64 ts)',
];

export default function Receipt() {
  const router = useRouter();
  const { id } = router.query;
  const [proofId, setProofId] = useState<string>('');
  const [contractAddress, setContractAddress] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 从路由参数或状态获取 proofId
  useEffect(() => {
    if (id && typeof id === 'string') {
      setProofId(id);
    }
  }, [id]);

  useEffect(() => {
    const savedAddress = localStorage.getItem('contract_address') || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || MOCK_CONTRACT_ADDRESS;
    setContractAddress(savedAddress);
  }, []);

  // 查询结果和事件（Mock版本 - 无论输入什么都显示成功）
  const fetchResult = async () => {
    // 如果没有输入，自动生成一个
    if (!proofId) {
      generateRandomProofId();
      // 稍等片刻让输入框更新，然后继续
      setTimeout(() => {
        fetchResult();
      }, 100);
      return;
    }

    // 如果不是有效的hex字符串，将其转换为有效的proofId（用于演示）
    let validProofId = proofId;
    if (!ethers.isHexString(proofId, 32)) {
      // 如果输入的是普通文本，转换为hash
      const hash = ethers.keccak256(ethers.toUtf8Bytes(proofId));
      validProofId = hash;
      setProofId(validProofId);
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      setEvent(null);

      // 读取结果（Mock - 使用有效化的proofId）
      const resultData = await mockGetResult(validProofId);
      setResult({
        done: resultData.done,
        ok: resultData.ok,
        ts: resultData.ts,
        verifier: resultData.verifier,
      });

      // 查询事件（Mock - 使用有效化的proofId）
      try {
        const events = await mockGetEvents(validProofId);
        
        if (events.length > 0) {
          const latestEvent = events[0] as any;
          if (latestEvent && latestEvent.args) {
            setEvent({
              id: latestEvent.args[0],
              ok: latestEvent.args[1],
              work: latestEvent.args[2]?.toString() || '',
              verifier: latestEvent.args[3],
              blockNumber: latestEvent.blockNumber?.toString() || '',
              ts: latestEvent.args[5]?.toString() || '',
              txHash: latestEvent.transactionHash || '',
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch events:', err);
      }
    } catch (err: any) {
      setError(err.message || '查询失败');
      console.error('Fetch result error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 随机生成 Proof ID
  const generateRandomProofId = () => {
    const randomBytes = ethers.randomBytes(32);
    const randomId = ethers.hexlify(randomBytes);
    setProofId(randomId);
    setError('');
  };

  // 复制链接
  const copyLink = () => {
    const url = `${window.location.origin}/receipt?id=${proofId}`;
    navigator.clipboard.writeText(url);
    alert('链接已复制到剪贴板！');
  };

  return (
    <>
      <Head>
        <title>View Receipt - Parallel ZK Playground</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:underline">
              ← 返回首页
            </Link>
            <h1 className="text-3xl font-bold">📋 View Receipt</h1>
            <div className="w-20"></div>
          </div>

          {/* 合约地址和 Proof ID 输入 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  合约地址 (Contract Address)
                </label>
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => {
                    setContractAddress(e.target.value);
                    localStorage.setItem('contract_address', e.target.value);
                  }}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Proof ID (bytes32)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={proofId}
                    onChange={(e) => setProofId(e.target.value)}
                    placeholder="输入任意内容或留空自动生成"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <button
                    onClick={generateRandomProofId}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold text-sm"
                    title="随机生成 Proof ID"
                  >
                    🎲 随机生成
                  </button>
                  <button
                    onClick={fetchResult}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? '查询中...' : '查询'}
                  </button>
                  {proofId && (
                    <button
                      onClick={copyLink}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                    >
                      复制链接
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  可以输入任意内容或留空，系统会自动处理并显示成功结果
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
              ❌ {error}
            </div>
          )}

          {/* 结果显示 */}
          {result && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">验证结果 (Contract Results)</h2>
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <span className="font-medium">Done:</span>{' '}
                    <span className={result.done ? 'text-green-600' : 'text-gray-500'}>
                      {result.done ? '✅ 已处理' : '⏳ 未处理'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">OK:</span>{' '}
                    <span className={result.ok ? 'text-green-600' : 'text-red-600'}>
                      {result.ok ? '✅ 成功' : '❌ 失败'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Timestamp:</span>{' '}
                    {result.done ? new Date(Number(result.ts) * 1000).toLocaleString() : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Verifier:</span>{' '}
                    <span className="font-mono text-xs">{result.verifier}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Receipt 核心逻辑说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">📋 View Receipt 核心逻辑</h2>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <h3 className="font-semibold mb-2">1. 查询验证结果（Contract State）</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>调用合约的 <code className="bg-blue-100 px-1 rounded">results(bytes32 id)</code> 方法</li>
                  <li>返回结构：<code className="bg-blue-100 px-1 rounded">(bool done, bool ok, uint64 ts, address verifier)</code></li>
                  <li><strong>done</strong>: 是否已处理（已验证过）</li>
                  <li><strong>ok</strong>: 验证是否成功</li>
                  <li><strong>ts</strong>: 验证时间戳</li>
                  <li><strong>verifier</strong>: 执行验证的地址</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. 查询验证事件（Event Log）</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>查询 <code className="bg-blue-100 px-1 rounded">ProofVerified</code> 事件</li>
                  <li>事件包含：proofId, ok, work, verifier, blockNumber, timestamp</li>
                  <li>用于追溯完整的验证历史和链上证据</li>
                  <li>可以通过区块浏览器查看完整的交易记录</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. 分享验证回执</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>生成包含 proofId 的 URL（如：<code className="bg-blue-100 px-1 rounded">/receipt?id=0x...</code>）</li>
                  <li>任何人可以通过 URL 查询并验证该 Proof 的状态</li>
                  <li>实现去中心化的验证结果共享</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 事件显示 */}
          {event && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">验证事件 (ProofVerified Event)</h2>
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Proof ID:</span>{' '}
                    <span className="font-mono text-xs">{event.id}</span>
                  </div>
                  <div>
                    <span className="font-medium">OK:</span>{' '}
                    <span className={event.ok ? 'text-green-600' : 'text-red-600'}>
                      {event.ok ? '✅ 成功' : '❌ 失败'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Work:</span> {event.work}
                  </div>
                  <div>
                    <span className="font-medium">Block Number:</span> {event.blockNumber}
                  </div>
                  <div>
                    <span className="font-medium">Timestamp:</span>{' '}
                    {new Date(Number(event.ts) * 1000).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Verifier:</span>{' '}
                    <span className="font-mono text-xs">{event.verifier}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">TX Hash:</span>{' '}
                    <a
                      href={`https://testnet-explorer.monad.xyz/tx/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono text-xs"
                    >
                      {event.txHash}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
