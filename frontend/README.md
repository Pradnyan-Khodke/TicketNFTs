# Frontend

React + TypeScript + Vite app for TicketNFTs.

## What It Does

- `Events`
  - list events and ticket categories
  - show prices, supply, and remaining inventory
  - show whether a category is transferable or soul-bound
  - purchase tickets
- `My Tickets`
  - show tickets owned by the connected wallet
  - load metadata and images from IPFS
  - redeem tickets
  - transfer tickets when allowed
  - disable transfer actions for soul-bound tickets
- `Organizer`
  - create events
  - create categories through the metadata backend
  - mark categories as transferable or soul-bound

## Env Files

- `frontend/.env.local`
  - localhost contract address and chain ID
- `frontend/.env.sepolia.local`
  - Sepolia contract address and chain ID

These files are written by the root deploy script.

Optional:

- `VITE_METADATA_API_URL`
  - defaults to `http://127.0.0.1:3001`
  - points the frontend to the local metadata backend

## Metadata Handling

- the frontend reads `tokenURI` and category metadata URIs
- `ipfs://...` URIs are resolved through an HTTP gateway
- fallback UI is shown if metadata or images cannot be loaded
- transferability is shown in both category and owned-ticket views
- organizer category creation uploads metadata through the backend, then sends `createCategory(...)` through MetaMask
- successful on-chain actions surface the transaction hash in the notice banner
- failed transfers only show a hash if the transaction is actually broadcast

## Run Locally

From the repo root:

```bash
npm install
cd frontend
npm install
cd ..
npm run node
npm run deploy:local
npm run backend
cd frontend
npm run dev
```

This matches the root README. The only frontend-specific piece is `VITE_METADATA_API_URL` if you want to point at a different backend URL.

## Run Against Sepolia

From the repo root:

```bash
npm run deploy:sepolia
npm run backend
cd frontend
npm run dev:sepolia
```

Use MetaMask on the matching network before connecting.

## Limitations

- organizer category creation depends on the backend being available
- metadata is category-level, not per-ticket
- transferability is category-level, not per-ticket
- IPFS display depends on gateway availability
