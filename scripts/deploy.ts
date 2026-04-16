import hre from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const frontendEnvLocalPath = path.join(repoRoot, "frontend", ".env.local");

async function main() {
  const { ethers } = await hre.network.connect();
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying TicketNFT with account:", deployer.address);

  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(deployer.address);

  await ticketNFT.waitForDeployment();

  const contractAddress = await ticketNFT.getAddress();
  const envContents = [
    `VITE_TICKET_NFT_ADDRESS=${contractAddress}`,
    `VITE_TICKET_NFT_CHAIN_ID=${network.chainId.toString()}`,
  ].join("\n");

  await mkdir(path.dirname(frontendEnvLocalPath), { recursive: true });
  await writeFile(frontendEnvLocalPath, `${envContents}\n`, "utf8");

  console.log("TicketNFT deployed to:", contractAddress);
  console.log("Frontend env written to:", frontendEnvLocalPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
