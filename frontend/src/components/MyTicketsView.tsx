import type { TicketRecord } from "../contract";

type MyTicketsViewProps = {
  isBusy: boolean;
  onRedeem: (tokenId: number) => void | Promise<void>;
  onTransfer: (tokenId: number) => void | Promise<void>;
  setTransferTarget: (tokenId: number, value: string) => void;
  tickets: TicketRecord[];
  transferTargets: Record<number, string>;
};

function getStatusLabel(ticket: TicketRecord) {
  if (ticket.redeemed) {
    return "Redeemed";
  }

  return ticket.eventActive ? "Active ticket" : "Issued ticket";
}

export function MyTicketsView({
  isBusy,
  onRedeem,
  onTransfer,
  setTransferTarget,
  tickets,
  transferTargets,
}: MyTicketsViewProps) {
  return (
    <section className="stack">
      <div className="section-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">My Tickets</p>
            <h2>Your tickets</h2>
          </div>
          <p className="support-copy">Redeem or transfer active tickets.</p>
        </div>

        {tickets.length === 0 ? (
          <div className="empty-inline">
            <p>This wallet does not own any tickets yet.</p>
          </div>
        ) : (
          <div className="ticket-grid">
            {tickets.map((ticket) => (
              <article className="ticket-card" key={ticket.tokenId}>
                <div className="event-card-header">
                  <div>
                    <p className="card-kicker">Token #{ticket.tokenId}</p>
                    <h3>{ticket.metadataName ?? ticket.eventName}</h3>
                  </div>
                  <span
                    className={`pill ${
                      ticket.redeemed ? "neutral" : "success"
                    }`}
                  >
                    {getStatusLabel(ticket)}
                  </span>
                </div>

                {ticket.imageUrl ? (
                  <div className="ticket-media">
                    <img
                      alt={ticket.metadataName ?? `${ticket.ticketType} ticket`}
                      className="ticket-image"
                      src={ticket.imageUrl}
                    />
                  </div>
                ) : ticket.metadataStatus === "loaded" ? (
                  <div className="ticket-media ticket-fallback">
                    <p className="detail-label">Image unavailable</p>
                    <p className="support-copy">No image found in metadata.</p>
                  </div>
                ) : ticket.metadataStatus === "error" ? (
                  <div className="ticket-media ticket-fallback">
                    <p className="detail-label">Metadata unavailable</p>
                    <p className="support-copy">
                      Could not load metadata from the gateway.
                    </p>
                  </div>
                ) : null}

                {ticket.metadataDescription ? (
                  <p className="support-copy">{ticket.metadataDescription}</p>
                ) : ticket.metadataStatus === "loaded" ? (
                  <p className="support-copy">No description provided.</p>
                ) : null}

                <div className="ticket-details">
                  <div>
                    <p className="detail-label">Ticket type</p>
                    <p className="detail-value">{ticket.ticketType}</p>
                  </div>
                  <div>
                    <p className="detail-label">Event ID</p>
                    <p className="detail-value">{ticket.eventId}</p>
                  </div>
                  <div>
                    <p className="detail-label">Category ID</p>
                    <p className="detail-value">{ticket.categoryId}</p>
                  </div>
                  <div>
                    <p className="detail-label">Owner</p>
                    <p className="detail-value wrap">{ticket.owner}</p>
                  </div>
                  <div className="ticket-uri">
                    <p className="detail-label">Token URI</p>
                    <p className="detail-value wrap">{ticket.tokenURI}</p>
                  </div>
                  {ticket.metadataUrl ? (
                    <div className="ticket-uri">
                      <p className="detail-label">Resolved metadata</p>
                      <p className="detail-value wrap">{ticket.metadataUrl}</p>
                    </div>
                  ) : null}
                </div>

                <div className="ticket-actions">
                  <button
                    disabled={isBusy || ticket.redeemed}
                    onClick={() => void onRedeem(ticket.tokenId)}
                    type="button"
                  >
                    Redeem ticket
                  </button>

                  <div className="transfer-form">
                    <label htmlFor={`transfer-${ticket.tokenId}`}>
                      Transfer to
                    </label>
                    <input
                      id={`transfer-${ticket.tokenId}`}
                      onChange={(event) =>
                        setTransferTarget(ticket.tokenId, event.target.value)
                      }
                      placeholder="0x..."
                      value={transferTargets[ticket.tokenId] ?? ""}
                    />
                    <button
                      className="button-secondary"
                      disabled={isBusy || ticket.redeemed}
                      onClick={() => void onTransfer(ticket.tokenId)}
                      type="button"
                    >
                      Transfer ticket
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
