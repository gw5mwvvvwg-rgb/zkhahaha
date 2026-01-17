import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { PLAYGROUND_ABI, KYCPASS_ABI } from '../lib/abis';
import { 
  MOCK_PLAYGROUND_ADDRESS, 
  MOCK_KYC_PASS_ADDRESS,
  mockVerifyBatch,
  mockMintBatch,
} from '../lib/mock';

const MONAD_CHAIN_ID = '0x2797'; // 10143 in hex
const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz';

interface KycClaim {
  country: string;
  over18: boolean;
  notSanctioned: boolean;
}

interface KycApplicant {
  address: string;
  proofId: string;
  publicInputHash: string;
  proof: string;
  work: number;
  deadline: number;
  claims: KycClaim;
  status: 'Pending' | 'Verified' | 'Rejected';
  minted: boolean;
}

interface DashboardStats {
  applicants: number;
  verified: number;
  passMinted: number;
  latencyMs: number;
  gasUsed: bigint;
  gasPerProof: number;
}

const STORAGE_KEY = 'kycApplicants';

// 生成 deterministic identicon（简单实现）
function generateAvatar(address: string): string {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(address));
  const colors = [
    'bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-indigo-400',
    'bg-green-400', 'bg-yellow-400', 'bg-red-400', 'bg-teal-400'
  ];
  const colorIndex = parseInt(hash.slice(2, 3), 16) % colors.length;
  return colors[colorIndex];
}

// 格式化地址
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function KYC() {
  const [applicants, setApplicants] = useState<KycApplicant[]>([]);
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [playgroundAddress, setPlaygroundAddress] = useState('');
  const [kycPassAddress, setKycPassAddress] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    applicants: 0,
    verified: 0,
    passMinted: 0,
    latencyMs: 0,
    gasUsed: BigInt(0),
    gasPerProof: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  // 加载本地存储和配置
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loaded = JSON.parse(saved);
        setApplicants(loaded);
      } catch (e) {
        console.error('Failed to load applicants:', e);
      }
    }

    const playground = localStorage.getItem('playground_address') || 
                      process.env.NEXT_PUBLIC_PLAYGROUND_ADDRESS || 
                      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 
                      MOCK_PLAYGROUND_ADDRESS;
    const kycPass = localStorage.getItem('kyc_pass_address') || 
                    process.env.NEXT_PUBLIC_KYC_PASS_ADDRESS || 
                    MOCK_KYC_PASS_ADDRESS;
    
    setPlaygroundAddress(playground);
    setKycPassAddress(kycPass);

    // 连接钱包
    connectWallet();
  }, []);

  // 更新统计
  useEffect(() => {
    const verified = applicants.filter(a => a.status === 'Verified').length;
    const minted = applicants.filter(a => a.minted).length;
    setStats(prev => ({
      ...prev,
      applicants: applicants.length,
      verified,
      passMinted: minted,
    }));
  }, [applicants]);

  // 连接钱包（Mock版本 - 生成随机地址）
  const connectWallet = async () => {
    try {
      // Mock: 生成一个随机地址作为"连接"的钱包
      const randomWallet = ethers.Wallet.createRandom();
      setConnectedAddress(randomWallet.address);
      setError('');
    } catch (err: any) {
      setError(err.message || '连接钱包失败');
    }
  };

  // 切换到 Monad Testnet
  const switchToMonadTestnet = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // 链不存在，添加它
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: MONAD_CHAIN_ID,
              chainName: 'Monad Testnet',
              nativeCurrency: {
                name: 'MON',
                symbol: 'MON',
                decimals: 18,
              },
              rpcUrls: [MONAD_TESTNET_RPC],
              blockExplorerUrls: ['https://testnet-explorer.monad.xyz'],
            }],
          });
        } catch (addError) {
          setError('添加 Monad Testnet 失败');
        }
      } else {
        setError('切换网络失败');
      }
    }
  };

  // 生成 50 个 Applicants
  const generateApplicants = () => {
    // 如果没有连接地址，先自动生成一个
    if (!connectedAddress) {
      const randomWallet = ethers.Wallet.createRandom();
      setConnectedAddress(randomWallet.address);
    }
    
    const addressToUse = connectedAddress || ethers.Wallet.createRandom().address;

    const countries = ['SG', 'HK', 'JP', 'US'];
    const newApplicants: KycApplicant[] = [];
    
    // 确保当前连接的钱包地址作为第一个
    const issuerPubKey = '0x' + ethers.randomBytes(32).slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // 第一个：当前连接的钱包（确保通过）
    const firstClaims: KycClaim = {
      country: 'SG',
      over18: true,
      notSanctioned: true,
    };
    const firstPubInput = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'bool', 'bool', 'bytes'],
        [firstClaims.country, firstClaims.over18, firstClaims.notSanctioned, issuerPubKey]
      )
    );
    const firstProofId = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(['address', 'bytes32'], [addressToUse, firstPubInput])
    );
    const firstProof = ethers.randomBytes(32);
    
    newApplicants.push({
      address: addressToUse,
      proofId: firstProofId,
      publicInputHash: firstPubInput,
      proof: ethers.hexlify(firstProof),
      work: 150, // 适中的 work 值
      deadline: 0,
      claims: firstClaims,
      status: 'Pending',
      minted: false,
    });

    // 生成其他 49 个
    for (let i = 0; i < 49; i++) {
      const randomBytes = ethers.randomBytes(20);
      const address = ethers.getAddress(ethers.hexlify(randomBytes));
      const claims: KycClaim = {
        country: countries[i % countries.length],
        over18: Math.random() > 0.1, // 90% 概率 over18
        notSanctioned: Math.random() > 0.05, // 95% 概率 notSanctioned
      };
      
      const pubInput = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['string', 'bool', 'bool', 'bytes'],
          [claims.country, claims.over18, claims.notSanctioned, issuerPubKey]
        )
      );
      const proofId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address', 'bytes32'], [address, pubInput])
      );
      const proof = ethers.randomBytes(32);
      
      // work 值：根据 claims 变化（notSanctioned=true 时稍高）
      const work = claims.notSanctioned ? 100 + Math.floor(Math.random() * 100) : 50 + Math.floor(Math.random() * 50);

      newApplicants.push({
        address,
        proofId,
        publicInputHash: pubInput,
        proof: ethers.hexlify(proof),
        work,
        deadline: 0,
        claims,
        status: 'Pending',
        minted: false,
      });
    }

    setApplicants(newApplicants);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newApplicants));
    setError('');
  };

  // 验证 50 个（Mock版本）
  const verifyBatch = async () => {
    if (applicants.length === 0) {
      setError('请先生成 Applicants');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTxHash('');

      // 准备 ProofJobs
      const jobs = applicants.map(app => ({
        id: app.proofId,
        publicInputHash: app.publicInputHash,
        proof: app.proof,
        work: app.work,
        deadline: app.deadline,
      }));

      // 执行批量验证（Mock）
      const startTime = Date.now();
      const tx = await mockVerifyBatch(jobs);
      const receipt = await tx.wait();
      const endTime = Date.now();

      const latencyMs = endTime - startTime;
      const gasUsed = receipt.gasUsed;
      const gasPerProof = Number(gasUsed) / applicants.length;

      setTxHash(receipt.hash);

      // 读取验证结果（Mock）
      const updated = [...applicants];
      let verifiedCount = 0;
      for (let i = 0; i < updated.length; i++) {
        const { mockGetResult } = await import('../lib/mock');
        const result = await mockGetResult(updated[i].proofId);
        if (result.done && result.ok) {
          updated[i].status = 'Verified';
          verifiedCount++;
        } else if (result.done && !result.ok) {
          updated[i].status = 'Rejected';
        }
      }

      setApplicants(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      setStats(prev => ({
        ...prev,
        latencyMs,
        gasUsed,
        gasPerProof,
        verified: verifiedCount,
      }));

      setError('');
    } catch (err: any) {
      setError(err.message || '批量验证失败');
      console.error('Verify batch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mint Pass（批量，Mock版本）
  const mintBatch = async () => {
    const verifiedApplicants = applicants.filter(a => a.status === 'Verified' && !a.minted);
    if (verifiedApplicants.length === 0) {
      setError('没有可 Mint 的 Pass');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const tos = verifiedApplicants.map(a => a.address);
      const proofIds = verifiedApplicants.map(a => a.proofId);

      // Mock Mint Pass
      const tx = await mockMintBatch(tos, proofIds);
      await tx.wait();

      // 更新状态
      const updated = [...applicants];
      for (const app of verifiedApplicants) {
        const idx = updated.findIndex(a => a.address === app.address);
        if (idx >= 0) {
          updated[idx].minted = true;
        }
      }

      setApplicants(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      setStats(prev => ({
        ...prev,
        passMinted: updated.filter(a => a.minted).length,
      }));

      setError('');
    } catch (err: any) {
      setError(err.message || 'Mint Pass 失败');
      console.error('Mint batch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Batch zk-KYC Gate - Parallel ZK Playground</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* 头部 */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="text-indigo-600 hover:underline">
              ← 返回首页
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">🔐 Batch zk-KYC Gate</h1>
            <div className="w-20"></div>
          </div>

          {/* 网络切换 */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">网络状态</p>
                {connectedAddress && (
                  <p className="text-xs text-gray-500 font-mono">{formatAddress(connectedAddress)}</p>
                )}
              </div>
              <div className="flex gap-2">
                {!connectedAddress && (
                  <button
                    onClick={connectWallet}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    连接钱包
                  </button>
                )}
                <button
                  onClick={switchToMonadTestnet}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  切换到 Monad Testnet
                </button>
              </div>
            </div>
          </div>

          {/* Batch zk-KYC 核心逻辑说明 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-900">🔐 Batch zk-KYC 核心逻辑</h2>
            <div className="space-y-3 text-sm text-purple-800">
              <div>
                <h3 className="font-semibold mb-2">1. KYC Claims 生成</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>每个 Applicant 包含 KYC Claims：<code className="bg-purple-100 px-1 rounded">country</code>, <code className="bg-purple-100 px-1 rounded">over18</code>, <code className="bg-purple-100 px-1 rounded">notSanctioned</code></li>
                  <li>Claims 与 issuer 公钥一起编码为 <code className="bg-purple-100 px-1 rounded">publicInputHash</code></li>
                  <li>Proof ID 由地址和 publicInputHash 生成：<code className="bg-purple-100 px-1 rounded">keccak256(address || publicInputHash)</code></li>
                  <li>支持批量生成 50 个 Applicants，用于演示大规模验证</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. 批量验证流程</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>调用 Playground 合约的 <code className="bg-purple-100 px-1 rounded">verifyBatch</code> 方法</li>
                  <li>所有 50 个 Proof 在一次交易中验证</li>
                  <li>每个 Proof 的验证结果独立存储，支持并行执行</li>
                  <li>验证状态：<code className="bg-purple-100 px-1 rounded">Pending</code> → <code className="bg-purple-100 px-1 rounded">Verified</code> / <code className="bg-purple-100 px-1 rounded">Rejected</code></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. Pass Mint 机制</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>只有验证通过的 Applicants 才能 Mint Pass</li>
                  <li>调用 KycPass 合约的 <code className="bg-purple-100 px-1 rounded">mintBatch</code> 方法</li>
                  <li>批量 Mint 多个 Pass，减少交易次数和 gas 成本</li>
                  <li>Pass 是 ERC721 NFT，可以用于后续的访问控制</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">4. 并行友好设计</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>验证结果存储在独立的存储槽中，避免写热点</li>
                  <li>统计指标（verified, minted）从前端聚合，而非链上累加</li>
                  <li>在 Monad 并行执行时，多个 Proof 的验证和写入可以同时进行</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 合约地址设置 */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Playground 合约地址
                </label>
                <input
                  type="text"
                  value={playgroundAddress}
                  onChange={(e) => {
                    setPlaygroundAddress(e.target.value);
                    localStorage.setItem('playground_address', e.target.value);
                  }}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  KycPass 合约地址
                </label>
                <input
                  type="text"
                  value={kycPassAddress}
                  onChange={(e) => {
                    setKycPassAddress(e.target.value);
                    localStorage.setItem('kyc_pass_address', e.target.value);
                  }}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Dashboard */}
          <div className="grid md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Applicants</div>
              <div className="text-2xl font-bold text-gray-900">{stats.applicants}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Verified</div>
              <div className="text-2xl font-bold text-green-600">{stats.verified} / {stats.applicants}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Pass Minted</div>
              <div className="text-2xl font-bold text-blue-600">{stats.passMinted}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Latency</div>
              <div className="text-2xl font-bold text-purple-600">{stats.latencyMs} ms</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="text-sm text-gray-600">Gas/Proof</div>
              <div className="text-2xl font-bold text-orange-600">{stats.gasPerProof.toFixed(0)}</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex gap-3">
              <button
                onClick={generateApplicants}
                disabled={!connectedAddress || loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                🎲 生成 50 个 Applicants
              </button>
              <button
                onClick={verifyBatch}
                disabled={applicants.length === 0 || loading}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ 验证中...' : '✅ Verify 50'}
              </button>
              <button
                onClick={mintBatch}
                disabled={applicants.filter(a => a.status === 'Verified' && !a.minted).length === 0 || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                🎫 Mint Pass
              </button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">❌ {error}</p>
            </div>
          )}

          {/* 交易哈希 */}
          {txHash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 text-sm">
                ✅ 交易成功:{' '}
                <a
                  href={`https://testnet-explorer.monad.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-mono"
                >
                  {txHash.slice(0, 20)}...
                </a>
              </p>
            </div>
          )}

          {/* 申请人表格 */}
          {applicants.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Applicants Table</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Avatar</th>
                      <th className="text-left py-2 px-2">Address</th>
                      <th className="text-left py-2 px-2">Claims</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-left py-2 px-2">Minted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((app, idx) => (
                      <tr key={app.proofId} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">
                          <div className={`w-10 h-10 rounded-full ${generateAvatar(app.address)} flex items-center justify-center text-white font-bold`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="py-2 px-2 font-mono text-xs">{formatAddress(app.address)}</td>
                        <td className="py-2 px-2">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{app.claims.country}</span>
                            {app.claims.over18 && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">over18</span>}
                            {app.claims.notSanctioned && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">notSanctioned</span>}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            app.status === 'Verified' ? 'bg-green-100 text-green-700' :
                            app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          {app.minted ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">✓</span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
