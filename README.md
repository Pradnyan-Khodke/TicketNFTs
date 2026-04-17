# TicketNFTs

TicketNFTs is an ERC-721 ticketing project focused on programmable ownership. The contract issues tickets as NFTs, tracks event/category inventory, supports direct purchase and redemption, and blocks transfers after redemption. The frontend turns that flow into a small ticketing app for local and Sepolia demos.

## Project Overview

Main idea:

- represent tickets as ERC-721 NFTs
- keep ticket inventory on-chain by event and category
- let users purchase tickets directly from available supply
- use on-chain redemption state to enforce post-entry rules
- keep metadata off-chain on IPFS without adding a backend

## Feature Summary

Implemented:

- organizer/admin event creation
- per-event ticket categories with price, max supply, minted count, and remaining inventory
- purchase flow that mints ERC-721 tickets automatically
- ticket ownership, transfer, and redemption lifecycle
- redeemed tickets cannot be transferred
- category-level NFT metadata stored as `ipfs://...` URIs
- React frontend for browsing events, purchasing, viewing owned tickets, redeeming, and transferring
- local deployment flow
- Sepolia deployment flow

## Architecture Summary

- [`contracts/TicketNFT.sol`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/contracts/TicketNFT.sol)
  - single ERC-721 contract
  - stores events, categories, inventory, ticket references, and redemption state
- [`frontend/`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/frontend)
  - React + Vite frontend
  - connects through MetaMask
  - resolves IPFS metadata through an HTTP gateway
- [`scripts/deploy.ts`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/scripts/deploy.ts)
  - deploys to localhost or Sepolia
  - writes the matching frontend env file
- [`scripts/createCategoryWithMetadata.ts`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/scripts/createCategoryWithMetadata.ts)
  - generates metadata and optional image assets
  - uploads to IPFS through Pinata
  - creates the category on-chain
- [`test/TicketNFT.test.ts`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/test/TicketNFT.test.ts)
  - contract-level test suite

## Metadata / IPFS Summary

Metadata is category-level:

- each category stores one `metadataURI` on-chain
- all tickets in that category share the same metadata file
- on-chain data covers ownership, event/category references, redemption state, and transfer rules
- off-chain IPFS data covers display metadata such as name, description, and image

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

## Local Demo Flow

1. Start the local node:

```bash
npm run node
```

2. Deploy locally:

```bash
npm run deploy:local
```

This writes [frontend/.env.local](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/frontend/.env.local:1).

3. Start the frontend:

```bash
cd frontend
npm run dev
```

4. In MetaMask:

- switch to the local Hardhat network
- import a funded local account if needed
- use the deployer/organizer account for event setup

5. Demo flow:

- create an event in the Organizer view
- generate a category command in the Organizer view
- run the metadata script
- purchase a ticket in Events
- inspect and redeem the ticket in My Tickets

Local metadata commands:

```bash
npm run metadata:category:dry-run -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100
npm run metadata:category -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 --upload-image
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

This writes [frontend/.env.sepolia.local](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/frontend/.env.sepolia.local:1).

Start the frontend against Sepolia:

```bash
cd frontend
npm run dev:sepolia
```

Optional Sepolia metadata commands:

```bash
npm run metadata:category:sepolia:dry-run -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100
npm run metadata:category:sepolia -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 --upload-image
```

MetaMask notes:

- switch MetaMask to Sepolia before connecting
- the deployer/organizer wallet needs Sepolia ETH
- localhost and Sepolia use different frontend env files

## Current Limitations

- one contract only; no resale or marketplace layer
- metadata is category-level rather than per-ticket
- metadata/category creation is script-driven
- frontend display depends on IPFS gateway availability
- event discovery is intentionally minimal and on-chain only

## Future Work

- per-ticket metadata if a stronger uniqueness model is needed
- resale/transfer policy extensions
- richer event fields such as time, venue, or organizer metadata
- verification or indexer support for public deployments

## Repo Notes

Recommended cleanup:

- remove `frontend/.env.undefined.local` if it still exists from the earlier deploy-script bug
- keep `.env`, `frontend/.env.local`, and `frontend/.env.sepolia.local` out of version control
