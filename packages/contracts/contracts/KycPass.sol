// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @notice ParallelZKPlayground 接口（用于读取验证结果）
 */
interface IParallelZKPlayground {
    struct Result {
        bool done;
        bool ok;
        uint64 ts;
        address verifier;
    }

    function results(bytes32 id) external view returns (Result memory);
}

/**
 * @title KycPass
 * @notice KYC Pass 凭证合约（SBT，不可转移）
 * @dev 基于 ERC721 实现的 Soulbound Token (SBT)
 *      每个地址最多只能 mint 一个 token
 *      禁止 transfer 和 approve 操作（不可转移）
 */
contract KycPass is ERC721, ReentrancyGuard {
    // ParallelZKPlayground 合约接口
    IParallelZKPlayground public immutable playground;

    // 每个地址是否已 mint（one-per-address）
    mapping(address => bool) private _hasMinted;

    // tokenId -> owner address 映射
    mapping(uint256 => address) private _tokenOwners;

    // owner -> tokenId 映射
    mapping(address => uint256) private _ownerTokens;

    // 下一个 tokenId
    uint256 private _nextTokenId = 1;


    /**
     * @notice Pass Minted 事件
     * @param to 接收地址
     * @param tokenId token ID
     * @param proofId 关联的 proof ID
     */
    event PassMinted(address indexed to, uint256 indexed tokenId, bytes32 indexed proofId);

    /**
     * @notice 构造函数
     * @param _playground ParallelZKPlayground 合约地址
     */
    constructor(address _playground) ERC721("KYC Pass", "KYCP") {
        require(_playground != address(0), "Invalid playground address");
        playground = IParallelZKPlayground(_playground);
    }

    /**
     * @notice 检查地址是否有 Pass
     * @param user 用户地址
     * @return 是否有 Pass
     */
    function hasPass(address user) external view returns (bool) {
        return _hasMinted[user];
    }

    /**
     * @notice 获取用户的 tokenId（如果有）
     * @param user 用户地址
     * @return tokenId，如果没有则返回 0
     */
    function getTokenId(address user) external view returns (uint256) {
        return _ownerTokens[user];
    }

    /**
     * @notice Mint Pass（单个）
     * @param to 接收地址
     * @param proofId 关联的 proof ID（用于验证）
     * @dev 要求：
     *      1. playground.results(proofId) 必须 done==true && ok==true
     *      2. to 地址必须未 mint 过（one-per-address）
     */
    function mint(address to, bytes32 proofId) external nonReentrant {
        require(to != address(0), "Cannot mint to zero address");
        require(!_hasMinted[to], "Address already has a pass");

        // 读取 playground 验证结果
        IParallelZKPlayground.Result memory result = playground.results(proofId);
        require(result.done, "Proof not processed");
        require(result.ok, "Proof verification failed");

        // Mint token
        uint256 tokenId = _nextTokenId++;
        _hasMinted[to] = true;
        _tokenOwners[tokenId] = to;
        _ownerTokens[to] = tokenId;

        _safeMint(to, tokenId);

        emit PassMinted(to, tokenId, proofId);
    }

    /**
     * @notice 批量 Mint Pass
     * @param tos 接收地址数组
     * @param proofIds 关联的 proof ID 数组
     * @dev 批量操作，失败项跳过（不影响其他项）
     */
    function mintBatch(address[] calldata tos, bytes32[] calldata proofIds) external nonReentrant {
        require(tos.length == proofIds.length, "Array length mismatch");

        for (uint256 i = 0; i < tos.length; i++) {
            address to = tos[i];
            bytes32 proofId = proofIds[i];

            // 跳过无效地址和已 mint 的地址
            if (to == address(0) || _hasMinted[to]) {
                continue;
            }

            // 读取 playground 验证结果
            IParallelZKPlayground.Result memory result = playground.results(proofId);
            if (!result.done || !result.ok) {
                continue;
            }

            // Mint token
            uint256 tokenId = _nextTokenId++;
            _hasMinted[to] = true;
            _tokenOwners[tokenId] = to;
            _ownerTokens[to] = tokenId;

            _safeMint(to, tokenId);

            emit PassMinted(to, tokenId, proofId);
        }
    }

    /**
     * @notice 覆盖 _update 以阻止 token 转移（SBT 不可转移）
     * @dev 只有 mint（from == address(0)）和 burn（to == address(0)）允许
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // 允许 mint (from == address(0)) 和 burn (to == address(0))
        if (from == address(0) || to == address(0)) {
            return super._update(to, tokenId, auth);
        }
        
        // 禁止其他转移操作
        revert("KycPass: SBT is non-transferable");
    }

    /**
     * @notice 支持 burn（可选功能，允许销毁 Pass）
     * @param tokenId token ID
     * @dev 只有 owner 可以 burn
     */
    function burn(uint256 tokenId) external {
        address owner = ownerOf(tokenId);
        require(owner == msg.sender, "Only owner can burn");
        _hasMinted[owner] = false;
        _ownerTokens[owner] = 0;
        _burn(tokenId);
    }
}
