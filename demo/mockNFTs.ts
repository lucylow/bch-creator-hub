/**
 * Mock NFT Metadata (CashTokens)
 * 
 * Simulates CashToken NFTs with metadata and utility information.
 */
import { ADDRESSES } from './mockAddresses';

export type MockNFT = {
  tokenId: string;
  owner: string;
  name: string;
  description: string;
  image: string;
  utility: string;
  mintedAt: string;
};

export const MOCK_NFTS: MockNFT[] = [
  {
    tokenId: "token_creator_access_001",
    owner: ADDRESSES.userLucy,
    name: "Creator Access Pass",
    description: "NFT granting premium access to Alice's content",
    image: "/demo/images/access_pass.png",
    utility: "Unlock all premium posts",
    mintedAt: "2026-01-05T15:00:00Z",
  },
  {
    tokenId: "token_dao_vote_001",
    owner: ADDRESSES.userJudge,
    name: "DAO Governance Token",
    description: "Voting power in BCH Paywall DAO",
    image: "/demo/images/dao_token.png",
    utility: "1 vote per proposal",
    mintedAt: "2026-01-05T10:00:00Z",
  },
  {
    tokenId: "token_creator_access_002",
    owner: ADDRESSES.userJudge,
    name: "Creator Access Pass",
    description: "NFT granting premium access to Bob's content",
    image: "/demo/images/access_pass.png",
    utility: "Unlock all premium posts",
    mintedAt: "2026-01-05T14:00:00Z",
  },
];

/**
 * Get NFTs owned by an address
 */
export function getNFTsForAddress(address: string): MockNFT[] {
  return MOCK_NFTS.filter(nft => nft.owner === address);
}

/**
 * Get NFT by token ID
 */
export function getNFTByTokenId(tokenId: string): MockNFT | undefined {
  return MOCK_NFTS.find(nft => nft.tokenId === tokenId);
}

/**
 * Check if address owns a specific NFT
 */
export function hasAccessNFT(address: string, tokenId: string): boolean {
  return MOCK_NFTS.some(
    nft => nft.owner === address && nft.tokenId === tokenId
  );
}


