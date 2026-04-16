import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const ABI = [
  "function mintTicket(address to, string uri, uint256 eventId, string ticketType)",
  "function redeem(uint256 tokenId)",
  "function getTicketInfo(uint256 tokenId) view returns (uint256, string, bool)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function transferFrom(address from, address to, uint256 tokenId)"
];

export async function getContract() {
  if (!window.ethereum) throw new Error("No wallet");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}