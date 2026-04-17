# TicketNFTs Design Notes

## Thesis

Treat a ticket as programmable digital ownership rather than a static pass. Ownership, purchase eligibility, redemption state, and transfer restrictions live on-chain. Display metadata and images stay off-chain.

## Final Design

- one ERC-721 contract
- one frontend
- one deploy script
- one metadata/IPFS script
- no backend

## Contract Model

The contract stores:

- events
- categories per event
- category price
- category max supply
- category minted count
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

Off-chain on IPFS:

- name
- description
- image
- display-friendly event/category fields

This keeps the project explainable and avoids a backend.

## Frontend Model

The frontend provides:

- Events view for browsing events and categories
- purchase flow
- My Tickets view for owned-ticket inspection, redemption, and transfer
- Organizer view for event creation and category command generation

Category creation is script-driven. The frontend generates the correct metadata command instead of uploading directly.

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
- script-based IPFS uploads instead of a backend uploader
- minimal event discovery without extra indexing

Not implemented:

- resale or marketplace logic
- royalty logic
- backend services
- public indexing layer
