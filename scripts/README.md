# Scripts

Deployment and metadata utilities live here.

## Current Scripts

- `deploy.ts`
  - deploys `TicketNFT`
  - writes `frontend/.env.local` for localhost
  - writes `frontend/.env.sepolia.local` for Sepolia
- `createCategoryWithMetadata.ts`
  - generates metadata JSON
  - generates or uploads an image
  - uploads metadata to IPFS through Pinata
  - creates the category on-chain

## Env

Root `.env`:

```bash
SEPOLIA_RPC_URL=your_sepolia_rpc_url
SEPOLIA_PRIVATE_KEY=your_deployer_private_key
PINATA_JWT=your_pinata_jwt_here
```

Frontend env files are written automatically by `deploy.ts`.

## Local Commands

Start local node:

```bash
npm run node
```

Deploy locally:

```bash
npm run deploy:local
```

Create local category metadata:

```bash
npm run metadata:category:dry-run -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100
npm run metadata:category -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 --upload-image
```

## Sepolia Commands

Deploy to Sepolia:

```bash
npm run deploy:sepolia
```

Create Sepolia category metadata:

```bash
npm run metadata:category:sepolia:dry-run -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100
npm run metadata:category:sepolia -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 --upload-image
```

## Metadata Notes

- metadata is category-level
- the contract stores one `metadataURI` per category
- tickets in the same category share the same metadata file
- the Organizer view generates the correct metadata command, but does not upload directly
