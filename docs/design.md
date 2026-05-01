# TicketNFTs Design Notes

## Thesis

Treat a ticket as programmable ownership. Ownership, redemption, and transfer rules live on-chain. Metadata and images stay off-chain.

## Final Design

- one ERC-721 contract
- one frontend
- one small backend for metadata uploads
- one deploy script
- one metadata/IPFS script

## Contract Model

The contract stores:

- events
- categories per event
- category price
- category max supply
- category minted count
- category transferability
- ticket `eventId`
- ticket `categoryId`
- ticket `ticketType`
- redemption state

Main flows:

- organizer/admin creates an event
- organizer/admin defines one or more ticket categories
- buyer purchases from a category with remaining supply
- purchase mints the NFT directly to the buyer
- owner can redeem once
- redeemed tickets cannot be transferred
- soul-bound categories cannot be transferred at all

## Metadata Model

Metadata is category-level:

- each category stores one `metadataURI`
- tickets in the same category share the same metadata file

On-chain:

- ownership
- event/category references
- redemption state
- transfer restrictions
- category `metadataURI`
- category transferability

Off-chain on IPFS:

- name
- description
- image
- display-friendly event/category fields

This keeps ticket rules on-chain while moving metadata upload behind a small local service.

## Frontend Model

The frontend provides:

- Events view for browsing events and categories
- purchase flow
- My Tickets view for owned-ticket inspection, redemption, and transfer
- Organizer view for event creation and category setup

Category creation is a two-step flow:

- the frontend calls the backend to generate a placeholder image and upload metadata to Pinata
- the organizer wallet sends `createCategory(...)` with the returned `metadataURI`

## Deployment Model

Supported targets:

- localhost
- Sepolia

Deployment writes frontend env files automatically:

- `frontend/.env.local` for localhost
- `frontend/.env.sepolia.local` for Sepolia

## Tradeoffs

Chosen:

- one contract instead of multiple contracts
- category-level metadata instead of per-ticket metadata
- category-level transferability instead of per-ticket transfer policies
- a small metadata backend instead of putting Pinata credentials in the frontend
- minimal event discovery without extra indexing

Not implemented:

- resale or marketplace logic
- royalty logic
- public indexing layer
