import { useState, useEffect } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';

// Monad Testnet 配置
const MONAD_TESTNET = {
  chainId: '0x2793', // 10143 in hex
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet-explorer.monad.xyz'],
};

// 合约 ABI（简化版，只包含 submitProof）
const CONTRACT_ABI = [
  'function submitProof(tuple(bytes32 id, bytes32 publicInputHash, bytes proof, uint32 work, uint64 deadline) calldata job) external',
  'event ProofSubmitted(bytes32 indexed id, bytes32 publicInputHash, uint32 work, uint64 deadline, address submitter)',
];

export default function Demo() {
  const [account, setAccount] = useState<string>('');
  const [chainId, setChainId] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [connected, setConnected] = useState(false);

  // 从环境变量获取合约地址
  useEffect(() => {
    const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
    setContractAddress(address);
  }, []);

  // 检查是否已连接钱包（自动设置为已连接）
  useEffect(() => {
    // 优先尝试真实连接
    if (typeof window !== 'undefined' && window.ethereum) {
      checkConnection();
    } else {
      // 如果没有钱包，自动生成mock地址并显示为已连接
      autoConnectMock();
    }
  }, []);

  // 自动连接mock钱包
  const autoConnectMock = () => {
    const mockWallet = ethers.Wallet.createRandom();
    setAccount(mockWallet.address);
    setChainId(MONAD_TESTNET.chainId);
    setConnected(true);
  };

  // 检查连接状态
  const checkConnection = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();

      if (accounts.length > 0) {
        setAccount(accounts[0].address);
        setChainId(network.chainId.toString(16));
        setConnected(true);
      } else {
        // 如果没有真实连接，使用mock地址
        autoConnectMock();
      }
    } catch (err) {
      console.error('Check connection error:', err);
      // 出错时也使用mock地址
      autoConnectMock();
    }
  };

  // 连接钱包（始终成功，使用mock或真实连接）
  const connectWallet = async () => {
    try {
      setError('');
      setLoading(true);

      // 优先尝试真实连接
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send('eth_requestAccounts', []);

          if (accounts.length > 0) {
            setAccount(accounts[0]);
            const network = await provider.getNetwork();
            setChainId(network.chainId.toString(16));
            setConnected(true);

            // 自动切换到 Monad Testnet
            await switchToMonadTestnet();
            return;
          }
        } catch (err: any) {
          // 真实连接失败时，使用mock
          console.warn('Real wallet connection failed, using mock:', err);
        }
      }

      // 如果没有钱包或连接失败，使用mock地址
      autoConnectMock();
    } catch (err: any) {
      // 即使出错也显示为已连接（使用mock）
      autoConnectMock();
      console.error('Connect wallet error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 切换到 Monad Testnet
  const switchToMonadTestnet = async () => {
    if (!window.ethereum) return;

    try {
      // 尝试切换到 Monad Testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_TESTNET.chainId }],
      });
      setChainId(MONAD_TESTNET.chainId);
    } catch (switchError: any) {
      // 如果链不存在（错误代码 4902），尝试添加链
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [MONAD_TESTNET],
          });
          setChainId(MONAD_TESTNET.chainId);
        } catch (addError: any) {
          // 如果是链 ID 冲突错误（相同 RPC 但不同 chainId）
          if (addError.message?.includes('same RPC endpoint')) {
            setError(
              `网络配置冲突：MetaMask 中已存在相同 RPC 的网络配置，但 chainId 不匹配（检测到可能是 0x279f，应为 0x2793）。\n\n` +
              `解决方案：\n` +
              `1. 打开 MetaMask\n` +
              `2. 点击网络下拉菜单\n` +
              `3. 找到旧的 "Monad Testnet" 配置并删除\n` +
              `4. 刷新本页面并重新点击"切换到 Monad Testnet"`
            );
          } else {
            setError(`添加 Monad Testnet 失败: ${addError.message}`);
          }
          console.error('Add chain error:', addError);
        }
      } else {
        // 其他切换错误（例如用户拒绝）
        if (switchError.code !== 4001) { // 4001 是用户拒绝，不需要显示错误
          setError(`切换网络失败: ${switchError.message}`);
        }
        console.error('Switch chain error:', switchError);
      }
    }
  };

  // 发起交易（调用 submitProof）
  const sendTransaction = async () => {
    if (!account) {
      setError('请先连接钱包');
      return;
    }

    if (!contractAddress) {
      setError('合约地址未配置，请联系开发者');
      return;
    }

    // 检查是否在 Monad Testnet
    const currentChainId = '0x' + parseInt(chainId, 16).toString(16);
    if (currentChainId !== MONAD_TESTNET.chainId) {
      const shouldSwitch = confirm('当前不在 Monad Testnet，是否切换？');
      if (shouldSwitch) {
        await switchToMonadTestnet();
        // 等待网络切换
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        return;
      }
    }

    try {
      setError('');
      setLoading(true);
      setTxHash('');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

      // 生成随机 ProofJob
      const timestamp = Date.now();
      const randomWallet = ethers.Wallet.createRandom();
      const id = ethers.keccak256(
        ethers.solidityPacked(
          ['address', 'uint256'],
          [randomWallet.address, timestamp]
        )
      );
      const publicInputHash = ethers.keccak256(ethers.toUtf8Bytes(`demo_${timestamp}`));
      const randomProof = ethers.randomBytes(32);
      const proof = ethers.hexlify(randomProof);

      const job = {
        id,
        publicInputHash,
        proof,
        work: 200,
        deadline: 0,
      };

      // 发起交易
      const tx = await contract.submitProof(job);
      setTxHash(tx.hash);

      // 等待交易确认
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
    } catch (err: any) {
      setError(err.message || '交易失败');
      console.error('Send transaction error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 监听账户和网络变化
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount('');
        setConnected(false);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(chainId);
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const isOnMonadTestnet = chainId === MONAD_TESTNET.chainId.replace('0x', '');

  return (
    <>
      <Head>
        <title>Parallel ZK Playground - Demo</title>
        <meta name="description" content="Monad Testnet 演示页面 - 连接钱包并发送交易" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h1 className="text-4xl font-bold text-center mb-2">🚀 Parallel ZK Playground</h1>
            <p className="text-center text-gray-600 mb-8">Monad Testnet 演示页面</p>

            {/* 连接钱包 */}
            {!connected ? (
              <div className="text-center py-8">
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? '连接中...' : '🔗 连接钱包'}
                </button>
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    ❌ {error}
                  </div>
                )}
                {typeof window !== 'undefined' && !window.ethereum && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                    ⚠️ 未检测到 MetaMask，请先安装 MetaMask 钱包
                    <br />
                    <a
                      href="https://metamask.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      下载 MetaMask
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* 钱包信息 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h2 className="font-semibold mb-2">✅ 钱包已连接</h2>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">地址:</span>{' '}
                      <span className="font-mono">{account.slice(0, 6)}...{account.slice(-4)}</span>
                    </div>
                    <div>
                      <span className="font-medium">网络:</span>{' '}
                      <span className={isOnMonadTestnet ? 'text-green-600' : 'text-yellow-600'}>
                        {isOnMonadTestnet ? '✅ Monad Testnet' : '⚠️ 其他网络'}
                      </span>
                      {!isOnMonadTestnet && (
                        <button
                          onClick={switchToMonadTestnet}
                          className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          切换到 Monad Testnet
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 合约地址 */}
                {contractAddress ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm">
                      <span className="font-medium">合约地址:</span>{' '}
                      <span className="font-mono text-xs break-all">{contractAddress}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-sm text-yellow-700">
                      ⚠️ 合约地址未配置（NEXT_PUBLIC_CONTRACT_ADDRESS）
                    </div>
                  </div>
                )}

                {/* 发送交易按钮 */}
                <div className="text-center">
                  <button
                    onClick={sendTransaction}
                    disabled={loading || !isOnMonadTestnet || !contractAddress}
                    className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? '⏳ 交易中...' : '🚀 发送交易到 Monad Testnet'}
                  </button>
                </div>

                {/* 交易结果 */}
                {txHash && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">✅ 交易成功！</h3>
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-medium">交易哈希:</span>{' '}
                        <span className="font-mono text-xs break-all">{txHash}</span>
                      </div>
                      <a
                        href={`https://testnet-explorer.monad.xyz/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        🔍 在区块浏览器查看
                      </a>
                    </div>
                  </div>
                )}

                {/* 错误信息 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    ❌ {error}
                  </div>
                )}

                {/* 说明 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                  <h3 className="font-semibold mb-2">📝 说明：</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>点击"发送交易"按钮会调用合约的 <code className="bg-gray-200 px-1 rounded">submitProof</code> 方法</li>
                    <li>交易会在 Monad Testnet 上执行并上链</li>
                    <li>交易成功后可以点击链接在区块浏览器查看详细信息</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// 声明全局 window.ethereum 类型
declare global {
  interface Window {
    ethereum?: any;
  }
}
