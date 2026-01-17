import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Parallel ZK Playground</title>
        <meta name="description" content="Parallel ZK Proof Batch Verification Demo on Monad Testnet" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Parallel ZK Playground
            </h1>
            <p className="text-xl text-gray-700 mb-12">
              并行 ZK 证明批量验证演示 · Monad Testnet
            </p>

            <div className="mb-8 text-center">
              <Link
                href="/demo"
                className="inline-block px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg shadow-lg transition-all transform hover:scale-105"
              >
                🚀 Hackathon 演示页面（评委入口）
              </Link>
              <p className="mt-2 text-sm text-gray-600">
                连接钱包 → 切换网络 → 发送交易
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Link href="/upload" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-3">📤</div>
                <h2 className="text-xl font-semibold mb-2">Upload Proof</h2>
                <p className="text-gray-600">上传或生成 Proof Job</p>
              </Link>

              <Link href="/batch" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-3">⚡</div>
                <h2 className="text-xl font-semibold mb-2">Batch Verify</h2>
                <p className="text-gray-600">批量验证 Proof</p>
              </Link>

              <Link href="/receipt" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-3">📋</div>
                <h2 className="text-xl font-semibold mb-2">View Receipt</h2>
                <p className="text-gray-600">查看验证回执</p>
              </Link>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">🔐 Batch zk-KYC Gate</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                <Link href="/kyc" className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-purple-300">
                  <div className="text-4xl mb-3">🔐</div>
                  <h2 className="text-xl font-semibold mb-2 text-gray-900">Batch zk-KYC</h2>
                  <p className="text-gray-700">批量验证 KYC Applicants，生成 Pass</p>
                  <div className="mt-3 text-sm text-gray-600">
                    • 生成 50 个 Applicants<br/>
                    • 批量验证 zkKYC Proof<br/>
                    • 一键 Mint Pass
                  </div>
                </Link>

                <Link href="/gate" className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-green-300">
                  <div className="text-4xl mb-3">🚪</div>
                  <h2 className="text-xl font-semibold mb-2 text-gray-900">KYC Gate</h2>
                  <p className="text-gray-700">检查 KYC Pass 状态，访问解锁内容</p>
                  <div className="mt-3 text-sm text-gray-600">
                    • 检查 Pass 验证状态<br/>
                    • 解锁专属内容<br/>
                    • 获得访问权限
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
              <h3 className="text-lg font-semibold mb-3">🚀 并行友好设计</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 使用 <code className="bg-blue-100 px-2 py-1 rounded">mapping(bytes32 =&gt; Result)</code> 分散写入，避免写热点</li>
                <li>• Monad 并行执行时，不同 proofId 的写入可以并行处理</li>
                <li>• 统计通过前端从事件聚合，而非链上全局累加器</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
