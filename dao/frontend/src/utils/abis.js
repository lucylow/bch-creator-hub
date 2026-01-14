// Minimal ABIs containing only the functions the UI uses
export const GOVERNOR_ABI = [
  // propose
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
  // castVote
  "function castVote(uint256 proposalId, uint8 support) public returns (uint256)",
  // state
  "function state(uint256 proposalId) view returns (uint8)",
  // queue & execute (OpenZeppelin)
  "function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public",
  "function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) public payable",
  // getVotes (optional)
  "function getVotes(address account) view returns (uint256)",
  // Event
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)"
];

export const TREASURY_ABI = [
  "function releaseEther(address payable to, uint256 amount) external",
  "function releaseERC20(address token, address to, uint256 amount) external"
];

export const TOKEN_ABI = [
  "function delegate(address delegatee)",
  "function getVotes(address account) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];



