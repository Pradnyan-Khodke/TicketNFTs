import { formatPrice, type EventRecord } from "../contract";

type EventsViewProps = {
  events: EventRecord[];
  isBusy: boolean;
  onPurchase: () => void | Promise<void>;
  onSelectCategory: (categoryId: number) => void;
  onSelectEvent: (eventId: number) => void;
  selectedCategoryId: number | null;
  selectedEvent: EventRecord | null;
  selectedEventId: number | null;
};

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getEventRemaining(event: EventRecord) {
  return event.categories.reduce((total, category) => total + category.remaining, 0n);
}

function getStartingPrice(event: EventRecord) {
  if (event.categories.length === 0) {
    return null;
  }

  return event.categories.reduce(
    (lowest, category) => (category.price < lowest ? category.price : lowest),
    event.categories[0].price,
  );
}

export function EventsView({
  events,
  isBusy,
  onPurchase,
  onSelectCategory,
  onSelectEvent,
  selectedCategoryId,
  selectedEvent,
  selectedEventId,
}: EventsViewProps) {
  const selectedCategory =
    selectedEvent?.categories.find(
      (category) => category.categoryId === selectedCategoryId,
    ) ?? null;

  return (
    <section className="content-grid">
      <div className="stack">
        <div className="section-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Events</p>
              <h2>Browse available events</h2>
            </div>
            <p className="support-copy">
              Select an event to inspect ticket classes and purchase from live
              inventory.
            </p>
          </div>

          {events.length === 0 ? (
            <div className="empty-inline">
              <p>No events exist yet. Create one from the Organizer view.</p>
            </div>
          ) : (
            <div className="event-list">
              {events.map((event) => {
                const startingPrice = getStartingPrice(event);
                const remaining = getEventRemaining(event);

                return (
                  <button
                    key={event.eventId}
                    className={
                      selectedEventId === event.eventId
                        ? "event-card selected"
                        : "event-card"
                    }
                    onClick={() => onSelectEvent(event.eventId)}
                    type="button"
                  >
                    <div className="event-card-header">
                      <div>
                        <p className="card-kicker">Event #{event.eventId}</p>
                        <h3>{event.name}</h3>
                      </div>
                      <span
                        className={`pill ${event.active ? "success" : "neutral"}`}
                      >
                        {event.active ? "On sale" : "Inactive"}
                      </span>
                    </div>

                    <p className="support-copy">
                      Organizer {shortenAddress(event.organizer)}
                    </p>

                    <div className="event-meta">
                      <span>{event.categories.length} categories</span>
                      <span>{remaining.toString()} tickets left</span>
                      <span>
                        {startingPrice === null
                          ? "No pricing yet"
                          : `From ${formatPrice(startingPrice)}`}
                      </span>
                    </div>

                    <div className="category-chip-row">
                      {event.categories.length === 0 ? (
                        <span className="category-chip muted">
                          No ticket classes yet
                        </span>
                      ) : (
                        event.categories.map((category) => (
                          <span
                            className="category-chip"
                            key={`${event.eventId}-${category.categoryId}`}
                          >
                            {category.ticketType} · {category.remaining.toString()}/
                            {category.maxSupply.toString()}
                          </span>
                        ))
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="stack">
        <div className="section-card detail-pane">
          {selectedEvent ? (
            <>
              <div className="section-header">
                <div>
                  <p className="eyebrow">Event Details</p>
                  <h2>{selectedEvent.name}</h2>
                </div>
                <span
                  className={`pill ${selectedEvent.active ? "success" : "neutral"}`}
                >
                  {selectedEvent.active ? "Purchasing enabled" : "Inactive"}
                </span>
              </div>

              <div className="detail-grid">
                <article className="detail-panel">
                  <p className="detail-label">Organizer</p>
                  <p className="detail-value wrap">{selectedEvent.organizer}</p>
                </article>
                <article className="detail-panel">
                  <p className="detail-label">Categories</p>
                  <p className="detail-value">{selectedEvent.categories.length}</p>
                </article>
                <article className="detail-panel">
                  <p className="detail-label">Inventory Remaining</p>
                  <p className="detail-value">
                    {getEventRemaining(selectedEvent).toString()}
                  </p>
                </article>
                <article className="detail-panel">
                  <p className="detail-label">Starting Price</p>
                  <p className="detail-value">
                    {getStartingPrice(selectedEvent) === null
                      ? "Not set"
                      : formatPrice(getStartingPrice(selectedEvent)!)}
                  </p>
                </article>
              </div>

              <div className="section-subheader">
                <h3>Choose a ticket category</h3>
                <p className="support-copy">
                  Purchase mints the NFT directly to the connected wallet.
                </p>
              </div>

              {selectedEvent.categories.length === 0 ? (
                <div className="empty-inline">
                  <p>This event has no ticket categories yet.</p>
                </div>
              ) : (
                <>
                  <div className="category-grid">
                    {selectedEvent.categories.map((category) => {
                      const isSelected =
                        selectedCategoryId === category.categoryId;

                      return (
                        <button
                          className={
                            isSelected
                              ? "category-card selected"
                              : "category-card"
                          }
                          key={category.categoryId}
                          onClick={() => onSelectCategory(category.categoryId)}
                          type="button"
                        >
                          <div className="event-card-header">
                            <div>
                              <p className="card-kicker">
                                Category #{category.categoryId}
                              </p>
                              <h3>{category.ticketType}</h3>
                            </div>
                            <span
                              className={`pill ${
                                category.remaining > 0n ? "success" : "neutral"
                              }`}
                            >
                              {category.remaining > 0n ? "Available" : "Sold out"}
                            </span>
                          </div>

                          <div className="event-meta">
                            <span>{formatPrice(category.price)}</span>
                            <span>
                              {category.minted.toString()}/
                              {category.maxSupply.toString()} sold
                            </span>
                            <span>{category.remaining.toString()} remaining</span>
                          </div>

                          <p className="support-copy wrap">
                            Metadata {category.metadataURI}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="purchase-panel">
                    <div>
                      <p className="detail-label">Selected category</p>
                      <p className="detail-value">
                        {selectedCategory
                          ? `${selectedCategory.ticketType} · ${formatPrice(
                              selectedCategory.price,
                            )}`
                          : "Choose a category"}
                      </p>
                    </div>

                    <button
                      disabled={
                        isBusy ||
                        !selectedCategory ||
                        !selectedEvent.active ||
                        selectedCategory.remaining === 0n
                      }
                      onClick={() => void onPurchase()}
                      type="button"
                    >
                      Purchase ticket
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="empty-inline">
              <p>Select an event to view its ticket classes.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
