import "dotenv/config";
import cors from "cors";
import express from "express";
import { ethers } from "ethers";
import {
  buildCategoryFileBaseName,
  buildCategoryMetadata,
} from "./lib/categoryMetadata.js";
import { createTicketSvg } from "./lib/createTicketSvg.js";
import { getRpcUrl } from "./lib/networks.js";
import { uploadFileToPinata, uploadJsonToPinata } from "./lib/pinata.js";

const PORT = Number(process.env.METADATA_BACKEND_PORT ?? 3001);
const CONTRACT_ABI = [
  "function getEventInfo(uint256 eventId) view returns (string, address, bool, uint256)",
];

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/category-metadata", async (req, res) => {
  try {
    const pinataJwt = process.env.PINATA_JWT?.trim();

    if (!pinataJwt) {
      throw new Error("PINATA_JWT is not set.");
    }

    const payload = req.body ?? {};
    const {
      contractAddress,
      description,
      eventId,
      maxSupply,
      network,
      priceEth,
      ticketType,
      transferable,
    } = payload;

    if (
      typeof contractAddress !== "string" ||
      typeof network !== "string" ||
      typeof ticketType !== "string" ||
      typeof priceEth !== "string" ||
      typeof eventId !== "number" ||
      typeof maxSupply !== "string" ||
      typeof transferable !== "boolean"
    ) {
      return res.status(400).json({
        error: "Missing required category metadata fields.",
      });
    }

    if (!ethers.isAddress(contractAddress)) {
      return res.status(400).json({
        error: "Invalid contract address.",
      });
    }

    const provider = new ethers.JsonRpcProvider(getRpcUrl(network));
    const contract = new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      provider,
    );
    const [eventName, organizer, active, categoryCountRaw] =
      await contract.getEventInfo(eventId);

    const categoryId = Number(categoryCountRaw);
    const fileBaseName = buildCategoryFileBaseName({
      categoryId,
      eventId,
      eventName,
      ticketType,
    });

    const svg = createTicketSvg({
      eventId,
      eventName,
      maxSupply,
      priceEth,
      ticketType,
      transferable,
    });

    const imageUri = await uploadFileToPinata(
      `${fileBaseName}.svg`,
      Buffer.from(svg, "utf8"),
      "image/svg+xml",
      pinataJwt,
    );

    const metadata = buildCategoryMetadata({
      active,
      categoryId,
      description,
      eventId,
      eventName,
      imageUri,
      maxSupply,
      organizer,
      priceEth,
      ticketType,
      transferable,
    });

    const metadataUri = await uploadJsonToPinata(
      `${fileBaseName}.json`,
      metadata,
      pinataJwt,
    );

    return res.json({
      imageUri,
      metadata,
      metadataUri,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown backend error.";
    return res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(
    `TicketNFT metadata backend listening on http://127.0.0.1:${PORT}`,
  );
});
