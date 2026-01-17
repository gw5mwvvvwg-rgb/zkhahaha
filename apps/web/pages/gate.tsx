import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { KYCPASS_ABI } from '../lib/abis';
import { MOCK_KYC_PASS_ADDRESS, mockHasPass } from '../lib/mock';

const MONAD_CHAIN_ID = '0x2797'; // 10143 in hex
const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz';

export default function Gate() {
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [kycPassAddress, setKycPassAddress] = useState('');
  const [hasPass, setHasPass] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  // 加载配置
  useEffect(() => {
    const kycPass = localStorage.getItem('kyc_pass_address') || 
                    process.env.NEXT_PUBLIC_KYC_PASS_ADDRESS || 
                    MOCK_KYC_PASS_ADDRESS;
    setKycPassAddress(kycPass);

    // 连接钱包
    connectWallet();
  }, []);

  // 检查 Pass 状态
  useEffect(() => {
    if (connectedAddress && kycPassAddress) {
      checkPassStatus();
    }
  }, [connectedAddress, kycPassAddress]);

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

  // 检查 Pass 状态（Mock版本）
  const checkPassStatus = async () => {
    if (!connectedAddress) return;

    try {
      setChecking(true);
      setError('');

      // Mock 检查 Pass 状态
      const passStatus = await mockHasPass(connectedAddress);
      setHasPass(passStatus);
    } catch (err: any) {
      setError(err.message || '检查 Pass 状态失败');
      console.error('Check pass error:', err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Head>
        <title>KYC Gate - Parallel ZK Playground</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* 头部 */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="text-emerald-600 hover:underline">
              ← 返回首页
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">🚪 KYC Gate</h1>
            <div className="w-20"></div>
          </div>

          {/* 网络切换 */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">网络状态</p>
                {connectedAddress && (
                  <p className="text-xs text-gray-500 font-mono">{connectedAddress.slice(0, 10)}...{connectedAddress.slice(-8)}</p>
                )}
              </div>
              <div className="flex gap-2">
                {!connectedAddress && (
                  <button
                    onClick={connectWallet}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
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

          {/* KYC Gate 核心逻辑说明 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-900">🚪 KYC Gate 核心逻辑</h2>
            <div className="space-y-3 text-sm text-green-800">
              <div>
                <h3 className="font-semibold mb-2">1. Pass 状态检查</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>调用 KycPass 合约的 <code className="bg-green-100 px-1 rounded">hasPass(address user)</code> 方法</li>
                  <li>查询指定地址是否拥有 KYC Pass NFT</li>
                  <li>返回 <code className="bg-green-100 px-1 rounded">bool</code>：<code className="bg-green-100 px-1 rounded">true</code> 表示已通过验证，<code className="bg-green-100 px-1 rounded">false</code> 表示未通过</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. 访问控制机制</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>未通过验证</strong>：显示"Not Verified"，引导用户前往 KYC Portal 完成验证</li>
                  <li><strong>已通过验证</strong>：显示"Access Granted"，解锁专属内容</li>
                  <li>Pass 是 ERC721 NFT，支持转移和交易</li>
                  <li>可以基于 Pass 实现各种访问控制场景（如会员权益、内容解锁等）</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. 工作流程</h3>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>用户前往 <code className="bg-green-100 px-1 rounded">/kyc</code> 页面</li>
                  <li>生成 Applicants 并批量验证 zkKYC Proof</li>
                  <li>对验证通过的地址 Mint Pass</li>
                  <li>返回 <code className="bg-green-100 px-1 rounded">/gate</code> 页面检查访问权限</li>
                  <li>验证通过后即可访问解锁内容</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 合约地址设置 */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Gate 状态卡 */}
          <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
            {checking ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-600">检查中...</p>
              </div>
            ) : hasPass === null ? (
              <div className="text-center py-12">
                <p className="text-gray-600">请连接钱包并设置合约地址</p>
              </div>
            ) : hasPass ? (
              <div className="text-center">
                {/* 成功按钮（带动画） */}
                <button
                  className="px-12 py-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-2xl font-bold shadow-lg transform hover:scale-105 transition-all duration-300 mb-8 animate-pulse"
                  style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                >
                  ✅ Access Granted
                </button>

                {/* 状态卡 */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-3xl text-white">✓</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-green-700 mb-2">Verified ✅</h2>
                  <p className="text-gray-700">您已通过 zkKYC 验证，欢迎访问！</p>
                </div>

                {/* 解锁内容区 */}
                <div className="mt-8 space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">🎁 解锁内容</h3>
                  
                  {/* 链接卡片 */}
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <a
                      href="https://monad.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 hover:bg-indigo-100 transition-colors"
                    >
                      <div className="text-indigo-600 font-semibold mb-1">Monad</div>
                      <div className="text-sm text-gray-600">官方网站</div>
                    </a>
                    <a
                      href="https://testnet-explorer.monad.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors"
                    >
                      <div className="text-purple-600 font-semibold mb-1">Explorer</div>
                      <div className="text-sm text-gray-600">区块浏览器</div>
                    </a>
                    <a
                      href="/kyc"
                      className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                    >
                      <div className="text-blue-600 font-semibold mb-1">KYC Portal</div>
                      <div className="text-sm text-gray-600">验证中心</div>
                    </a>
                  </div>

                  {/* 隐藏文本（折扣码样式） */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-6 mt-6">
                    <div className="text-sm text-gray-600 mb-2">专属折扣码</div>
                    <div className="font-mono text-2xl font-bold text-orange-700 tracking-wider">
                      MONAD-KYC-2024
                    </div>
                    <div className="text-xs text-gray-500 mt-2">有效期至 2024 年 12 月 31 日</div>
                  </div>

                  {/* 额外内容 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">📚 访问权限</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• 访问所有公开内容</li>
                      <li>• 参与社区活动</li>
                      <li>• 享受会员折扣</li>
                      <li>• 优先技术支持</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                {/* 拒绝按钮 */}
                <button
                  className="px-12 py-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-2xl font-bold shadow-lg mb-8"
                  disabled
                >
                  ❌ Not Verified
                </button>

                {/* 状态卡 */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-3xl text-white">✗</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-red-700 mb-2">Not Verified ❌</h2>
                  <p className="text-gray-700 mb-4">您尚未通过 zkKYC 验证</p>
                  <Link
                    href="/kyc"
                    className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                  >
                    前往 /kyc 完成验证
                  </Link>
                </div>

                {/* 引导信息 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🔐 如何获得 KYC Pass？</h4>
                  <ol className="text-sm text-blue-800 space-y-2 text-left max-w-md mx-auto">
                    <li>1. 前往 <Link href="/kyc" className="underline font-semibold">KYC Portal</Link></li>
                    <li>2. 连接钱包并生成 Applicants</li>
                    <li>3. 执行批量验证 (Verify 50)</li>
                    <li>4. 对验证通过的地址 Mint Pass</li>
                    <li>5. 返回此页面检查访问权限</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
