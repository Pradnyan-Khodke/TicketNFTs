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
  - generate category metadata commands for local or Sepolia use
  - mark categories as transferable or soul-bound

## Env Files

- `frontend/.env.local`
  - localhost contract address and chain ID
- `frontend/.env.sepolia.local`
  - Sepolia contract address and chain ID

These files are written by the root deploy script.

## Metadata Handling

- the frontend reads `tokenURI` and category metadata URIs
- `ipfs://...` URIs are resolved through an HTTP gateway
- fallback UI is shown if metadata or images cannot be loaded
- transferability is shown in both category and owned-ticket views

## Run Locally

From the repo root:

```bash
npm install
cd frontend
npm install
cd ..
npm run node
npm run deploy:local
cd frontend
npm run dev
```

## Run Against Sepolia

From the repo root:

```bash
npm run deploy:sepolia
cd frontend
npm run dev:sepolia
```

Use MetaMask on the matching network before connecting.

## Limitations

- metadata/category creation is still script-driven
- metadata is category-level, not per-ticket
- transferability is category-level, not per-ticket
- IPFS display depends on gateway availability
