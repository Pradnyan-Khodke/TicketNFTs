# Contracts

This directory contains the Solidity contract for the project.

## Current Contract

- `TicketNFT.sol`
  - ERC-721 ticket contract
  - organizer/admin event creation
  - ticket categories with price and supply
  - purchase flow that mints tickets automatically
  - one-time redemption
  - transfers blocked after redemption

## Stored Data

Per event:

- name
- organizer
- active/inactive status
- category count

Per category:

- ticket type
- metadata URI
- price
- max supply
- minted count

Per ticket:

- `eventId`
- `categoryId`
- `ticketType`
- redemption state

## Notes

- one contract handles the full ticket flow
- metadata is category-level
- a legacy owner-only `mintTicket(...)` helper still exists, but the main flow is purchase-based

## Usage

Compile and test from the repo root:

```bash
npm install
npm test
```

Deploy locally:

```bash
npm run node
npm run deploy:local
```

Deploy to Sepolia:

```bash
npm run deploy:sepolia
```
