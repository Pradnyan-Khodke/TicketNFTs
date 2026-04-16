
import { useState } from "react";
import { getContract } from "./contract";

function App() {
  const [tokenId, setTokenId] = useState("");
  const [info, setInfo] = useState<any>(null);
  const [toAddress, setToAddress] = useState("");

  async function connectWallet() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }

  async function mint() {
    const contract = await getContract();
    await contract.mintTicket(
      await contract.runner.getAddress(),
      "ipfs://demo",
      1,
      "VIP"
    );

    await tx.wait();

    alert("Minted!");
  }

  async function redeem() {
    const contract = await getContract();
    await contract.redeem(Number(tokenId));

    await tx.wait();

    alert("Redeemed!");
  }

  async function checkOwner() {
    const contract = await getContract();
    const owner = await contract.ownerOf(Number(tokenId));
    alert("Owner: " + owner);
  }


  async function transfer() {
    const contract = await getContract();
    const signerAddress = await contract.runner.getAddress();
  
    await contract.transferFrom(
      signerAddress,
      toAddress,
      Number(tokenId)
    );

    await tx.wait();
  
    alert("Transferred!");
  }

  async function fetchInfo() {
    const contract = await getContract();
    const data = await contract.getTicketInfo(Number(tokenId));
    setInfo(data);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>TicketNFT Demo</h1>

      <button onClick={connectWallet}>Connect Wallet</button>

      <h2>Mint Ticket</h2>
      <button onClick={mint}>Mint My Ticket</button>

      <h2>Check Ticket</h2>
      <input
        placeholder="Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
      />
      <button onClick={fetchInfo}>Get Info</button>

      <button onClick={checkOwner}>Check Owner</button>
      

      {info && (
        <div>
          <p>Event ID: {info[0].toString()}</p>
          <p>Type: {info[1]}</p>
          <p>Redeemed: {info[2] ? "Yes" : "No"}</p>
        </div>
      )}

      <h2>Redeem</h2>
      <button onClick={redeem}>Redeem Ticket</button>

      <h2>Transfer Ticket</h2>
      <input
        placeholder="Recipient address"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
      />
      <button onClick={transfer}>Transfer</button>
    </div>
  );
}

export default App;