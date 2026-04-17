# Frontend

React + TypeScript + Vite frontend for browsing events, purchasing tickets, managing owned tickets, and generating category setup commands.

## What It Does

- `Events` view
  - lists on-chain events
  - shows ticket categories, prices, and remaining inventory
  - shows category metadata preview images when available
- `My Tickets` view
  - shows tickets owned by the connected wallet
  - resolves `ipfs://...` token metadata through an HTTP gateway
  - displays metadata name, description, image, and resolved metadata URL
  - supports redemption and transfer
- `Organizer` view
  - creates events
  - lets organizers define category inputs and generate the correct metadata script command

## Env

Uses its own env file:

- `frontend/.env.local`
  - `VITE_TICKET_NFT_ADDRESS`
  - `VITE_TICKET_NFT_CHAIN_ID`

Written by the root deployment script. Separate from the root `.env` used for Pinata.

## Metadata

Uses the current category-level metadata design:

- each category stores one `metadataURI` on-chain
- all tickets purchased from that category share that metadata file
- metadata and image assets are fetched off-chain from IPFS through a gateway

If metadata cannot be fetched, the UI shows a fallback state.

## Local Run Instructions

From the repo root:

```bash
npm install
cd frontend
npm install
```

Start the local chain from the repo root:

```bash
npm run node
```

Deploy the contract in a second terminal:

```bash
npm run deploy:local
```

Then start the frontend:

```bash
cd frontend
npm run dev
```

## Demo Flow

1. Connect MetaMask to the local Hardhat network.
2. Use an organizer/admin wallet to create an event.
3. In the Organizer view, fill in the category fields and copy the generated metadata script command.
4. Run the root metadata script to upload metadata/create the category on-chain.
5. Purchase a ticket from the `Events` view.
6. Open `My Tickets` to inspect metadata, image, token URI, redemption status, and transfer options.

## Limitations

- Metadata upload is still script-driven.
- Metadata is category-level rather than unique per ticket.
- The app resolves `ipfs://...` URIs through a gateway, so metadata/image display depends on gateway availability.
