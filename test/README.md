# Tests

This directory contains Hardhat tests for the TicketNFTs smart contracts.

## What Exists Today

- `TicketNFT.test.ts` is the current contract test suite.
- The tests cover:
  - owner-only minting
  - token URI storage
  - ticket metadata storage (`eventId`, `ticketType`)
  - one-time redemption
  - ownership checks for redemption
  - transfers before redemption
  - redemption after transfer by the new owner
  - transfer rejection after redemption
  - error handling for nonexistent token lookups

## Running The Tests

From the repo root:

```bash
npm install
npm test
```

## Current Scope

These are contract-level tests. The repo does not currently include:

- frontend UI tests
- end-to-end browser tests
- marketplace/resale contract tests

## Future Work

Likely next test additions if the project expands:

- deployment script checks
- frontend integration coverage
- tests for any future resale or marketplace logic
