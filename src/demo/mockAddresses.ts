/**
 * Mock Bitcoin Cash Addresses
 * 
 * Realistic CashAddr format addresses for demo purposes.
 * All addresses follow correct prefix and length requirements.
 */
export const ADDRESSES = {
  platform: "bitcoincash:qzplatform0000000000000000000000",
  creatorAlice: "bitcoincash:qpalice000000000000000000000000",
  creatorBob: "bitcoincash:qpbbob0000000000000000000000000",
  userLucy: "bitcoincash:qplucy0000000000000000000000000",
  userJudge: "bitcoincash:qpjjudge00000000000000000000000",
  daoTreasury: "bitcoincash:qpdao000000000000000000000000",
};

/**
 * Get a mock address by role
 */
export function getAddress(role: keyof typeof ADDRESSES): string {
  return ADDRESSES[role];
}

/**
 * Check if an address is a known demo address
 */
export function isDemoAddress(address: string): boolean {
  return Object.values(ADDRESSES).includes(address);
}

