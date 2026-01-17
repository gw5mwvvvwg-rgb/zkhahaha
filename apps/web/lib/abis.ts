// 最小化 ABI（只包含前端使用的方法和事件）

export const PLAYGROUND_ABI = [
  'function verifyBatch(tuple(bytes32 id, bytes32 publicInputHash, bytes proof, uint32 work, uint64 deadline)[] calldata jobs) external',
  'function results(bytes32 id) external view returns (bool done, bool ok, uint64 ts, address verifier)',
  'event ProofVerified(bytes32 indexed id, bool ok, uint32 work, address verifier, uint256 blockNumber, uint64 ts)',
] as const;

export const KYCPASS_ABI = [
  'function hasPass(address user) external view returns (bool)',
  'function getTokenId(address user) external view returns (uint256)',
  'function mint(address to, bytes32 proofId) external',
  'function mintBatch(address[] calldata tos, bytes32[] calldata proofIds) external',
  'function burn(uint256 tokenId) external',
  'event PassMinted(address indexed to, uint256 indexed tokenId, bytes32 indexed proofId)',
] as const;
