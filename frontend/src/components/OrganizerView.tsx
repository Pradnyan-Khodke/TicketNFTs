import type { FormEvent } from "react";
import type { EventRecord } from "../contract";

type EventFormState = {
  name: string;
};

type CategoryFormState = {
  eventId: string;
  maxSupply: string;
  priceEth: string;
  ticketType: string;
};

type OrganizerViewProps = {
  categoryForm: CategoryFormState;
  events: EventRecord[];
  eventForm: EventFormState;
  isBusy: boolean;
  isOrganizer: boolean;
  metadataHint: {
    dryRun: string;
    eventName: string;
    liveRun: string;
  } | null;
  onCreateEvent: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  setCategoryForm: (
    updater: (current: CategoryFormState) => CategoryFormState
  ) => void;
  setEventForm: (next: EventFormState) => void;
};

export function OrganizerView({
  categoryForm,
  events,
  eventForm,
  isBusy,
  isOrganizer,
  metadataHint,
  onCreateEvent,
  setCategoryForm,
  setEventForm,
}: OrganizerViewProps) {
  return (
    <section className="content-grid organizer-layout">
      <div className="stack">
        <div className="section-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Organizer</p>
              <h2>Create event inventory</h2>
            </div>
            <p className="support-copy">Create events and category commands.</p>
          </div>

          {!isOrganizer ? (
            <div className="empty-inline">
              <p>
                This wallet is not approved to create events. Connect the
                contract owner or an approved organizer account.
              </p>
            </div>
          ) : (
            <form
              className="form-card"
              onSubmit={(event) => void onCreateEvent(event)}
            >
              <label htmlFor="event-name">Event name</label>
              <input
                id="event-name"
                onChange={(event) => setEventForm({ name: event.target.value })}
                placeholder="Campus Concert Night"
                value={eventForm.name}
              />

              <button disabled={isBusy} type="submit">
                Create event
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="stack">
        <div className="section-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Ticket Classes</p>
              <h2>Define inventory and pricing</h2>
            </div>
            <p className="support-copy">
              Set the ticket type, price, and supply, then run the generated
              command.
            </p>
          </div>

          {!isOrganizer ? (
            <div className="empty-inline">
              <p>Organizer access is required to create ticket categories.</p>
            </div>
          ) : events.length === 0 ? (
            <div className="empty-inline">
              <p>Create an event first, then add ticket categories here.</p>
            </div>
          ) : (
            <div className="form-card">
              <label htmlFor="category-event">Event</label>
              <select
                id="category-event"
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    eventId: event.target.value,
                  }))
                }
                value={categoryForm.eventId}
              >
                {events.map((event) => (
                  <option key={event.eventId} value={event.eventId}>
                    #{event.eventId} {event.name}
                  </option>
                ))}
              </select>

              <div className="two-column-form">
                <div>
                  <label htmlFor="ticket-type">Ticket category</label>
                  <input
                    id="ticket-type"
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        ticketType: event.target.value,
                      }))
                    }
                    placeholder="VIP"
                    value={categoryForm.ticketType}
                  />
                </div>

                <div>
                  <label htmlFor="max-supply">Max supply</label>
                  <input
                    id="max-supply"
                    inputMode="numeric"
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        maxSupply: event.target.value,
                      }))
                    }
                    placeholder="100"
                    value={categoryForm.maxSupply}
                  />
                </div>
              </div>
              <label htmlFor="price-eth">Price in ETH</label>
              <input
                id="price-eth"
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    priceEth: event.target.value,
                  }))
                }
                placeholder="0.01"
                value={categoryForm.priceEth}
              />

              <p className="support-copy">
                Categories are created by the metadata script.
              </p>
            </div>
          )}
        </div>

        {isOrganizer && metadataHint ? (
          <div className="section-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Metadata Script</p>
                <h2>Metadata commands</h2>
              </div>
              <p className="support-copy">
                Event #{categoryForm.eventId} {metadataHint.eventName}
              </p>
            </div>

            <div className="hint-panel">
              <p className="detail-label">Dry run</p>
              <pre className="command-block">{metadataHint.dryRun}</pre>
              <p className="support-copy">Generates files locally only.</p>
            </div>

            <div className="hint-panel">
              <p className="detail-label">
                Upload image, upload metadata, and create category
              </p>
              <pre className="command-block">{metadataHint.liveRun}</pre>
              <p className="support-copy">
                Uploads metadata and creates the category.
              </p>
            </div>

            <p className="support-copy">
              Optional: add `--description` or `--image-path`.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
