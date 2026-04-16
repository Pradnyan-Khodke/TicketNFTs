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

  it("allows the new owner to redeem after transfer before redemption", async function () {
    const { ticketNFT, owner, user, otherUser } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 1, "VIP");

    await ticketNFT
      .connect(user)
      .transferFrom(user.address, otherUser.address, 0);

    expect(await ticketNFT.ownerOf(0)).to.equal(otherUser.address);

    await ticketNFT.connect(otherUser).redeem(0);

    expect(await ticketNFT.isRedeemed(0)).to.equal(true);
  });

  it("rejects redemption by the old owner after transfer", async function () {
    const { ticketNFT, owner, user, otherUser } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 1, "VIP");

    await ticketNFT
      .connect(user)
      .transferFrom(user.address, otherUser.address, 0);

    await expect(ticketNFT.connect(user).redeem(0)).to.be.revertedWith(
      "Not ticket owner"
    );
  });

  it("preserves ticket info after transfer", async function () {
    const { ticketNFT, owner, user, otherUser } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 42, "General");

    await ticketNFT
      .connect(user)
      .transferFrom(user.address, otherUser.address, 0);

    const ticketInfo = await ticketNFT.getTicketInfo(0);

    expect(ticketInfo[0]).to.equal(42n);
    expect(ticketInfo[1]).to.equal("General");
    expect(ticketInfo[2]).to.equal(false);
    expect(await ticketNFT.ownerOf(0)).to.equal(otherUser.address);
  });

  it("shows redeemed status after transfer then redemption by new owner", async function () {
    const { ticketNFT, owner, user, otherUser } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 9, "VIP");

    await ticketNFT
      .connect(user)
      .transferFrom(user.address, otherUser.address, 0);

    await ticketNFT.connect(otherUser).redeem(0);

    const ticketInfo = await ticketNFT.getTicketInfo(0);

    expect(ticketInfo[0]).to.equal(9n);
    expect(ticketInfo[1]).to.equal("VIP");
    expect(ticketInfo[2]).to.equal(true);
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

  it("rejects transfer after redemption even for a new owner", async function () {
    const { ticketNFT, owner, user, otherUser } = await deployTicketNFT();

    await ticketNFT
      .connect(owner)
      .mintTicket(user.address, "ipfs://ticket-0", 1, "VIP");

    await ticketNFT
      .connect(user)
      .transferFrom(user.address, otherUser.address, 0);

    await ticketNFT.connect(otherUser).redeem(0);

    await expect(
      ticketNFT.connect(otherUser).transferFrom(otherUser.address, user.address, 0)
    ).to.be.revertedWith("Redeemed ticket cannot be transferred");
  });

  it("rejects getTicketInfo for a nonexistent token", async function () {
    const { ticketNFT } = await deployTicketNFT();

    await expect(ticketNFT.getTicketInfo(999)).to.be.revertedWithCustomError(
      ticketNFT,
      "ERC721NonexistentToken"
    ).withArgs(999);
  });

  it("rejects tokenURI for a nonexistent token", async function () {
    const { ticketNFT } = await deployTicketNFT();

    await expect(ticketNFT.tokenURI(999)).to.be.revertedWithCustomError(
      ticketNFT,
      "ERC721NonexistentToken"
    ).withArgs(999);
  });

  it("only allows the contract owner to mint", async function () {
    const { ticketNFT, user } = await deployTicketNFT();

    await expect(
      ticketNFT
        .connect(user)
        .mintTicket(user.address, "ipfs://ticket-0", 1, "VIP")
    ).to.be.revertedWithCustomError(
      ticketNFT,
      "OwnableUnauthorizedAccount"
    ).withArgs(user.address);
  });
});