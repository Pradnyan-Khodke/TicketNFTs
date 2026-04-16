# TicketNFTs Design Notes

## Project Goal

TicketNFTs is a CS 521 project about ERC-721 ticket NFTs and programmable digital ownership. The core question is how much ticket behavior can be enforced directly on-chain instead of being handled only by a centralized ticketing platform.

## Current Design Snapshot

The current repository centers on a single ERC-721 contract and a small frontend demo that exercises the contract locally.

### On-chain model

- each ticket is an ERC-721 token
- each token stores:
  - a metadata URI
  - an `eventId`
  - a `ticketType`
- only the contract owner can mint tickets
- the current ticket owner can redeem a ticket exactly once
- redeemed tickets become non-transferable

This gives the project a concrete ownership lifecycle:

1. mint a ticket
2. transfer it if needed
3. redeem it once
4. block any later transfer

## Current Architecture

### Smart contract layer

- [`contracts/TicketNFT.sol`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/contracts/TicketNFT.sol) implements the token, redemption state, and transfer restriction.
- OpenZeppelin `ERC721` and `Ownable` provide the base token and admin model.

### Deployment layer

- [`scripts/deploy.ts`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/scripts/deploy.ts) deploys the contract and writes the contract address plus chain ID into `frontend/.env.local`.

### Frontend layer

- The React/Vite app in [`frontend/`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/frontend) connects through MetaMask and demonstrates the contract flow end to end.
- The current UI is intentionally simple and aimed at development/demo use, not production ticket sales.

### Test layer

- [`test/TicketNFT.test.ts`](/Users/pradnyankhodke/School/CS/CS521/TicketNFTs/test/TicketNFT.test.ts) covers minting, metadata storage, redemption, ownership checks, transfers before redemption, and transfer rejection after redemption.

## What The Current Repo Demonstrates

- NFT tickets can carry ticket-specific metadata on-chain.
- Redemption can be enforced as a one-time state transition.
- Ownership and redemption state can affect transferability.
- A lightweight frontend can drive the full local demo flow without a separate backend.

## What Is Not Implemented Yet

The current repo does not yet include:

- a marketplace contract
- resale pricing or resale-rule logic beyond "cannot transfer after redemption"
- event creation/management workflows
- batch minting
- seat maps or structured venue data
- an IPFS upload pipeline or hosted metadata service
- frontend support for browsing many tickets/events

## Future Work

If the project continues past the current milestone, likely next steps are:

- refine ticket transfer/resale policy
- decide whether a separate marketplace contract is worth the added complexity
- improve metadata handling and presentation
- expand the frontend from a control panel into a clearer user demo
