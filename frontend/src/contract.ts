import { BrowserProvider, Contract, type Eip1193Provider } from "ethers";

const CONTRACT_ADDRESS = import.meta.env.VITE_TICKET_NFT_ADDRESS?.trim();
const EXPECTED_CHAIN_ID = import.meta.env.VITE_TICKET_NFT_CHAIN_ID
  ? BigInt(import.meta.env.VITE_TICKET_NFT_CHAIN_ID)
  : undefined;

const ABI = [
  "function owner() view returns (address)",
  "function mintTicket(address to, string uri, uint256 eventId, string ticketType) returns (uint256)",
  "function redeem(uint256 tokenId)",
  "function getTicketInfo(uint256 tokenId) view returns (uint256, string, bool)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
] as const;

type EthereumWindow = Window & {
  ethereum?: Eip1193Provider & {
    on?: (eventName: string, listener: (...args: unknown[]) => void) => void;
    removeListener?: (
      eventName: string,
      listener: (...args: unknown[]) => void
    ) => void;
  };
};

export type WalletContext = {
  chainId: bigint;
  contract: Contract;
  ownerAddress: string;
  provider: BrowserProvider;
  signerAddress: string;
};

function getEthereum() {
  const { ethereum } = window as EthereumWindow;

  if (!ethereum) {
    throw new Error("No wallet found. Install or unlock MetaMask.");
  }

  return ethereum;
}

function getContractAddress() {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Missing contract address. Run the local deploy script to generate frontend/.env.local."
    );
  }

  return CONTRACT_ADDRESS;
}

async function validateNetwork(provider: BrowserProvider) {
  const network = await provider.getNetwork();

  if (EXPECTED_CHAIN_ID !== undefined && network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Wrong network. Switch your wallet to chain ID ${EXPECTED_CHAIN_ID.toString()}.`
    );
  }

  return network.chainId;
}

export async function connectWallet() {
  await getEthereum().request({ method: "eth_requestAccounts" });
}

export async function getConnectedAccounts() {
  const accounts = await getEthereum().request({ method: "eth_accounts" });
  return Array.isArray(accounts) ? (accounts as string[]) : [];
}

export function subscribeWalletEvents(listener: () => void) {
  const ethereum = (window as EthereumWindow).ethereum;

  if (!ethereum?.on || !ethereum.removeListener) {
    return () => undefined;
  }

  ethereum.on("accountsChanged", listener);
  ethereum.on("chainChanged", listener);

  return () => {
    ethereum.removeListener?.("accountsChanged", listener);
    ethereum.removeListener?.("chainChanged", listener);
  };
}

export async function getWalletContext(): Promise<WalletContext> {
  const provider = new BrowserProvider(getEthereum());
  const chainId = await validateNetwork(provider);
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();
  const contract = new Contract(getContractAddress(), ABI, signer);
  const ownerAddress = await contract.owner();

  return {
    chainId,
    contract,
    ownerAddress,
    provider,
    signerAddress,
  };
}
