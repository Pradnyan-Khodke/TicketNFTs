# TicketNFTs

TicketNFTs is a course project for CS 521 focused on NFT-based digital ownership standards.

## Project Overview

We are building an ERC-721 ticketing dApp on an Ethereum testnet where users can mint, hold, resell, and redeem tickets for live events such as concerts or sports games.

Rather than treating NFTs only as collectibles, this project explores them as programmable ownership records. Our main focus is on ticket-specific rules such as one-time redemption, resale restrictions, and how much of that logic can actually be enforced on-chain.

## MVP

The initial minimum viable product is:

- mint an ERC-721 ticket
- view owned tickets in a frontend
- redeem a ticket exactly once

## Planned Extensions

- ticket-specific resale constraints
- simple marketplace flow
- ticket classes / seating tiers
- exploration of royalty logic in secondary sales

## Tech Stack

- Solidity
- Hardhat
- OpenZeppelin
- ethers.js
- Next.js
- MetaMask
- Sepolia testnet
- IPFS (planned for metadata)

## Repository Structure

- `contracts/` — Solidity smart contracts
- `test/` — smart contract tests
- `scripts/` — deployment and utility scripts
- `frontend/` — web app for wallet interaction and ticket display
- `docs/` — design notes and project planning