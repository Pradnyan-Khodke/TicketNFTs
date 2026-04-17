import {
  BrowserProvider,
  Contract,
  formatEther,
  isAddress,
  type Eip1193Provider,
} from "ethers";

const CONTRACT_ADDRESS = import.meta.env.VITE_TICKET_NFT_ADDRESS?.trim();
const EXPECTED_CHAIN_ID = import.meta.env.VITE_TICKET_NFT_CHAIN_ID
  ? BigInt(import.meta.env.VITE_TICKET_NFT_CHAIN_ID)
  : undefined;

export const CONFIGURED_CONTRACT_ADDRESS = CONTRACT_ADDRESS ?? "";
export const DEFAULT_IPFS_GATEWAY =
  "https://gateway.pinata.cloud/ipfs/";

const ABI = [
  "function owner() view returns (address)",
  "function isOrganizer(address account) view returns (bool)",
  "function getEventCount() view returns (uint256)",
  "function getTotalMintedTickets() view returns (uint256)",
  "function getEventInfo(uint256 eventId) view returns (string, address, bool, uint256)",
  "function getCategory(uint256 eventId, uint256 categoryId) view returns (string, string, uint256, uint256, uint256, uint256)",
  "function getTicketInfo(uint256 tokenId) view returns (uint256, string, bool)",
  "function getTicketCategoryId(uint256 tokenId) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function createEvent(string name) returns (uint256)",
  "function createCategory(uint256 eventId, string ticketType, string metadataURI, uint256 price, uint256 maxSupply) returns (uint256)",
  "function purchaseTicket(uint256 eventId, uint256 categoryId) payable returns (uint256)",
  "function redeem(uint256 tokenId)",
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
  isOrganizer: boolean;
  ownerAddress: string;
  provider: BrowserProvider;
  signerAddress: string;
};

export type EventCategory = {
  categoryId: number;
  imageUrl: string | null;
  maxSupply: bigint;
  metadataDescription: string | null;
  metadataName: string | null;
  metadataStatus: "error" | "loaded" | "missing";
  metadataUrl: string | null;
  metadataURI: string;
  minted: bigint;
  price: bigint;
  remaining: bigint;
  ticketType: string;
};

export type EventRecord = {
  active: boolean;
  categories: EventCategory[];
  categoryCount: number;
  eventId: number;
  name: string;
  organizer: string;
};

export type TicketRecord = {
  categoryId: number;
  eventActive: boolean;
  eventId: number;
  eventName: string;
  imageUrl: string | null;
  metadataDescription: string | null;
  metadataName: string | null;
  metadataStatus: "error" | "loaded" | "missing";
  metadataUrl: string | null;
  organizer: string;
  owner: string;
  redeemed: boolean;
  ticketType: string;
  tokenId: number;
  tokenURI: string;
};

type NftMetadata = {
  description?: string;
  image?: string;
  image_url?: string;
  name?: string;
};

type ResolvedMetadata = {
  imageUrl: string | null;
  metadata: NftMetadata | null;
  metadataUrl: string | null;
  status: "error" | "loaded" | "missing";
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
  const [ownerAddress, organizerStatus] = await Promise.all([
    contract.owner(),
    contract.isOrganizer(signerAddress),
  ]);

  return {
    chainId,
    contract,
    isOrganizer: organizerStatus,
    ownerAddress,
    provider,
    signerAddress,
  };
}

export async function loadEvents(contract: Contract): Promise<EventRecord[]> {
  const eventCount = Number(await contract.getEventCount());
  const eventIds = Array.from({ length: eventCount }, (_, index) => index);
  const metadataCache = new Map<string, Promise<ResolvedMetadata>>();
  const events = await Promise.all(
    eventIds.map(async (eventId) => {
      const [name, organizer, active, categoryCountRaw] =
        await contract.getEventInfo(eventId);
      const categoryCount = Number(categoryCountRaw);
      const categoryIds = Array.from(
        { length: categoryCount },
        (_, categoryId) => categoryId,
      );
      const categories = await Promise.all(
        categoryIds.map(async (categoryId) => {
          const [ticketType, metadataURI, price, maxSupply, minted, remaining] =
            await contract.getCategory(eventId, categoryId);
          let metadataPromise = metadataCache.get(metadataURI);

          if (!metadataPromise) {
            metadataPromise = loadResolvedMetadata(metadataURI);
            metadataCache.set(metadataURI, metadataPromise);
          }

          const resolved = await metadataPromise;

          return {
            categoryId,
            imageUrl: resolved.imageUrl,
            maxSupply,
            metadataDescription: resolved.metadata?.description ?? null,
            metadataName: resolved.metadata?.name ?? null,
            metadataStatus: resolved.status,
            metadataUrl: resolved.metadataUrl,
            metadataURI,
            minted,
            price,
            remaining,
            ticketType,
          } satisfies EventCategory;
        }),
      );

      return {
        active,
        categories,
        categoryCount,
        eventId,
        name,
        organizer,
      } satisfies EventRecord;
    }),
  );

  return events.sort((left, right) => left.eventId - right.eventId);
}

export async function loadOwnedTickets(
  contract: Contract,
  walletAddress: string,
  knownEvents: EventRecord[] = [],
): Promise<TicketRecord[]> {
  const totalMinted = Number(await contract.getTotalMintedTickets());
  const eventCache = new Map(knownEvents.map((event) => [event.eventId, event]));
  const metadataCache = new Map<string, Promise<ResolvedMetadata>>();
  const normalizedWallet = walletAddress.toLowerCase();
  const tickets: TicketRecord[] = [];

  for (let tokenId = 0; tokenId < totalMinted; tokenId += 1) {
    const owner = await contract.ownerOf(tokenId);

    if (owner.toLowerCase() !== normalizedWallet) {
      continue;
    }

    const [ticketInfo, categoryIdRaw, tokenURI] = await Promise.all([
      contract.getTicketInfo(tokenId),
      contract.getTicketCategoryId(tokenId),
      contract.tokenURI(tokenId),
    ]);

    const eventId = Number(ticketInfo[0]);
    let eventRecord = eventCache.get(eventId);

    if (!eventRecord) {
      eventRecord = (await loadEvents(contract)).find(
        (event) => event.eventId === eventId,
      );
      if (eventRecord) {
        eventCache.set(eventId, eventRecord);
      }
    }

    let metadataPromise = metadataCache.get(tokenURI);
    if (!metadataPromise) {
      metadataPromise = loadResolvedMetadata(tokenURI);
      metadataCache.set(tokenURI, metadataPromise);
    }
    const resolved = await metadataPromise;

    tickets.push({
      categoryId: Number(categoryIdRaw),
      eventActive: eventRecord?.active ?? false,
      eventId,
      eventName: eventRecord?.name ?? `Event #${eventId}`,
      imageUrl: resolved.imageUrl,
      metadataDescription: resolved.metadata?.description ?? null,
      metadataName: resolved.metadata?.name ?? null,
      metadataStatus: resolved.status,
      metadataUrl: resolved.metadataUrl,
      organizer: eventRecord?.organizer ?? "",
      owner,
      redeemed: ticketInfo[2],
      ticketType: ticketInfo[1],
      tokenId,
      tokenURI,
    });
  }

  return tickets.reverse();
}

export function formatPrice(value: bigint) {
  if (value < 1_000_000_000_000n) {
    return `${value.toString()} wei`;
  }

  const formatted = formatEther(value);
  return `${formatted.replace(/\.?0+$/, "")} ETH`;
}

export function isValidWalletAddress(address: string) {
  return isAddress(address.trim());
}

export function resolveMetadataUrl(uri: string) {
  const trimmed = uri.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("ipfs://")) {
    return `${DEFAULT_IPFS_GATEWAY}${trimmed.slice("ipfs://".length)}`;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  return trimmed;
}

export function resolveAssetUrl(uri: string) {
  return resolveMetadataUrl(uri);
}

async function loadTokenMetadata(tokenURI: string): Promise<NftMetadata | null> {
  const resolvedUrl = resolveMetadataUrl(tokenURI);

  if (!resolvedUrl) {
    return null;
  }

  try {
    const response = await fetch(resolvedUrl);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as NftMetadata;
  } catch {
    return null;
  }
}

async function loadResolvedMetadata(tokenURI: string): Promise<ResolvedMetadata> {
  const metadataUrl = resolveMetadataUrl(tokenURI);

  if (!metadataUrl) {
    return {
      imageUrl: null,
      metadata: null,
      metadataUrl: null,
      status: "missing",
    };
  }

  const metadata = await loadTokenMetadata(tokenURI);

  if (!metadata) {
    return {
      imageUrl: null,
      metadata: null,
      metadataUrl,
      status: "error",
    };
  }

  const metadataImageUri = metadata.image ?? metadata.image_url ?? null;

  return {
    imageUrl: metadataImageUri ? resolveAssetUrl(metadataImageUri) : null,
    metadata,
    metadataUrl,
    status: "loaded",
  };
}

export function formatError(error: unknown) {
  if (error && typeof error === "object") {
    const maybeError = error as {
      info?: { error?: { message?: string } };
      data?: { message?: string };
      error?: { message?: string };
      reason?: string;
      shortMessage?: string;
      message?: string;
    };

    const message =
      maybeError.shortMessage ??
      maybeError.reason ??
      maybeError.data?.message ??
      maybeError.error?.message ??
      maybeError.info?.error?.message ??
      maybeError.message ??
      "";

    const normalized = message.toLowerCase();

    if (normalized.includes("user rejected") || normalized.includes("user denied")) {
      return "Transaction was cancelled in MetaMask.";
    }

    if (normalized.includes("wrong network")) {
      return message;
    }

    if (normalized.includes("redeemed ticket cannot be transferred")) {
      return "Redeemed tickets cannot be transferred.";
    }

    if (normalized.includes("ticket already redeemed")) {
      return "This ticket has already been redeemed.";
    }

    if (normalized.includes("not ticket owner")) {
      return "Only the current ticket owner can perform this action.";
    }

    if (normalized.includes("incorrect payment")) {
      return "The payment amount does not match the selected ticket price.";
    }

    if (normalized.includes("category sold out")) {
      return "That ticket category is sold out.";
    }

    if (normalized.includes("event is not active")) {
      return "This event is not active for purchases right now.";
    }

    if (normalized.includes("event does not exist")) {
      return "The selected event could not be found.";
    }

    if (normalized.includes("category does not exist")) {
      return "The selected ticket category could not be found.";
    }

    if (normalized.includes("not event organizer")) {
      return "Only the event organizer or contract owner can edit that event.";
    }

    if (normalized.includes("not authorized organizer")) {
      return "This wallet is not approved to create events.";
    }

    if (normalized.includes("event name required")) {
      return "Enter an event name before creating the event.";
    }

    if (normalized.includes("ticket type required")) {
      return "Enter a ticket category name.";
    }

    if (normalized.includes("metadata uri required")) {
      return "Enter a metadata URI for the category.";
    }

    if (normalized.includes("max supply must be greater than zero")) {
      return "Ticket supply must be greater than zero.";
    }

    if (normalized.includes("missing revert data")) {
      return "The contract rejected the action.";
    }

    return message || "Something went wrong.";
  }

  return "Something went wrong.";
}
