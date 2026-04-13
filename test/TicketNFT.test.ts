import { expect } from "chai";
import hre from "hardhat";

describe("TicketNFT", function () {
  async function deployTicketNFT() {
    const { ethers } = await hre.network.connect();
    const [owner, user, otherUser] = await ethers.getSigners();
    const TicketNFT = await ethers.getContractFactory("TicketNFT");
    const ticketNFT = await TicketNFT.deploy(owner.address);
    await ticketNFT.waitForDeployment();
    return { ticketNFT, owner, user, otherUser };
  }

  it("mints a ticket to a user", async function () {
    const { ticketNFT, owner, user } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 1, "VIP");

    expect(await ticketNFT.ownerOf(0)).to.equal(user.address);
  });

  it("stores and returns token URI", async function () {
    const { ticketNFT, owner, user } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 1, "VIP");

    expect(await ticketNFT.tokenURI(0)).to.equal("ipfs://ticket-0");
  });

  it("stores ticket event data correctly", async function () {
    const { ticketNFT, owner, user } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 42, "General");

    const ticketInfo = await ticketNFT.getTicketInfo(0);

    expect(ticketInfo[0]).to.equal(42n);
    expect(ticketInfo[1]).to.equal("General");
    expect(ticketInfo[2]).to.equal(false);
  });

  it("allows the owner of a ticket to redeem it once", async function () {
    const { ticketNFT, owner, user } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 1, "VIP");

    await ticketNFT.connect(user).redeem(0);

    expect(await ticketNFT.isRedeemed(0)).to.equal(true);
  });

  it("getTicketInfo shows redeemed status after redemption", async function () {
    const { ticketNFT, owner, user } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 7, "VIP");

    await ticketNFT.connect(user).redeem(0);

    const ticketInfo = await ticketNFT.getTicketInfo(0);

    expect(ticketInfo[0]).to.equal(7n);
    expect(ticketInfo[1]).to.equal("VIP");
    expect(ticketInfo[2]).to.equal(true);
  });

  it("rejects redeeming the same ticket twice", async function () {
    const { ticketNFT, owner, user } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 1, "VIP");

    await ticketNFT.connect(user).redeem(0);

    await expect(ticketNFT.connect(user).redeem(0)).to.be.revertedWith(
      "Ticket already redeemed"
    );
  });

  it("rejects redemption by non-owner", async function () {
    const { ticketNFT, owner, user, otherUser } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 1, "VIP");

    await expect(ticketNFT.connect(otherUser).redeem(0)).to.be.revertedWith(
      "Not ticket owner"
    );
  });

  it("allows transfer before redemption", async function () {
    const { ticketNFT, owner, user, otherUser } = await deployTicketNFT();
  
    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 1, "VIP");
  
    await ticketNFT
      .connect(user)
      .transferFrom(user.address, otherUser.address, 0);
  
    expect(await ticketNFT.ownerOf(0)).to.equal(otherUser.address);
  });

  it("rejects transfer after redemption", async function () {
    const { ticketNFT, owner, user, otherUser } = await deployTicketNFT();
  
    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 1, "VIP");
  
    await ticketNFT.connect(user).redeem(0);
  
    await expect(
      ticketNFT.connect(user).transferFrom(user.address, otherUser.address, 0)
    ).to.be.revertedWith("Redeemed ticket cannot be transferred");
  });
  
});