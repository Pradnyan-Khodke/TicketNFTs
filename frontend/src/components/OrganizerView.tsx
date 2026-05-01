import type { ComponentProps } from "react";
import type { EventRecord } from "../contract";

type EventFormState = {
  name: string;
};

type CategoryFormState = {
  description: string;
  eventId: string;
  maxSupply: string;
  priceEth: string;
  ticketType: string;
  transferable: boolean;
};

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;

type OrganizerViewProps = {
  categoryForm: CategoryFormState;
  events: EventRecord[];
  eventForm: EventFormState;
  isBusy: boolean;
  isOrganizer: boolean;
  onCreateCategory: FormSubmitHandler;
  onCreateEvent: FormSubmitHandler;
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
  onCreateCategory,
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
            <p className="support-copy">Create events and upload metadata-backed categories.</p>
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
              <h2>Create a category</h2>
            </div>
            <p className="support-copy">
              The backend uploads the image and metadata, then your wallet signs
              the on-chain category transaction.
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
            <form
              className="form-card"
              onSubmit={(event) => void onCreateCategory(event)}
            >
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

              <label htmlFor="category-description">
                Description (optional)
              </label>
              <textarea
                id="category-description"
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="VIP entry for the main event floor."
                rows={3}
                value={categoryForm.description}
              />

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

              <label className="checkbox-row" htmlFor="category-transferable">
                <input
                  checked={categoryForm.transferable}
                  id="category-transferable"
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      transferable: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span>Transferable before redemption</span>
              </label>

              <button disabled={isBusy} type="submit">
                Upload metadata and create category
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
