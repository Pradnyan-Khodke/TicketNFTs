# Scripts

Deployment and metadata utilities.

## Current Scripts

- `deploy.ts`
  - deploys `TicketNFT`
  - writes `frontend/.env.local` for localhost
  - writes `frontend/.env.sepolia.local` for Sepolia
- `createCategoryWithMetadata.ts`
  - fallback/manual metadata utility
  - generates metadata JSON
  - generates or uploads an image
  - uploads metadata to IPFS through Pinata
  - creates the category on-chain
  - supports transferable and soul-bound categories
- `backend/server.js`
  - local Express service used by the Organizer view
  - backend-specific notes live in `backend/README.md`

## Env

Root `.env`:

```bash
SEPOLIA_RPC_URL=your_sepolia_rpc_url
SEPOLIA_PRIVATE_KEY=your_deployer_private_key
PINATA_JWT=your_pinata_jwt_here
```

Frontend env files are written automatically by `deploy.ts`.

The backend also reads the root `.env`.

## Local Commands

Start local node:

```bash
npm run node
```

Deploy locally:

```bash
npm run deploy:local
```

Start the local metadata backend:

```bash
npm run backend
```

Manual local metadata commands:

```bash
npm run metadata:category:dry-run -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100
npm run metadata:category -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 --upload-image
npm run metadata:category -- --event-id 0 --ticket-type ENTRY --price-eth 0.01 --max-supply 100 --upload-image --soulbound
```

## Sepolia Commands

Deploy to Sepolia:

```bash
npm run deploy:sepolia
```

Start the metadata backend:

```bash
npm run backend
```

Manual Sepolia metadata commands:

```bash
npm run metadata:category:sepolia:dry-run -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100
npm run metadata:category:sepolia -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 --upload-image
npm run metadata:category:sepolia -- --event-id 0 --ticket-type ENTRY --price-eth 0.01 --max-supply 100 --upload-image --soulbound
```

## Metadata Notes

- metadata is category-level
- transferability is category-level
- the contract stores one `metadataURI` per category
- the contract stores one transferability rule per category
- tickets in the same category share the same metadata file
- the Organizer view now uploads metadata through the backend and then sends `createCategory(...)` through MetaMask
- the script remains useful for manual uploads or troubleshooting
