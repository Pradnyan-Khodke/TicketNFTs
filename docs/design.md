# TicketNFTs Design Notes

## Project Goal

Build an ERC-721 ticketing dApp that demonstrates how NFT ownership can be extended with ticket-specific rules such as one-time redemption and resale constraints.

## Main Question

How much of ticket ownership logic can actually be enforced on-chain through a smart contract?

## MVP

- ERC-721 ticket contract
- minting
- ownership lookup
- one-time redemption
- basic frontend for wallet connection and interaction

## Planned Extensions

- resale limits
- simple marketplace contract
- ticket classes / seating tiers
- royalty logic exploration

## High-Level Architecture

1. Smart contract layer
   - ERC-721 contract for tickets
   - tracks ownership and redemption state

2. Frontend layer
   - wallet connection
   - mint / view / redeem actions

3. Metadata layer
   - NFT metadata and images
   - possible IPFS integration

## Team Split

- Smart contracts, tests, deployment
- Frontend, wallet integration, metadata
- Shared: architecture, demo, writeup