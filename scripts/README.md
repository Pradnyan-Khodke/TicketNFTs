# Scripts

This directory contains deployment and utility scripts for the TicketNFTs project.

## What Exists Today

- `deploy.ts` deploys the `TicketNFT` contract using the active Hardhat network signer.
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

The deploy script prints the deployer address, the deployed contract address, and the path of the generated frontend env file.

## Other Networks

The Hardhat config also includes a `sepolia` network. To use it, you would need to provide:

- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`

The current project workflow is still primarily local-first, so local deployment is the main documented path.

## Future Work

Potential later additions:

- seeding/demo-data scripts
- verification scripts
- helper scripts for repeated frontend demo setup
