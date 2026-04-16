# TicketNFTs

TicketNFTs is a CS 521 course project exploring ERC-721 ticket NFTs and programmable digital ownership. The current repo demonstrates a simple ticket lifecycle on Ethereum-style infrastructure: mint a ticket, inspect its metadata, transfer it before use, redeem it once, and prevent transfers after redemption.

## Project Overview

This project treats a ticket as more than a collectible NFT. The goal is to explore which ticketing rules can be enforced directly by a smart contract, and where a real-world system would still need off-chain coordination.

The current codebase is a working local demo, not a full ticketing platform. It focuses on one contract, one deployment script, and one small frontend that proves the contract behavior end to end.

## Current Architecture

- `contracts/TicketNFT.sol`
  - ERC-721 ticket contract built with OpenZeppelin
  - stores token URI, `eventId`, and `ticketType`
  - owner-only minting
  - one-time redemption by the current owner
  - transfers blocked after redemption
- `scripts/deploy.ts`
  - deploys the contract
  - writes the contract address and chain ID into `frontend/.env.local`
- `frontend/`
  - React + TypeScript + Vite demo app
  - uses MetaMask and `ethers` to mint, inspect, redeem, and transfer tickets
- `test/TicketNFT.test.ts`
  - Hardhat test suite for the current contract behavior
- `docs/design.md`
  - concise project/design snapshot

## Repository Structure

- `contracts/` Solidity smart contracts
- `scripts/` deployment helpers
- `test/` contract tests
- `frontend/` demo UI
- `docs/` design notes

## Current Feature List

- ERC-721 ticket minting
- on-chain storage of ticket URI, event ID, and ticket type
- owner lookup and ticket info retrieval
- one-time ticket redemption
- transfers before redemption
- transfer rejection after redemption
- local frontend demo for wallet-based interaction

## Local Setup

Install dependencies:

```bash
npm install
cd frontend
npm install
```

## Local Run Flow

1. Start a local Hardhat node from the repo root:

```bash
npx hardhat node
```

2. In a second terminal, deploy the contract:

```bash
npm run deploy:local
```

This writes `frontend/.env.local` with the deployed contract address and chain ID.

3. In a third terminal, start the frontend:

```bash
cd frontend
npm run dev
```

4. In MetaMask:

- add/connect the local Hardhat network
- import one of the funded local accounts shown by `npx hardhat node`
- use the deployer account when you want to mint

## Testing

Run the contract test suite from the repo root:

```bash
npm test
```

## Demo Flow

1. Connect the deployer wallet in the frontend.
2. Mint a ticket to yourself or another local address.
3. Inspect the ticket data and ownership.
4. Transfer the ticket before redemption if you want to test ownership change.
5. Redeem the ticket as the current owner.
6. Confirm that later transfers fail.

## Known Limitations

- The repo currently has one contract, not a full marketplace system.
- Minting is centralized to the contract owner.
- Ticket metadata is stored as a URI plus a few simple fields; there is no metadata upload pipeline in the repo.
- The frontend is a local demo/control panel, not a production-ready ticket marketplace.
- The main documented workflow is local development; Sepolia configuration exists but is not the primary demo path.

## Next Steps

Clearly labeled future work:

- explore resale or marketplace logic if it is still in scope for the project
- improve metadata handling and presentation
- expand the frontend beyond the current operator-style demo
- add broader integration coverage as the project grows
