import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CONFIGURED_CONTRACT_ADDRESS,
  connectWallet,
  formatError,
  getConnectedAccounts,
  getWalletContext,
  isValidWalletAddress,
  loadEvents,
  loadOwnedTickets,
  subscribeWalletEvents,
  type EventRecord,
  type TicketRecord,
  type WalletContext,
} from "./contract";
import "./App.css";
import { EventsView } from "./components/EventsView";
import { MyTicketsView } from "./components/MyTicketsView";
import { OrganizerView } from "./components/OrganizerView";

type View = "events" | "tickets" | "organizer";

type Notice = {
  message: string;
  tone: "error" | "info" | "success";
};

const initialEventForm = {
  name: "",
};

const initialCategoryForm = {
  eventId: "",
  maxSupply: "100",
  priceEth: "0.01",
  ticketType: "VIP",
};

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shellQuote(value: string) {
  if (value.length === 0) {
    return "''";
  }

  return `'${value.replaceAll("'", `'\"'\"'`)}'`;
}

function getMetadataNetworkName(chainId: string) {
  if (chainId === "11155111") {
    return "sepolia";
  }

  return "localhost";
}

function getEventRemaining(event: EventRecord) {
  return event.categories.reduce(
    (total, category) => total + category.remaining,
    0n
  );
}

function App() {
  const [activeView, setActiveView] = useState<View>("events");
  const [busyLabel, setBusyLabel] = useState("");
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [chainId, setChainId] = useState("");
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState<Notice>({
    message:
      "Connect the wallet that should interact with your local TicketNFT deployment.",
    tone: "info",
  });
  const [ownerAddress, setOwnerAddress] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [transferTargets, setTransferTargets] = useState<
    Record<number, string>
  >({});
  const [walletAddress, setWalletAddress] = useState("");

  const isBusy = busyLabel !== "";
  const selectedEvent =
    events.find((event) => event.eventId === selectedEventId) ?? null;
  const selectedOrganizerEvent =
    events.find((event) => event.eventId.toString() === categoryForm.eventId) ??
    null;

  const metrics = useMemo(() => {
    const totalCategories = events.reduce(
      (count, event) => count + event.categories.length,
      0
    );
    const totalInventoryRemaining = events.reduce(
      (total, event) => total + getEventRemaining(event),
      0n
    );

    return {
      availableEvents: events.length,
      ownedTickets: tickets.length,
      ticketCategories: totalCategories,
      totalInventoryRemaining,
    };
  }, [events, tickets]);

  const metadataHint = useMemo(() => {
    if (!selectedOrganizerEvent) {
      return null;
    }

    const ticketType = categoryForm.ticketType.trim() || "VIP";
    const priceEth = categoryForm.priceEth.trim() || "0.01";
    const maxSupply = categoryForm.maxSupply.trim() || "100";
    const metadataNetworkName = getMetadataNetworkName(chainId);
    const baseCommand = [
      `HARDHAT_NETWORK=${metadataNetworkName}`,
      "node",
      "scripts/createCategoryWithMetadata.ts",
      "--event-id",
      selectedOrganizerEvent.eventId.toString(),
      "--ticket-type",
      shellQuote(ticketType),
      "--price-eth",
      priceEth,
      "--max-supply",
      maxSupply,
    ].join(" ");

    return {
      dryRun: `${baseCommand} --dry-run`,
      eventName: selectedOrganizerEvent.name,
      liveRun: `${baseCommand} --upload-image`,
    };
  }, [
    categoryForm.maxSupply,
    categoryForm.priceEth,
    categoryForm.ticketType,
    chainId,
    selectedOrganizerEvent,
  ]);

  useEffect(() => {
    void syncWallet(false);

    return subscribeWalletEvents(() => {
      void syncWallet(false);
    });
  }, []);

  useEffect(() => {
    if (events.length === 0) {
      setSelectedEventId(null);
      return;
    }

    if (
      selectedEventId === null ||
      !events.some((event) => event.eventId === selectedEventId)
    ) {
      setSelectedEventId(events[0].eventId);
    }
  }, [events, selectedEventId]);

  useEffect(() => {
    if (!selectedEvent) {
      setSelectedCategoryId(null);
      return;
    }

    if (selectedEvent.categories.length === 0) {
      setSelectedCategoryId(null);
      return;
    }

    if (
      selectedCategoryId === null ||
      !selectedEvent.categories.some(
        (category) => category.categoryId === selectedCategoryId
      )
    ) {
      setSelectedCategoryId(selectedEvent.categories[0].categoryId);
    }
  }, [selectedCategoryId, selectedEvent]);

  useEffect(() => {
    if (events.length === 0) {
      return;
    }

    const matchingEvent = events.find(
      (event) => event.eventId.toString() === categoryForm.eventId
    );

    if (!matchingEvent) {
      setCategoryForm((current) => ({
        ...current,
        eventId: events[0].eventId.toString(),
      }));
    }
  }, [categoryForm.eventId, events]);

  async function syncWallet(showIdleMessage: boolean) {
    setIsRefreshing(true);

    try {
      const accounts = await getConnectedAccounts();

      if (accounts.length === 0) {
        setWalletAddress("");
        setOwnerAddress("");
        setChainId("");
        setIsOrganizer(false);
        setEvents([]);
        setTickets([]);
        setTransferTargets({});

        if (showIdleMessage) {
          setNotice({
            message: "Wallet disconnected.",
            tone: "info",
          });
        }

        return;
      }

      const context = await getWalletContext();
      const nextEvents = await loadEvents(context.contract);
      const nextTickets = await loadOwnedTickets(
        context.contract,
        context.signerAddress,
        nextEvents
      );

      setWalletAddress(context.signerAddress);
      setOwnerAddress(context.ownerAddress);
      setChainId(context.chainId.toString());
      setIsOrganizer(context.isOrganizer);
      setEvents(nextEvents);
      setTickets(nextTickets);
      setTransferTargets((current) => {
        const nextTargets: Record<number, string> = {};

        for (const ticket of nextTickets) {
          nextTargets[ticket.tokenId] = current[ticket.tokenId] ?? "";
        }

        return nextTargets;
      });

      if (showIdleMessage) {
        setNotice({
          message: "Wallet connected and local event data loaded.",
          tone: "success",
        });
      }
    } catch (error) {
      setWalletAddress("");
      setOwnerAddress("");
      setChainId("");
      setIsOrganizer(false);
      setEvents([]);
      setTickets([]);
      setTransferTargets({});
      setNotice({
        message: formatError(error),
        tone: "error",
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  async function runAction(
    pendingMessage: string,
    successMessage: string,
    action: (context: WalletContext) => Promise<void>
  ) {
    setBusyLabel(pendingMessage);
    setNotice({
      message: pendingMessage,
      tone: "info",
    });

    try {
      const context = await getWalletContext();
      await action(context);
      await syncWallet(false);
      setNotice({
        message: successMessage,
        tone: "success",
      });
    } catch (error) {
      setNotice({
        message: formatError(error),
        tone: "error",
      });
    } finally {
      setBusyLabel("");
    }
  }

  async function handleConnectWallet() {
    setBusyLabel("Requesting wallet access...");
    setNotice({
      message: "Requesting wallet access...",
      tone: "info",
    });

    try {
      await connectWallet();
      await syncWallet(true);
    } catch (error) {
      setNotice({
        message: formatError(error),
        tone: "error",
      });
    } finally {
      setBusyLabel("");
    }
  }

  async function handlePurchase() {
    const selectedCategory =
      selectedEvent?.categories.find(
        (category) => category.categoryId === selectedCategoryId
      ) ?? null;

    if (!selectedEvent || !selectedCategory) {
      setNotice({
        message: "Choose a ticket category before purchasing.",
        tone: "error",
      });
      return;
    }

    await runAction(
      `Purchasing ${selectedCategory.ticketType} ticket...`,
      "Ticket purchased successfully. You can now find it in My Tickets.",
      async ({ contract }) => {
        const tx = await contract.purchaseTicket(
          selectedEvent.eventId,
          selectedCategory.categoryId,
          { value: selectedCategory.price }
        );
        await tx.wait();
      }
    );
  }

  async function handleRedeem(tokenId: number) {
    await runAction(
      `Redeeming ticket #${tokenId}...`,
      `Ticket #${tokenId} redeemed.`,
      async ({ contract }) => {
        const tx = await contract.redeem(tokenId);
        await tx.wait();
      }
    );
  }

  async function handleTransfer(tokenId: number) {
    const recipient = transferTargets[tokenId]?.trim() ?? "";

    if (!recipient) {
      setNotice({
        message: "Enter a recipient wallet address before transferring.",
        tone: "error",
      });
      return;
    }

    if (!isValidWalletAddress(recipient)) {
      setNotice({
        message: "Enter a valid Ethereum wallet address.",
        tone: "error",
      });
      return;
    }

    if (recipient.toLowerCase() === walletAddress.toLowerCase()) {
      setNotice({
        message: "That ticket is already owned by this wallet.",
        tone: "error",
      });
      return;
    }

    await runAction(
      `Transferring ticket #${tokenId}...`,
      `Ticket #${tokenId} transferred.`,
      async ({ contract, signerAddress }) => {
        const tx = await contract.transferFrom(
          signerAddress,
          recipient,
          tokenId
        );
        await tx.wait();
      }
    );
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const eventName = eventForm.name.trim();

    if (!eventName) {
      setNotice({
        message: "Enter an event name before creating the event.",
        tone: "error",
      });
      return;
    }

    await runAction(
      "Creating event...",
      "Event created. It now appears in the Events view.",
      async ({ contract }) => {
        const tx = await contract.createEvent(eventName);
        await tx.wait();
        setEventForm(initialEventForm);
        setActiveView("events");
      }
    );
  }

  function setTransferTarget(tokenId: number, value: string) {
    setTransferTargets((current) => ({
      ...current,
      [tokenId]: value,
    }));
  }

  return (
    <main className="site-shell">
      <header className="masthead">
        <div className="hero-card">
          <p className="eyebrow">TicketNFTs</p>
          <h1 className="hero-title">TicketNFTs</h1>
          <p className="hero-lead">ERC-721 ticketing prototype.</p>
          <p className="hero-copy">
            Browse events, buy tickets, and manage them from your wallet.
          </p>

          <div className="metric-row">
            <article className="metric-card">
              <p className="metric-label">Events</p>
              <p className="metric-value">{metrics.availableEvents}</p>
            </article>
            <article className="metric-card">
              <p className="metric-label">Categories</p>
              <p className="metric-value">{metrics.ticketCategories}</p>
            </article>
            <article className="metric-card">
              <p className="metric-label">Inventory Left</p>
              <p className="metric-value">
                {metrics.totalInventoryRemaining.toString()}
              </p>
            </article>
            <article className="metric-card">
              <p className="metric-label">My Tickets</p>
              <p className="metric-value">{metrics.ownedTickets}</p>
            </article>
          </div>
        </div>

        <aside className="wallet-card">
          <div className="wallet-header">
            <div>
              <p className="eyebrow">Wallet</p>
              <h2>Wallet & Contract</h2>
              <p className="wallet-copy">Current local connection details.</p>
            </div>
            <span className={`pill ${isOrganizer ? "success" : "neutral"}`}>
              {isOrganizer ? "Organizer enabled" : "Buyer mode"}
            </span>
          </div>

          <div className="wallet-grid">
            <div>
              <p className="detail-label">Connected wallet</p>
              <p className="detail-value">
                {walletAddress
                  ? shortenAddress(walletAddress)
                  : "Not connected"}
              </p>
            </div>
            <div>
              <p className="detail-label">Contract owner</p>
              <p className="detail-value">
                {ownerAddress ? shortenAddress(ownerAddress) : "Unknown"}
              </p>
            </div>
            <div className="wallet-span">
              <p className="detail-label">Contract address</p>
              <p className="detail-value wrap">
                {CONFIGURED_CONTRACT_ADDRESS || "Not configured"}
              </p>
            </div>
            <div>
              <p className="detail-label">Chain ID</p>
              <p className="detail-value">{chainId || "Unknown"}</p>
            </div>
            <div>
              <p className="detail-label">Sync status</p>
              <p className="detail-value">
                {isRefreshing ? "Refreshing…" : "Ready"}
              </p>
            </div>
          </div>

          <div className="button-row">
            <button
              onClick={() => void handleConnectWallet()}
              disabled={isBusy}
            >
              Connect wallet
            </button>
            <button
              className="button-secondary"
              onClick={() => void syncWallet(true)}
              disabled={isBusy || isRefreshing}
              type="button"
            >
              Refresh data
            </button>
          </div>
        </aside>
      </header>

      <section className={`notice-banner ${notice.tone}`}>
        <p className="notice-label">{busyLabel || "Status"}</p>
        <p>{notice.message}</p>
      </section>

      <nav className="view-nav" aria-label="Primary views">
        <button
          className={activeView === "events" ? "nav-pill active" : "nav-pill"}
          onClick={() => setActiveView("events")}
          type="button"
        >
          Events
        </button>
        <button
          className={activeView === "tickets" ? "nav-pill active" : "nav-pill"}
          onClick={() => setActiveView("tickets")}
          type="button"
        >
          My Tickets
        </button>
        <button
          className={
            activeView === "organizer" ? "nav-pill active" : "nav-pill"
          }
          onClick={() => setActiveView("organizer")}
          type="button"
        >
          Organizer
        </button>
      </nav>

      {!walletAddress ? (
        <section className="empty-state">
          <p className="eyebrow">Getting Started</p>
          <h2>Connect MetaMask to load your local TicketNFTs data.</h2>
          <p className="support-copy">
            This frontend keeps the local wallet flow from the original demo, so
            event browsing and ticket ownership reflect the currently connected
            account on your local Hardhat deployment.
          </p>
        </section>
      ) : null}

      {walletAddress && activeView === "events" ? (
        <EventsView
          events={events}
          isBusy={isBusy}
          onPurchase={handlePurchase}
          onSelectCategory={setSelectedCategoryId}
          onSelectEvent={setSelectedEventId}
          selectedCategoryId={selectedCategoryId}
          selectedEvent={selectedEvent}
          selectedEventId={selectedEventId}
        />
      ) : null}

      {walletAddress && activeView === "tickets" ? (
        <MyTicketsView
          isBusy={isBusy}
          onRedeem={handleRedeem}
          onTransfer={handleTransfer}
          setTransferTarget={setTransferTarget}
          tickets={tickets}
          transferTargets={transferTargets}
        />
      ) : null}

      {walletAddress && activeView === "organizer" ? (
        <OrganizerView
          categoryForm={categoryForm}
          events={events}
          eventForm={eventForm}
          isBusy={isBusy}
          isOrganizer={isOrganizer}
          metadataHint={metadataHint}
          onCreateEvent={handleCreateEvent}
          setCategoryForm={setCategoryForm}
          setEventForm={setEventForm}
        />
      ) : null}
    </main>
  );
}

export default App;
