# TicketNFTs

ERC-721 ticketing app with event inventory, purchases, IPFS-backed metadata, redemption, and transfer restrictions after redemption.

## Overview

Architecture:

- one contract
- one React frontend
- one deployment script
- one metadata/IPFS script
- no backend

## Architecture

- `contracts/TicketNFT.sol`
  - ERC-721 ticket contract
  - event and category inventory
  - purchases mint tickets automatically
  - one-time redemption
  - transfers blocked after redemption
  - one category-level `metadataURI` stored on-chain per category
- `scripts/deploy.ts`
  - deploys the contract locally
  - writes contract address and chain ID into `frontend/.env.local`
- `scripts/createCategoryWithMetadata.ts`
  - generates category metadata
  - optionally generates/uploads a ticket image
  - uploads metadata to IPFS
  - creates the category on-chain with the resulting `ipfs://...` URI
- `frontend/`
  - React + TypeScript + Vite app
  - event browsing, purchasing, owned-ticket views, organizer tools
  - organizer command builder for metadata/category creation
  - resolves `ipfs://...` metadata and image assets through an HTTP gateway
- `test/TicketNFT.test.ts`
  - Hardhat tests for event creation, category setup, purchase flow, and ticket lifecycle rules

## On-Chain vs Off-Chain Data

### On-chain

- event records
- category inventory
- price
- max supply
- minted count
- ownership
- `eventId`
- `categoryId`
- `ticketType`
- redemption state
- transfer restrictions after redemption
- category-level `metadataURI`

### Off-chain on IPFS

- NFT display name
- description
- image asset or placeholder SVG
- descriptive event/category fields for display

## Category-Level Metadata

Metadata is category-level, not per-ticket:

- each category stores one `metadataURI` on-chain
- all tickets purchased from that category share the same metadata JSON
- this is intentional
- it fits the current mint/purchase flow
- it avoids a backend

## Local Env Setup

Two local env files are used:

### Root `.env`

Used for local script/backend-style secrets such as Pinata:

```bash
PINATA_JWT=your_pinata_jwt_here
```

This file is gitignored and loaded through `dotenv/config` in:

- `hardhat.config.ts`
- `scripts/createCategoryWithMetadata.ts`

### `frontend/.env.local`

Used only by the frontend for public connection values:

- `VITE_TICKET_NFT_ADDRESS`
- `VITE_TICKET_NFT_CHAIN_ID`

This file is written automatically by the deploy script.

## Package Scripts

Root scripts:

- `npm run node`
  - starts the local Hardhat node
- `npm run deploy:local`
  - deploys the contract to localhost
- `npm run metadata:category`
  - runs the standalone metadata/category script against localhost
- `npm run metadata:category:dry-run`
  - runs the metadata/category script in dry-run mode
- `npm test`
  - runs the contract test suite

## Why The Metadata Script Uses `HARDHAT_NETWORK=localhost node ...`

Use the metadata script as a standalone Node script with Hardhat environment access:

```bash
HARDHAT_NETWORK=localhost node scripts/createCategoryWithMetadata.ts --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100
```

The package scripts wrap that pattern.

## Local Run Flow

1. Install dependencies:

```bash
npm install
cd frontend
npm install
cd ..
```

2. Start the local chain:

```bash
npm run node
```

3. Deploy the contract in another terminal:

```bash
npm run deploy:local
```

4. Create categories with the metadata script:

Dry run:

```bash
npm run metadata:category:dry-run -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100
```

Live localhost run:

```bash
npm run metadata:category -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 --upload-image
```

5. Start the frontend:

```bash
cd frontend
npm run dev
```

## Demo Flow

1. Connect MetaMask to the local Hardhat network.
2. Use an organizer/admin wallet to create an event.
3. Open the Organizer view, fill in the ticket category fields, and use the generated metadata script command.
4. Run the metadata/IPFS script to upload assets and create the category on-chain.
5. Purchase a ticket from the `Events` view.
6. Open `My Tickets` to inspect metadata name, description, image, and token URI.
7. Redeem the ticket and confirm it cannot be transferred afterward.

## Known Limitations

- One contract only. No marketplace or resale system.
- Metadata is category-level rather than unique per issued ticket.
- IPFS display depends on HTTP gateway access.
- Category creation is script-driven. The Organizer view generates commands but does not upload directly.
- Local-first workflow.
