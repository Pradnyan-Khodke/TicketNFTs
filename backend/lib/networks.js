export function getRpcUrl(networkName) {
  if (networkName === "localhost") {
    return "http://127.0.0.1:8545";
  }

  if (networkName === "sepolia") {
    const rpcUrl = process.env.SEPOLIA_RPC_URL?.trim();

    if (!rpcUrl) {
      throw new Error("SEPOLIA_RPC_URL is not set.");
    }

    return rpcUrl;
  }

  throw new Error(`Unsupported network: ${networkName}`);
}
