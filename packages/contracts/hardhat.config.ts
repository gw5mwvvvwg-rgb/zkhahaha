import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";

// 从项目根目录加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    monadTestnet: {
      url: process.env.MONAD_RPC || "https://testnet-rpc.monad.xyz",
      accounts: process.env.PRIVATE_KEY 
        ? (process.env.PRIVATE_KEY.startsWith('0x') 
            ? [process.env.PRIVATE_KEY] 
            : [`0x${process.env.PRIVATE_KEY}`])
        : [],
      chainId: 10143,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
