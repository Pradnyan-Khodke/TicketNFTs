# TicketNFTs Design Notes

## Goal

Decide which parts of ticket ownership belong on-chain and which can stay off-chain.

## Snapshot

Main pieces:

- a single ERC-721 ticket contract
- event/category inventory on-chain
- a local-first frontend for event browsing and ticket management
- a lightweight script-based IPFS metadata workflow

## On-Chain Model

Stored and enforced on-chain:

- event records
- ticket categories per event
- category price, max supply, and minted count
- ticket ownership
- ticket `eventId` and `ticketType`
- redemption state
- non-transferability after redemption
- one category-level `metadataURI` per ticket category

## Off-Chain Metadata

Metadata is category-level, not per-ticket:

- each category stores one metadata URI on-chain
- all tickets purchased from that category share the same metadata JSON
- metadata JSON can include:
  - human-readable name
  - description
  - ticket image or placeholder SVG
  - descriptive event/category fields

This keeps the contract simple and avoids a backend.

## Architecture

### Contract layer

- [`contracts/TicketNFT.sol`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/contracts/TicketNFT.sol) handles events, ticket categories, purchases, ownership, redemption, and transfer restrictions.

### Script layer

- [`scripts/deploy.ts`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/scripts/deploy.ts) deploys the contract and writes frontend connection values into `frontend/.env.local`.
- [`scripts/createCategoryWithMetadata.ts`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/scripts/createCategoryWithMetadata.ts) generates category metadata, optionally generates/uploads an image, uploads metadata to IPFS, and creates the category on-chain with the resulting `ipfs://...` URI.

### Frontend layer

- [`frontend/`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/frontend) supports:
  - event browsing
  - purchasing
  - owned-ticket views
  - metadata/image display from IPFS
  - organizer/admin event setup
  - command generation for metadata-backed category creation

## Env

- root `.env`
  - local secrets such as `PINATA_JWT`
  - loaded through `dotenv/config` in Hardhat config and the metadata script
- `frontend/.env.local`
  - public frontend connection values such as deployed contract address and chain ID

## Metadata Script Invocation

Use a standalone Node script with Hardhat runtime access instead of forwarding args through `hardhat run`.

## Remaining Limitations

- metadata is still shared across a category rather than unique per issued ticket
- there is no separate indexing/backend layer
- the frontend depends on HTTP gateway access to display IPFS-hosted metadata and images
- organizer metadata/category creation is script-driven; the UI helps generate the command but does not upload directly
