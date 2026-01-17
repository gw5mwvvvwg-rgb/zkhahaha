// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ParallelZKPlayground
 * @notice 并行友好的 ZK 证明批量验证演示合约
 * @dev 关键设计：使用 mapping(bytes32 => Result) 分散写入，避免共享写热点
 *      所有统计（如 totalVerified）改在前端从事件聚合，而非链上全局累加器
 */
contract ParallelZKPlayground {
    /**
     * @notice Proof 任务结构
     * @param id 唯一标识符（通常为 keccak256 哈希）
     * @param publicInputHash 公共输入哈希
     * @param proof 证明数据（bytes）
     * @param work 模拟验证工作量（用于控制 gas 消耗）
     * @param deadline 过期时间戳（0 表示永不过期）
     */
    struct ProofJob {
        bytes32 id;
        bytes32 publicInputHash;
        bytes proof;
        uint32 work;
        uint64 deadline;
    }

    /**
     * @notice 验证结果结构
     * @param done 是否已处理
     * @param ok 验证是否成功
     * @param ts 验证时间戳
     * @param verifier 验证者地址
     */
    struct Result {
        bool done;
        bool ok;
        uint64 ts;
        address verifier;
    }

    /**
     * @notice 并行友好的存储布局：proofId -> Result
     * @dev 每个 proofId 独立存储槽，避免写热点
     *      Monad 并行执行时，不同 proofId 的写入可以并行处理
     */
    mapping(bytes32 => Result) public results;

    /**
     * @notice Proof 提交事件
     * @param id proof 唯一标识符（indexed，便于过滤）
     * @param publicInputHash 公共输入哈希
     * @param work 工作量
     * @param deadline 过期时间戳
     * @param submitter 提交者地址
     */
    event ProofSubmitted(
        bytes32 indexed id,
        bytes32 publicInputHash,
        uint32 work,
        uint64 deadline,
        address submitter
    );

    /**
     * @notice Proof 验证事件
     * @param id proof 唯一标识符（indexed）
     * @param ok 验证结果
     * @param work 工作量
     * @param verifier 验证者地址
     * @param blockNumber 区块号
     * @param ts 时间戳
     */
    event ProofVerified(
        bytes32 indexed id,
        bool ok,
        uint32 work,
        address verifier,
        uint256 blockNumber,
        uint64 ts
    );

    /**
     * @notice 提交 Proof（仅发送事件，不改状态）
     * @param job Proof 任务
     * @dev 用于演示和工作流，实际验证通过 verifyBatch 批量处理
     */
    function submitProof(ProofJob calldata job) external {
        emit ProofSubmitted(
            job.id,
            job.publicInputHash,
            job.work,
            job.deadline,
            msg.sender
        );
    }

    /**
     * @notice 批量验证 Proof
     * @param jobs Proof 任务数组
     * @dev 并行友好的批量处理：
     *      1. 跳过过期 deadline（deadline==0 表示永不过期）
     *      2. 跳过已处理 results[id].done
     *      3. 对每个 job 调用 _mockVerify 得到验证结果
     *      4. 将结果写入 results[id]（分散写入，避免热点）
     *      5. 发送 ProofVerified 事件
     * 
     * @dev 注意：Monad 并行执行时，不同的 results[id] 写入可以并行化
     */
    function verifyBatch(ProofJob[] calldata jobs) external {
        uint64 currentTimestamp = uint64(block.timestamp);
        uint256 blockNumber = block.number;

        for (uint256 i = 0; i < jobs.length; i++) {
            ProofJob calldata job = jobs[i];

            // 跳过过期任务
            if (job.deadline != 0 && job.deadline < currentTimestamp) {
                continue;
            }

            // 跳过已处理任务
            if (results[job.id].done) {
                continue;
            }

            // 执行模拟验证（内部限制 work 上限，避免 gas 爆炸）
            bool ok = _mockVerify(job.proof, job.publicInputHash, job.work);

            // 并行友好的写入：每个 proofId 独立存储槽
            results[job.id] = Result({
                done: true,
                ok: ok,
                ts: currentTimestamp,
                verifier: msg.sender
            });

            // 发送验证事件（前端可以聚合统计）
            emit ProofVerified(
                job.id,
                ok,
                job.work,
                msg.sender,
                blockNumber,
                currentTimestamp
            );
        }
    }

    /**
     * @notice 模拟验证函数（内部）
     * @param proof 证明数据
     * @param pubHash 公共输入哈希
     * @param work 工作量（循环次数）
     * @return ok 验证结果
     * @dev 使用 keccak256 循环 work 次模拟验证计算量
     *      最终用低位条件决定 ok（例如 (uint256(h) & 0xFF) < 0x80）
     *      限制 work <= 2000 避免 gas 爆炸
     */
    function _mockVerify(
        bytes calldata proof,
        bytes32 pubHash,
        uint32 work
    ) internal pure returns (bool) {
        // 限制 work 上限，避免 gas 爆炸
        require(work <= 2000, "Work exceeds maximum (2000)");

        // 模拟验证计算：使用 keccak256 循环 work 次
        bytes32 h = keccak256(abi.encodePacked(proof, pubHash));
        for (uint32 i = 0; i < work; i++) {
            h = keccak256(abi.encodePacked(h, i));
        }

        // 使用哈希低位决定验证结果（示例：低位 < 0x80 表示成功）
        // 实际场景可替换为真实 Groth16/Plonk Verifier
        uint256 hashValue = uint256(h);
        return (hashValue & 0xFF) < 0x80;
    }
}
