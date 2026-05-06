# TicketNFTs

ERC-721 ticketing app with on-chain inventory, purchase, redemption, and transfer rules.

## Overview

- represent tickets as ERC-721 NFTs
- keep ticket inventory on-chain by event and category
- let users purchase tickets directly from available supply
- use on-chain redemption state to enforce post-entry rules
- keep ticket rules on-chain while using IPFS for metadata and images

## Feature Summary

Implemented:

- organizer/admin event creation
- per-event ticket categories with price, max supply, minted count, and remaining inventory
- per-category transferability rules
- purchase flow that mints ERC-721 tickets automatically
- direct organizer payout on purchase
- ticket ownership, transfer, and redemption lifecycle
- redeemed tickets cannot be transferred
- soul-bound categories that cannot be transferred after minting
- category-level NFT metadata stored as `ipfs://...` URIs
- React frontend for browsing events, purchasing, viewing owned tickets, redeeming, and transferring
- notice banner links to recent confirmed transaction hashes
- local deployment flow
- Sepolia deployment flow

## Architecture Summary

- [`contracts/TicketNFT.sol`](contracts/TicketNFT.sol)
  - single ERC-721 contract
  - stores events, categories, inventory, transferability, ticket references, and redemption state
- [`frontend/`](frontend/)
  - React + Vite frontend
  - connects through MetaMask
  - resolves IPFS metadata through an HTTP gateway
- [`backend/`](backend/)
  - small Express service for metadata upload
  - returns the `ipfs://...` URI used by category creation
- [`scripts/deploy.ts`](scripts/deploy.ts)
  - deploys to localhost or Sepolia
  - writes the matching frontend env file
- [`scripts/createCategoryWithMetadata.ts`](scripts/createCategoryWithMetadata.ts)
  - fallback/manual metadata utility
- [`test/TicketNFT.test.ts`](test/TicketNFT.test.ts)
  - contract-level test suite

## Metadata / IPFS Summary

Metadata is category-level:

- each category stores one `metadataURI` on-chain
- all tickets in that category share the same metadata file
- on-chain data covers ownership, event/category references, redemption state, transfer rules, and organizer-directed payment settlement
- off-chain IPFS data covers display metadata such as name, description, and image
- the backend uploads metadata
- the organizer wallet still signs `createCategory(...)`
- confirmed Sepolia actions show a transaction hash in the notice banner

This keeps the contract and frontend simple while still producing realistic NFT metadata.

## Local Setup

Install dependencies:

```bash
npm install
cd frontend
npm install
cd ..
```

Root `.env` is optional for localhost unless you want IPFS uploads:

```bash
PINATA_JWT=your_pinata_jwt_here
```

The backend reads the root `.env`. The frontend still reads `frontend/.env.local` or `frontend/.env.sepolia.local`.

## Local Demo Flow

1. Start the local node:

```bash
npm run node
```

2. Deploy locally:

```bash
npm run deploy:local
```

This writes `frontend/.env.local`.

3. Start the metadata backend:

```bash
npm run backend
```

4. Start the frontend:

```bash
cd frontend
npm run dev
```

5. In MetaMask:

- switch to the local Hardhat network
- import a funded local account if needed
- use the deployer/organizer account for event setup

6. Demo flow:

- create an event in the Organizer view
- create a category in the Organizer view
- purchase a ticket in Events
- inspect, transfer, or redeem the ticket in My Tickets
- copy confirmed transaction hashes from the notice banner for the final report

Manual metadata commands still exist if you want a script-only flow:

```bash
npm run metadata:category:dry-run -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100
npm run metadata:category -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 --upload-image
npm run metadata:category -- --event-id 0 --ticket-type ENTRY --price-eth 0.01 --max-supply 100 --upload-image --soulbound
```

## Sepolia Setup / Deploy Flow

Set root `.env`:

```bash
SEPOLIA_RPC_URL=your_sepolia_rpc_url
SEPOLIA_PRIVATE_KEY=your_deployer_private_key
PINATA_JWT=your_pinata_jwt_here
```

Deploy to Sepolia:

```bash
npm run deploy:sepolia
```

This writes `frontend/.env.sepolia.local`.

Start the metadata backend:

```bash
npm run backend
```

Start the frontend against Sepolia:

```bash
cd frontend
npm run dev:sepolia
```

Manual Sepolia metadata commands still exist if you want a script-only flow:

```bash
npm run metadata:category:sepolia:dry-run -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100
npm run metadata:category:sepolia -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 --upload-image
npm run metadata:category:sepolia -- --event-id 0 --ticket-type ENTRY --price-eth 0.01 --max-supply 100 --upload-image --soulbound
```

MetaMask notes:

- switch MetaMask to Sepolia before connecting
- the deployer/organizer wallet needs Sepolia ETH
- localhost and Sepolia use different frontend env files

## Current Limitations

- one contract only; no resale or marketplace layer
- metadata is category-level rather than per-ticket
- metadata upload depends on the local backend being available
- frontend display depends on IPFS gateway availability
- event discovery is intentionally minimal and on-chain only
- transferability is set at the category level, not per individual ticket
- a blocked transfer may not produce a hash if MetaMask or the provider stops it before broadcast

## Future Work

- per-ticket metadata if a stronger uniqueness model is needed
- resale/transfer policy extensions
- richer event fields such as time, venue, or organizer metadata
- verification or indexer support for public deployments

## Repo Notes

- remove `frontend/.env.undefined.local` if it still exists from the earlier deploy-script bug
- keep `.env`, `frontend/.env.local`, and `frontend/.env.sepolia.local` out of version control
