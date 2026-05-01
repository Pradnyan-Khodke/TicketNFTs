export async function uploadJsonToPinata(name, payload, jwt) {
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
        pinataMetadata: { name },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok || !data.IpfsHash) {
    throw new Error(data.error ?? "Failed to upload metadata JSON.");
  }

  return `ipfs://${data.IpfsHash}`;
}

export async function uploadFileToPinata(fileName, contents, contentType, jwt) {
  const body = new FormData();
  body.append("file", new Blob([contents], { type: contentType }), fileName);
  body.append("pinataMetadata", JSON.stringify({ name: fileName }));

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body,
    },
  );

  const data = await response.json();

  if (!response.ok || !data.IpfsHash) {
    throw new Error(data.error ?? "Failed to upload file.");
  }

  return `ipfs://${data.IpfsHash}`;
}
