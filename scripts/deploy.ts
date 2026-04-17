import hre from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function getFrontendEnvPath(networkName: string) {
  const fileName =
    networkName === "localhost" ? ".env.local" : `.env.${networkName}.local`;

  return path.join(repoRoot, "frontend", fileName);
}

function resolveTargetNetworkName(
  hreLike: { globalOptions?: { network?: string } },
  chainId: bigint
) {
  const globalNetworkName =
    typeof hreLike.globalOptions?.network === "string"
      ? hreLike.globalOptions.network
      : undefined;

  if (globalNetworkName) {
    return globalNetworkName;
  }

  if (process.env.HARDHAT_NETWORK) {
    return process.env.HARDHAT_NETWORK;
  }

  if (chainId === 31337n) {
    return "localhost";
  }

  if (chainId === 11155111n) {
    return "sepolia";
  }

  return chainId.toString();
}

async function main() {
  const { ethers } = await hre.network.connect();
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const targetNetworkName = resolveTargetNetworkName(hre, network.chainId);
  const frontendEnvPath = getFrontendEnvPath(targetNetworkName);

  console.log("Deploying TicketNFT with account:", deployer.address);
  console.log("Target network:", targetNetworkName);

  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(deployer.address);

  await ticketNFT.waitForDeployment();

  const contractAddress = await ticketNFT.getAddress();
  const envContents = [
    `VITE_TICKET_NFT_ADDRESS=${contractAddress}`,
    `VITE_TICKET_NFT_CHAIN_ID=${network.chainId.toString()}`,
  ].join("\n");

  await mkdir(path.dirname(frontendEnvPath), { recursive: true });
  await writeFile(frontendEnvPath, `${envContents}\n`, "utf8");

  console.log("TicketNFT deployed to:", contractAddress);
  console.log("Frontend env written to:", frontendEnvPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
