function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildCategoryFileBaseName({
  eventId,
  eventName,
  ticketType,
  categoryId,
}) {
  const slug = slugify(`${eventName}-${ticketType}-event-${eventId}`);
  return `${slug}-category-${categoryId}`;
}

export function buildCategoryMetadata({
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
}) {
  return {
    name: `${eventName} - ${ticketType} Ticket`,
    description:
      typeof description === "string" && description.trim().length > 0
        ? description.trim()
        : `${ticketType} ticket for ${eventName}.`,
    image: imageUri,
    attributes: [
      { trait_type: "Event Name", value: eventName },
      { trait_type: "Event ID", value: eventId },
      { trait_type: "Ticket Type", value: ticketType },
      { trait_type: "Category ID", value: categoryId },
      { trait_type: "Price (ETH)", value: priceEth },
      { trait_type: "Max Supply", value: maxSupply },
      {
        trait_type: "Transferability",
        value: transferable ? "transferable" : "soul-bound",
      },
      { trait_type: "Organizer", value: organizer },
      { trait_type: "Event Active", value: active ? "true" : "false" },
    ],
  };
}
