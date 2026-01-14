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
  {
    tokenId: "token_vip_member_001",
    owner: ADDRESSES.userLucy,
    name: "VIP Membership Badge",
    description: "Exclusive VIP status with early access to new features",
    image: "/demo/images/vip_badge.png",
    utility: "Early access + exclusive content",
    mintedAt: "2026-01-04T12:00:00Z",
  },
  {
    tokenId: "token_early_supporter_001",
    owner: ADDRESSES.userJudge,
    name: "Early Supporter Token",
    description: "Recognizes early adoption of the platform",
    image: "/demo/images/early_supporter.png",
    utility: "50% discount on all purchases",
    mintedAt: "2026-01-01T08:00:00Z",
  },
  {
    tokenId: "token_creator_access_003",
    owner: ADDRESSES.userLucy,
    name: "Creator Access Pass",
    description: "NFT granting premium access to multiple creators",
    image: "/demo/images/access_pass.png",
    utility: "Unlock all premium posts from all creators",
    mintedAt: "2026-01-03T16:30:00Z",
  },
  {
    tokenId: "token_community_mod_001",
    owner: ADDRESSES.userJudge,
    name: "Community Moderator Badge",
    description: "Special recognition for community contributions",
    image: "/demo/images/mod_badge.png",
    utility: "Moderation powers + special privileges",
    mintedAt: "2025-12-28T10:00:00Z",
  },
  {
    tokenId: "token_annual_pass_2026",
    owner: ADDRESSES.userLucy,
    name: "Annual Pass 2026",
    description: "Full year access to all platform features",
    image: "/demo/images/annual_pass.png",
    utility: "Unlimited access for 2026",
    mintedAt: "2026-01-01T00:00:00Z",
  },
  {
    tokenId: "token_dao_vote_002",
    owner: ADDRESSES.userLucy,
    name: "DAO Governance Token",
    description: "Additional voting power in BCH Paywall DAO",
    image: "/demo/images/dao_token.png",
    utility: "2 votes per proposal",
    mintedAt: "2026-01-02T14:00:00Z",
  },
  {
    tokenId: "token_content_creator_001",
    owner: ADDRESSES.creatorAlice,
    name: "Verified Creator Badge",
    description: "Official verification for content creators",
    image: "/demo/images/creator_badge.png",
    utility: "Creator privileges and verification status",
    mintedAt: "2025-12-15T09:00:00Z",
  },
  {
    tokenId: "token_tip_champion_001",
    owner: ADDRESSES.userJudge,
    name: "Tip Champion Trophy",
    description: "Awarded to top supporters of creators",
    image: "/demo/images/trophy.png",
    utility: "Recognition + bonus features",
    mintedAt: "2025-12-20T18:00:00Z",
  },
  {
    tokenId: "token_beta_tester_001",
    owner: ADDRESSES.userLucy,
    name: "Beta Tester NFT",
    description: "Exclusive NFT for beta testers",
    image: "/demo/images/beta_badge.png",
    utility: "Beta feature access",
    mintedAt: "2025-11-10T11:00:00Z",
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

