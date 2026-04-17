# Scripts

This directory contains deployment and utility scripts for the TicketNFTs project.

## What Exists Today

- `deploy.ts` deploys the `TicketNFT` contract using the active Hardhat network signer.
- `createCategoryWithMetadata.ts` generates category metadata, optionally generates/uploads a simple ticket image, uploads metadata to IPFS, and creates the category on-chain with the resulting `ipfs://...` token URI.
- After deployment, it writes the following values into `frontend/.env.local`:
  - `VITE_TICKET_NFT_ADDRESS`
  - `VITE_TICKET_NFT_CHAIN_ID`

That file is what allows the frontend to connect to the most recently deployed contract.

## Local Usage

Start a local chain from the repo root:

```bash
npx hardhat node
```

Deploy in another terminal:

```bash
npm run deploy:local
```

Generate metadata locally without uploading:

```bash
npm run metadata:category:dry-run -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100
```

Generate metadata, upload it to IPFS through Pinata, and create the category on-chain:

```bash
npm run metadata:category -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 --upload-image
```

These package scripts currently resolve to the standalone Node workflow:

- `npm run node`
  - `hardhat node`
- `npm run deploy:local`
  - `hardhat run scripts/deploy.ts --network localhost`
- `npm run metadata:category`
  - `HARDHAT_NETWORK=localhost node scripts/createCategoryWithMetadata.ts`
- `npm run metadata:category:dry-run`
  - `HARDHAT_NETWORK=localhost node scripts/createCategoryWithMetadata.ts --dry-run`

Direct invocation also works:

```bash
HARDHAT_NETWORK=localhost node scripts/createCategoryWithMetadata.ts --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 --upload-image
```

Why `HARDHAT_NETWORK=localhost node ...`?

- the metadata flow is now a standalone Node script
- it still uses Hardhat environment access
- this avoids the older `hardhat run ... -- --forwarded-args` pattern
- argument handling is simpler and easier to document

The deploy script prints the deployer address, the deployed contract address, and the path of the generated frontend env file.

The metadata script reads `frontend/.env.local` to find the current local contract unless you pass `--contract`.

The Organizer view generates commands for this script. Category creation is no longer submitted directly from the browser.

## Local Env Setup

Store your Pinata token in a gitignored root `.env` file:

```bash
PINATA_JWT=your_pinata_jwt_here
```

`hardhat.config.ts` and the metadata script now load that local env file through `dotenv`, so you do not need to inline the secret into commands.

This is separate from `frontend/.env.local`, which only stores the frontend-facing contract address and chain ID after deployment.

## Metadata Workflow

This repo keeps metadata lightweight and category-based:

- on-chain:
  - category-level `metadataURI`
  - `eventId`
  - `categoryId`
  - `ticketType`
  - ownership
  - redemption state
  - transfer restrictions after redemption
- off-chain in IPFS metadata:
  - human-readable name and description
  - ticket image or placeholder SVG
  - event/category display fields
  - price and max supply as descriptive metadata

Because the contract stores one `metadataURI` per category, all tickets in that category share the same off-chain metadata file.

## Other Networks

The Hardhat config also includes a `sepolia` network. To use it, you would need to provide:

- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`

Local deployment is the main documented path.

## Future Work

Potential later additions:

- seeding/demo-data scripts
- verification scripts
- helper scripts for repeated frontend demo setup
