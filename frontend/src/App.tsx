import { useEffect, useState } from "react";
import type { Log, LogDescription } from "ethers";
import {
  connectWallet,
  getConnectedAccounts,
  getWalletContext,
  subscribeWalletEvents,
} from "./contract";
import "./App.css";

type TicketDetails = {
  eventId: string;
  owner: string;
  redeemed: boolean;
  ticketType: string;
  tokenURI: string;
};

const initialMintForm = {
  eventId: "1",
  ticketType: "VIP",
  to: "",
  uri: "ipfs://demo-ticket",
};

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatError(error: unknown) {
  if (error && typeof error === "object") {
    const maybeError = error as {
      info?: { error?: { message?: string } };
      data?: { message?: string };
      error?: { message?: string };
      reason?: string;
      shortMessage?: string;
      message?: string;
      code?: number | string;
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

    if (normalized.includes("missing revert data")) {
      return "Transaction was rejected by the contract. This usually happens when the action is not allowed, such as transferring a redeemed ticket.";
    }

    if (normalized.includes("redeemed ticket cannot be transferred")) {
      return "Redeemed ticket cannot be transferred.";
    }

    if (normalized.includes("ticket already redeemed")) {
      return "Ticket has already been redeemed.";
    }

    if (normalized.includes("not ticket owner")) {
      return "Only the current ticket owner can perform this action.";
    }

    if (
      normalized.includes("user rejected") ||
      normalized.includes("user denied")
    ) {
      return "Transaction was cancelled in MetaMask.";
    }

    if (normalized.includes("wrong network")) {
      return message;
    }

    if (
      normalized.includes("owner-only") ||
      normalized.includes("minting is owner-only")
    ) {
      return message;
    }

    return message || "Something went wrong.";
  }

  return "Something went wrong.";
}

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(
    null,
  );
  const [mintForm, setMintForm] = useState(initialMintForm);
  const [transferAddress, setTransferAddress] = useState("");
  const [status, setStatus] = useState(
    "Connect the wallet that should interact with the local TicketNFT contract.",
  );
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const isOwner =
    walletAddress !== "" &&
    ownerAddress !== "" &&
    walletAddress.toLowerCase() === ownerAddress.toLowerCase();

  useEffect(() => {
    void syncWallet(false);

    return subscribeWalletEvents(() => {
      void syncWallet(false);
    });
  }, []);

  async function syncWallet(showIdleMessage: boolean) {
    try {
      const accounts = await getConnectedAccounts();

      if (accounts.length === 0) {
        setWalletAddress("");
        setOwnerAddress("");
        setChainId("");
        if (showIdleMessage) {
          setStatus("Wallet disconnected.");
        }
        return;
      }

      const context = await getWalletContext();

      setWalletAddress(context.signerAddress);
      setOwnerAddress(context.ownerAddress);
      setChainId(context.chainId.toString());
      setMintForm((current) => ({
        ...current,
        to: current.to || context.signerAddress,
      }));
      if (showIdleMessage) {
        setStatus("Wallet connected and contract loaded.");
      }
      setError("");
    } catch (nextError) {
      setWalletAddress("");
      setOwnerAddress("");
      setChainId("");
      setError(formatError(nextError));
    }
  }

  async function runAction(
    pendingMessage: string,
    successMessage: string,
    action: () => Promise<void>,
  ) {
    setIsBusy(true);
    setError("");
    setStatus(pendingMessage);

    try {
      await action();
      setStatus(successMessage);
      await syncWallet(false);
    } catch (nextError) {
      const friendlyMessage = formatError(nextError);
      setError(friendlyMessage);
      setStatus(friendlyMessage);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleConnectWallet() {
    await runAction(
      "Requesting wallet access...",
      "Wallet connected.",
      async () => {
        await connectWallet();
      },
    );
  }

  async function handleMint() {
    await runAction(
      "Submitting mint transaction...",
      "Ticket minted.",
      async () => {
        const {
          contract,
          ownerAddress: contractOwner,
          signerAddress,
        } = await getWalletContext();

        if (signerAddress.toLowerCase() !== contractOwner.toLowerCase()) {
          throw new Error(
            `Minting is owner-only. Connect the deployer wallet ${contractOwner} to mint locally.`,
          );
        }

        const recipient = mintForm.to.trim() || signerAddress;
        const tx = await contract.mintTicket(
          recipient,
          mintForm.uri.trim(),
          BigInt(mintForm.eventId),
          mintForm.ticketType.trim(),
        );
        const receipt = await tx.wait();
        const transferLog = receipt?.logs
          .map((log: Log): LogDescription | null => {
            try {
              return contract.interface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find((log: LogDescription | null) => log?.name === "Transfer");
        const mintedTokenId = transferLog?.args?.tokenId;

        if (mintedTokenId !== undefined) {
          const mintedTokenIdText = mintedTokenId.toString();
          setTokenId(mintedTokenIdText);
          setStatus(`Ticket minted as token #${mintedTokenIdText}.`);
        }
      },
    );
  }

  async function handleFetchInfo() {
    await runAction(
      "Fetching ticket info...",
      "Ticket info loaded.",
      async () => {
        const { contract } = await getWalletContext();
        const targetTokenId = BigInt(tokenId);
        const [ticketInfo, tokenOwner, tokenURI] = await Promise.all([
          contract.getTicketInfo(targetTokenId),
          contract.ownerOf(targetTokenId),
          contract.tokenURI(targetTokenId),
        ]);

        setTicketDetails({
          eventId: ticketInfo[0].toString(),
          owner: tokenOwner,
          redeemed: ticketInfo[2],
          ticketType: ticketInfo[1],
          tokenURI,
        });
      },
    );
  }

  async function handleCheckOwner() {
    await runAction("Checking owner...", "Owner loaded.", async () => {
      const { contract } = await getWalletContext();
      const owner = await contract.ownerOf(BigInt(tokenId));

      setTicketDetails((current) =>
        current
          ? {
              ...current,
              owner,
            }
          : {
              eventId: "",
              owner,
              redeemed: false,
              ticketType: "",
              tokenURI: "",
            },
      );
    });
  }

  async function handleRedeem() {
    await runAction(
      "Submitting redeem transaction...",
      "Ticket redeemed.",
      async () => {
        const { contract, signerAddress } = await getWalletContext();
        const targetTokenId = BigInt(tokenId);

        const currentOwner = await contract.ownerOf(targetTokenId);
        if (currentOwner.toLowerCase() !== signerAddress.toLowerCase()) {
          throw new Error(
            "Only the current ticket owner can redeem this ticket.",
          );
        }

        const ticketInfo = await contract.getTicketInfo(targetTokenId);
        const redeemed = ticketInfo[2];

        if (redeemed) {
          throw new Error("Ticket has already been redeemed.");
        }

        const tx = await contract.redeem(targetTokenId);
        await tx.wait();
      },
    );
  }

  async function handleTransfer() {
    await runAction(
      "Submitting transfer transaction...",
      "Transfer complete.",
      async () => {
        const { contract, signerAddress } = await getWalletContext();
        const targetTokenId = BigInt(tokenId);

        const ticketInfo = await contract.getTicketInfo(targetTokenId);
        const redeemed = ticketInfo[2];

        if (redeemed) {
          throw new Error("Redeemed ticket cannot be transferred.");
        }

        const currentOwner = await contract.ownerOf(targetTokenId);
        if (currentOwner.toLowerCase() !== signerAddress.toLowerCase()) {
          throw new Error(
            "Only the current ticket owner can transfer this ticket.",
          );
        }

        if (
          transferAddress.trim().toLowerCase() === signerAddress.toLowerCase()
        ) {
          throw new Error("Ticket is already owned by this address.");
        }

        const tx = await contract.transferFrom(
          signerAddress,
          transferAddress.trim(),
          targetTokenId,
        );
        await tx.wait();
      },
    );
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Local Demo</p>
          <h1>TicketNFT control room</h1>
          <p className="hero-copy">
            Connect a wallet, mint a ticket as the contract owner, inspect the
            metadata, transfer it before redemption, and verify transfers fail
            after redemption.
          </p>
        </div>

        <div className="status-card">
          <p className="label">Connected wallet</p>
          <p className="value">
            {walletAddress ? shortenAddress(walletAddress) : "Not connected"}
          </p>
          <p className="label">Contract owner</p>
          <p className="value">
            {ownerAddress ? shortenAddress(ownerAddress) : "Unknown"}
          </p>
          <p className="label">Chain ID</p>
          <p className="value">{chainId || "Unknown"}</p>
          <p className={`badge ${isOwner ? "owner" : "viewer"}`}>
            {isOwner
              ? "Mint enabled for this wallet"
              : "Mint requires the deployer wallet"}
          </p>
          <button onClick={handleConnectWallet} disabled={isBusy}>
            Connect wallet
          </button>
        </div>
      </section>

      <section className="feedback-row">
        <div className="feedback-box">
          <p className="label">Status</p>
          <p>{status}</p>
        </div>
        <div className={`feedback-box ${error ? "error" : ""}`}>
          <p className="label">Latest error</p>
          <p>{error || "No errors."}</p>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2>Mint Ticket</h2>
            </div>
            <p className="hint">This action is owner-only on-chain.</p>
          </div>

          <label>
            Recipient
            <input
              value={mintForm.to}
              onChange={(event) =>
                setMintForm((current) => ({
                  ...current,
                  to: event.target.value,
                }))
              }
              placeholder="0x..."
            />
          </label>

          <label>
            Token URI
            <input
              value={mintForm.uri}
              onChange={(event) =>
                setMintForm((current) => ({
                  ...current,
                  uri: event.target.value,
                }))
              }
              placeholder="ipfs://demo-ticket"
            />
          </label>

          <div className="two-up">
            <label>
              Event ID
              <input
                value={mintForm.eventId}
                onChange={(event) =>
                  setMintForm((current) => ({
                    ...current,
                    eventId: event.target.value,
                  }))
                }
                inputMode="numeric"
                placeholder="1"
              />
            </label>

            <label>
              Ticket type
              <input
                value={mintForm.ticketType}
                onChange={(event) =>
                  setMintForm((current) => ({
                    ...current,
                    ticketType: event.target.value,
                  }))
                }
                placeholder="VIP"
              />
            </label>
          </div>

          <button onClick={handleMint} disabled={isBusy || !isOwner}>
            Mint ticket
          </button>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Step 2</p>
              <h2>Inspect Ticket</h2>
            </div>
            <p className="hint">
              Use the minted token ID or any existing token.
            </p>
          </div>

          <label>
            Token ID
            <input
              value={tokenId}
              onChange={(event) => setTokenId(event.target.value)}
              inputMode="numeric"
              placeholder="0"
            />
          </label>

          <div className="button-row">
            <button onClick={handleFetchInfo} disabled={isBusy || !tokenId}>
              Fetch ticket info
            </button>
            <button onClick={handleCheckOwner} disabled={isBusy || !tokenId}>
              Check owner
            </button>
          </div>

          <div className="details-card">
            <p className="label">Event ID</p>
            <p className="value">{ticketDetails?.eventId || "-"}</p>
            <p className="label">Ticket type</p>
            <p className="value">{ticketDetails?.ticketType || "-"}</p>
            <p className="label">Token URI</p>
            <p className="value wrap">{ticketDetails?.tokenURI || "-"}</p>
            <p className="label">Current owner</p>
            <p className="value wrap">{ticketDetails?.owner || "-"}</p>
            <p className="label">Redeemed</p>
            <p className="value">
              {ticketDetails ? (ticketDetails.redeemed ? "Yes" : "No") : "-"}
            </p>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Step 3</p>
              <h2>Redeem Ticket</h2>
            </div>
            <p className="hint">Only the current token owner can redeem.</p>
          </div>

          <p className="instruction">
            After redemption, any later transfer should revert with the contract
            error about redeemed tickets.
          </p>

          <button onClick={handleRedeem} disabled={isBusy || !tokenId}>
            Redeem ticket
          </button>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Step 4</p>
              <h2>Transfer Ticket</h2>
            </div>
            <p className="hint">Transfer works only before redemption.</p>
          </div>

          <label>
            Recipient address
            <input
              value={transferAddress}
              onChange={(event) => setTransferAddress(event.target.value)}
              placeholder="0x..."
            />
          </label>

          <button
            onClick={handleTransfer}
            disabled={isBusy || !tokenId || !transferAddress}
          >
            Transfer ticket
          </button>
        </article>
      </section>
    </main>
  );
}

export default App;
