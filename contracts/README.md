# Contracts

This directory contains the Solidity smart contracts for TicketNFTs.

## What Exists Today

- `TicketNFT.sol` is the only contract currently in the repo.
- It implements an ERC-721 ticket token using OpenZeppelin.
- Each minted ticket stores:
  - a token URI
  - an `eventId`
  - a `ticketType`
- The contract owner is the only account allowed to mint.
- The current token owner can redeem a ticket once.
- A redeemed ticket cannot be transferred afterward.

## Development Notes

- The constructor takes an `initialOwner` address for the contract owner.
- Token IDs are assigned sequentially starting from `0`.
- Redemption status is tracked on-chain per token.

## Basic Usage

Compile and test from the repo root:

```bash
npm install
npm test
```

To deploy locally:

```bash
npx hardhat node
npm run deploy:local
```

## Future Work

Possible future additions, not currently implemented:

- separate marketplace/resale contracts
- richer ticket metadata structures
- batch minting or organizer-specific permissions
