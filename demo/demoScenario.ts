/**
 * Demo Scenario Script
 * 
 * Provides a scripted demo flow for judges and presentations.
 * Can be run programmatically or used as a guide.
 */
import { demoWallet, switchDemoWallet } from './mockWallet';
import { ADDRESSES } from './mockAddresses';
import { mockIndexerApi } from './mockIndexerApi';

export async function runDemoScenario() {
  console.log("=== BCH Creator Hub Demo Scenario ===\n");

  // Step 1: User connects wallet
  console.log("Step 1: User connects wallet");
  const connection = await demoWallet.connect();
  console.log(`✓ Connected: ${connection.address}\n`);

  // Step 2: View balance
  console.log("Step 2: View wallet balance");
  const balance = await demoWallet.getBalance(connection.address!);
  console.log(`✓ Balance: ${balance.total} sats\n`);

  // Step 3: Pay for content
  console.log("Step 3: Pay 0.0001 BCH to creator for content unlock");
  const payment = await demoWallet.sendPayment(
    ADDRESSES.creatorAlice,
    10000,
    "content:post_ethereum_vs_bch"
  );
  console.log(`✓ Payment sent: ${payment.txid}\n`);

  // Step 4: Check content access
  console.log("Step 4: Verify content access");
  const hasAccess = await mockIndexerApi.hasPaidForContent(
    connection.address!,
    "post_ethereum_vs_bch"
  );
  console.log(`✓ Content access: ${hasAccess ? 'Granted' : 'Denied'}\n`);

  // Step 5: View NFTs
  console.log("Step 5: View owned NFTs");
  const nfts = await mockIndexerApi.getNFTs(connection.address!);
  console.log(`✓ NFTs owned: ${nfts.length}\n`);

  // Step 6: Vote on DAO proposal
  console.log("Step 6: Vote on DAO proposal");
  const proposals = await mockIndexerApi.getActiveProposals();
  if (proposals.length > 0) {
    console.log(`✓ Voting on: ${proposals[0].title}\n`);
  }

  // Step 7: View creator dashboard
  console.log("Step 7: Switch to creator view");
  switchDemoWallet(ADDRESSES.creatorAlice);
  const creatorPayments = await mockIndexerApi.getPayments(ADDRESSES.creatorAlice);
  console.log(`✓ Creator payments received: ${creatorPayments.length}\n`);

  console.log("=== Demo Scenario Complete ===");
}

/**
 * Run demo scenario with delays for presentation
 */
export async function runDemoScenarioWithDelays() {
  const steps = [
    { message: "User connects wallet", delay: 1000 },
    { message: "Pays 0.0001 BCH to creator", delay: 1500 },
    { message: "Content unlocked", delay: 500 },
    { message: "NFT minted", delay: 1000 },
    { message: "Votes on DAO proposal", delay: 1000 },
  ];

  for (const step of steps) {
    console.log(step.message);
    await new Promise(resolve => setTimeout(resolve, step.delay));
  }
}



