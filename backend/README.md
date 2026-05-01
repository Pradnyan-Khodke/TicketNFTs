# Backend

Small Express service for metadata uploads.

## What It Does

- receives category details from the Organizer view
- reads event info from the deployed contract
- generates a placeholder SVG ticket image
- uploads the image and metadata JSON to Pinata
- returns the resulting `ipfs://...` metadata URI to the frontend

`createCategory(...)` still goes through MetaMask because it is an on-chain organizer action. The backend only handles Pinata upload work.

## Env

Uses the root `.env`:

```bash
PINATA_JWT=your_pinata_jwt_here
SEPOLIA_RPC_URL=your_sepolia_rpc_url
```

Optional:

```bash
METADATA_BACKEND_PORT=3001
```

## Run

From the repo root:

```bash
npm run backend
```

Default URL:

```text
http://127.0.0.1:3001
```

The frontend uses this URL by default. Override it with `VITE_METADATA_API_URL` if needed.
