import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();
  const [deployer] = await ethers.getSigners();

  console.log("Deploying TicketNFT with account:", deployer.address);

  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(deployer.address);

  await ticketNFT.waitForDeployment();

  const contractAddress = await ticketNFT.getAddress();

  console.log("TicketNFT deployed to:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});