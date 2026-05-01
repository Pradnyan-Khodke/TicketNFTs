function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function createTicketSvg({
  eventId,
  eventName,
  maxSupply,
  priceEth,
  ticketType,
  transferable,
}) {
  const transferLabel = transferable ? "TRANSFERABLE" : "SOUL-BOUND";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Ticket NFT">
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
  <text x="86" y="208" fill="#FFFFFF" font-family="'Space Grotesk', 'IBM Plex Sans', sans-serif" font-size="72" font-weight="700">${escapeXml(
    ticketType,
  )}</text>
  <text x="86" y="272" fill="rgba(255,255,255,0.88)" font-family="'IBM Plex Sans', sans-serif" font-size="34">${escapeXml(
    eventName,
  )}</text>
  <text x="86" y="376" fill="#E4D7FF" font-family="'IBM Plex Sans', sans-serif" font-size="22" letter-spacing="2">EVENT ID</text>
  <text x="86" y="414" fill="#FFFFFF" font-family="'IBM Plex Sans', sans-serif" font-size="34" font-weight="700">${eventId}</text>
  <text x="330" y="376" fill="#E4D7FF" font-family="'IBM Plex Sans', sans-serif" font-size="22" letter-spacing="2">PRICE</text>
  <text x="330" y="414" fill="#FFFFFF" font-family="'IBM Plex Sans', sans-serif" font-size="34" font-weight="700">${escapeXml(
    priceEth,
  )} ETH</text>
  <text x="580" y="376" fill="#E4D7FF" font-family="'IBM Plex Sans', sans-serif" font-size="22" letter-spacing="2">MAX SUPPLY</text>
  <text x="580" y="414" fill="#FFFFFF" font-family="'IBM Plex Sans', sans-serif" font-size="34" font-weight="700">${maxSupply}</text>
  <text x="86" y="470" fill="#E4D7FF" font-family="'IBM Plex Sans', sans-serif" font-size="22" letter-spacing="2">TRANSFERABILITY</text>
  <text x="86" y="508" fill="#FFFFFF" font-family="'IBM Plex Sans', sans-serif" font-size="34" font-weight="700">${transferLabel}</text>
</svg>`;
}
