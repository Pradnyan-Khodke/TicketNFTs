# Tests

Hardhat contract tests.

## Current Coverage

- event creation
- organizer permissions
- category creation and validation
- purchase success and failure cases
- organizer payout on purchase
- inventory tracking
- ticket ownership after purchase
- redemption rules
- transfer before redemption
- soul-bound transfer rejection
- transfer blocked after redemption
- legacy owner-only mint restriction
- error handling for nonexistent tokens

Main suite:

- `TicketNFT.test.ts`

## Run

From the repo root:

```bash
npm test
```

## Not Covered

- frontend UI tests
- browser end-to-end tests
- deployment script tests
- whether a blocked transfer attempt gets broadcast and produces a public transaction hash
