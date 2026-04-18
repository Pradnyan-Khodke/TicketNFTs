import "dotenv/config";
import hre from "hardhat";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function getFrontendEnvPath(networkName: string) {
  const fileName =
    networkName === "localhost" ? ".env.local" : `.env.${networkName}.local`;

  return path.join(repoRoot, "frontend", fileName);
}

type MetadataAttribute = {
  trait_type: string;
  value: number | string;
};

type TicketMetadata = {
  attributes: MetadataAttribute[];
  description: string;
  image: string;
  name: string;
};

type ParsedOptions = {
  contractAddress?: string;
  description?: string;
  dryRun: boolean;
  eventId: number;
  imagePath?: string;
  maxSupply: bigint;
  outputDir: string;
  priceEth: string;
  transferable: boolean;
  ticketType: string;
  uploadImage: boolean;
};

function printUsage() {
  console.log(`Usage:
  npm run metadata:category -- --event-id 0 --ticket-type VIP --price-eth 0.01 --max-supply 100 [options]

Required:
  --event-id <number>       Existing on-chain event ID
  --ticket-type <string>    Ticket category label, such as VIP
  --price-eth <string>      Category price in ETH, such as 0.01
  --max-supply <number>     Maximum tickets in this category

Optional:
  --description <string>    Custom metadata description
  --image-path <path>       Existing image to include instead of the generated SVG
  --upload-image            Upload the image asset to IPFS instead of embedding it
  --soulbound               Create a non-transferable category
  --contract <address>      Contract address override (otherwise the matching frontend env file is used)
  --output-dir <path>       Local folder for generated files (default: scripts/generated-metadata)
  --dry-run                 Generate files only and skip IPFS upload + on-chain category creation

Environment:
  PINATA_JWT                Required for live IPFS upload
`);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function guessContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function toDataUri(contents: Buffer, contentType: string) {
  return `data:${contentType};base64,${contents.toString("base64")}`;
}

function createTicketSvg(args: {
  eventId: number;
  eventName: string;
  maxSupply: bigint;
  priceEth: string;
  ticketType: string;
}) {
  const safeEventName = escapeXml(args.eventName);
  const safeTicketType = escapeXml(args.ticketType);
  const maxSupplyText = args.maxSupply.toString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Ticket NFT placeholder">
  <defs>
    <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#24183F" />
      <stop offset="55%" stop-color="#6C3CF0" />
      <stop offset="100%" stop-color="#C57CFF" />
    </linearGradient>
    <linearGradient id="panel" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.16)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0.06)" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" rx="36" fill="url(#bg)" />
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="url(#panel)" stroke="rgba(255,255,255,0.25)" />
  <circle cx="1090" cy="110" r="78" fill="rgba(255,255,255,0.08)" />
  <circle cx="1040" cy="495" r="112" fill="rgba(255,255,255,0.06)" />
  <text x="86" y="110" fill="#F4EFFF" font-family="'Space Grotesk', 'IBM Plex Sans', sans-serif" font-size="24" letter-spacing="4">TICKETNFTS</text>
  <text x="86" y="208" fill="#FFFFFF" font-family="'Space Grotesk', 'IBM Plex Sans', sans-serif" font-size="72" font-weight="700">${safeTicketType}</text>
  <text x="86" y="272" fill="rgba(255,255,255,0.88)" font-family="'IBM Plex Sans', sans-serif" font-size="34">${safeEventName}</text>
  <text x="86" y="376" fill="#E4D7FF" font-family="'IBM Plex Sans', sans-serif" font-size="22" letter-spacing="2">EVENT ID</text>
  <text x="86" y="414" fill="#FFFFFF" font-family="'IBM Plex Sans', sans-serif" font-size="34" font-weight="700">${
    args.eventId
  }</text>
  <text x="330" y="376" fill="#E4D7FF" font-family="'IBM Plex Sans', sans-serif" font-size="22" letter-spacing="2">PRICE</text>
  <text x="330" y="414" fill="#FFFFFF" font-family="'IBM Plex Sans', sans-serif" font-size="34" font-weight="700">${escapeXml(
    args.priceEth
  )} ETH</text>
  <text x="580" y="376" fill="#E4D7FF" font-family="'IBM Plex Sans', sans-serif" font-size="22" letter-spacing="2">MAX SUPPLY</text>
  <text x="580" y="414" fill="#FFFFFF" font-family="'IBM Plex Sans', sans-serif" font-size="34" font-weight="700">${maxSupplyText}</text>
  <text x="86" y="526" fill="rgba(255,255,255,0.82)" font-family="'IBM Plex Sans', sans-serif" font-size="24">Programmable ticket ownership on ERC-721 infrastructure</text>
</svg>`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function uploadJsonToPinata(name: string, payload: unknown, jwt: string) {
  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataContent: payload,
        pinataMetadata: {
          name,
        },
      }),
    }
  );

  const data = (await response.json()) as { IpfsHash?: string; error?: string };

  if (!response.ok || !data.IpfsHash) {
    throw new Error(data.error ?? "Failed to upload metadata JSON to Pinata.");
  }

  return {
    cid: data.IpfsHash,
    uri: `ipfs://${data.IpfsHash}`,
  };
}

async function uploadFileToPinata(
  fileName: string,
  contents: Buffer,
  contentType: string,
  jwt: string
) {
  const body = new FormData();
  body.append("file", new Blob([contents], { type: contentType }), fileName);
  body.append(
    "pinataMetadata",
    JSON.stringify({
      name: fileName,
    })
  );

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body,
    }
  );

  const data = (await response.json()) as { IpfsHash?: string; error?: string };

  if (!response.ok || !data.IpfsHash) {
    throw new Error(data.error ?? "Failed to upload file to Pinata.");
  }

  return {
    cid: data.IpfsHash,
    uri: `ipfs://${data.IpfsHash}`,
  };
}

async function readContractAddressFromFrontendEnv() {
  const networkName = process.env.HARDHAT_NETWORK ?? "localhost";
  const frontendEnvPath = getFrontendEnvPath(networkName);
  const envContents = await readFile(frontendEnvPath, "utf8");
  const match = envContents.match(/^VITE_TICKET_NFT_ADDRESS=(.+)$/m);

  if (!match) {
    throw new Error(
      `Could not find VITE_TICKET_NFT_ADDRESS in ${path.relative(
        repoRoot,
        frontendEnvPath
      )}. Deploy first or pass --contract.`
    );
  }

  return match[1].trim();
}

function parseCliArgs(): ParsedOptions {
  const { values } = parseArgs({
    allowPositionals: false,
    options: {
      contract: { type: "string" },
      description: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      "event-id": { type: "string" },
      "image-path": { type: "string" },
      "max-supply": { type: "string" },
      "output-dir": { type: "string" },
      "price-eth": { type: "string" },
      soulbound: { type: "boolean", default: false },
      "ticket-type": { type: "string" },
      "upload-image": { type: "boolean", default: false },
    },
  });

  if (
    values["event-id"] === undefined ||
    values["ticket-type"] === undefined ||
    values["price-eth"] === undefined ||
    values["max-supply"] === undefined
  ) {
    printUsage();
    throw new Error("Missing required metadata script arguments.");
  }

  const eventId = Number(values["event-id"]);
  const maxSupply = BigInt(values["max-supply"]);

  if (!Number.isInteger(eventId) || eventId < 0) {
    throw new Error("event-id must be a non-negative integer.");
  }

  if (maxSupply <= 0n) {
    throw new Error("max-supply must be greater than zero.");
  }

  return {
    contractAddress: values.contract,
    description: values.description,
    dryRun: values["dry-run"],
    eventId,
    imagePath: values["image-path"],
    maxSupply,
    outputDir:
      values["output-dir"] ?? path.join("scripts", "generated-metadata"),
    priceEth: values["price-eth"],
    transferable: !values.soulbound,
    ticketType: values["ticket-type"].trim(),
    uploadImage: values["upload-image"],
  };
}

async function main() {
  const options = parseCliArgs();
  const contractAddress =
    options.contractAddress ?? (await readContractAddressFromFrontendEnv());
  const outputDir = path.resolve(repoRoot, options.outputDir);

  const { ethers } = (await hre.network.connect()) as unknown as {
    ethers: any;
  };
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const contract = await ethers.getContractAt(
    "TicketNFT",
    contractAddress,
    signer
  );
  const [eventName, organizer, active, categoryCountRaw] =
    await contract.getEventInfo(options.eventId);
  const categoryId = Number(categoryCountRaw);
  const slug = slugify(
    `${eventName}-${options.ticketType}-event-${options.eventId}`
  );
  const fileBaseName = `${slug}-category-${categoryId}`;
  const priceWei = ethers.parseEther(options.priceEth);

  await mkdir(outputDir, { recursive: true });

  let imageContents: Buffer;
  let imageContentType: string;
  let imageFileName: string;

  if (options.imagePath) {
    const absoluteImagePath = path.resolve(repoRoot, options.imagePath);
    imageContents = await readFile(absoluteImagePath);
    imageContentType = guessContentType(absoluteImagePath);
    imageFileName = path.basename(absoluteImagePath);
  } else {
    imageContents = Buffer.from(
      createTicketSvg({
        eventId: options.eventId,
        eventName,
        maxSupply: options.maxSupply,
        priceEth: options.priceEth,
        ticketType: options.ticketType,
      }),
      "utf8"
    );
    imageContentType = "image/svg+xml";
    imageFileName = `${fileBaseName}.svg`;
    await writeFile(path.join(outputDir, imageFileName), imageContents, "utf8");
  }

  let imageReference = toDataUri(imageContents, imageContentType);
  const metadataDescription =
    options.description ??
    `${
      options.ticketType
    } ticket for ${eventName}. This TicketNFT category tracks event ID ${
      options.eventId
    } with a max supply of ${options.maxSupply.toString()} tickets. Ownership, transfer restrictions after redemption, and redemption state are enforced on-chain.`;

  if (!options.dryRun) {
    const pinataJwt = process.env.PINATA_JWT?.trim();

    if (!pinataJwt) {
      throw new Error(
        "PINATA_JWT is required for live IPFS upload. Use --dry-run to only generate files locally."
      );
    }

    if (options.uploadImage) {
      const uploadedImage = await uploadFileToPinata(
        imageFileName,
        imageContents,
        imageContentType,
        pinataJwt
      );
      imageReference = uploadedImage.uri;
      console.log("Uploaded image:", uploadedImage.uri);
    }
  }

  const metadata: TicketMetadata = {
    attributes: [
      { trait_type: "Event Name", value: eventName },
      { trait_type: "Event ID", value: options.eventId },
      { trait_type: "Ticket Type", value: options.ticketType },
      { trait_type: "Category ID", value: categoryId },
      { trait_type: "Price (ETH)", value: options.priceEth },
      { trait_type: "Max Supply", value: options.maxSupply.toString() },
      {
        trait_type: "Transferability",
        value: options.transferable ? "transferable" : "soul-bound",
      },
      { trait_type: "Organizer", value: organizer },
      { trait_type: "Network Chain ID", value: network.chainId.toString() },
      { trait_type: "Contract Address", value: contractAddress },
      { trait_type: "Event Active", value: active ? "true" : "false" },
    ],
    description: metadataDescription,
    image: imageReference,
    name: `${eventName} - ${options.ticketType} Ticket`,
  };

  const metadataPath = path.join(outputDir, `${fileBaseName}.json`);
  await writeFile(
    metadataPath,
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8"
  );

  console.log("Generated metadata file:", metadataPath);

  if (options.dryRun) {
    console.log(
      "Dry run complete. No IPFS upload or on-chain transaction was sent."
    );
    return;
  }

  const pinataJwt = process.env.PINATA_JWT?.trim();

  if (!pinataJwt) {
    throw new Error("PINATA_JWT is required for live IPFS upload.");
  }

  const uploadedMetadata = await uploadJsonToPinata(
    `${fileBaseName}.json`,
    metadata,
    pinataJwt
  );

  console.log("Uploaded metadata:", uploadedMetadata.uri);
  console.log("Creating category on-chain...");

  const tx = await contract.createCategory(
    options.eventId,
    options.ticketType,
    uploadedMetadata.uri,
    priceWei,
    options.maxSupply,
    options.transferable
  );
  await tx.wait();

  console.log(`Created category #${categoryId} for event #${options.eventId}`);
  console.log("Stored tokenURI:", uploadedMetadata.uri);
  console.log(
    "Future purchases in this category will mint tickets with that metadata URI."
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
