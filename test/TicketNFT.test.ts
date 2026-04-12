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

    await ticketNFT.connect(owner).mintTicket(user.address, "ipfs://ticket-0");

    expect(await ticketNFT.ownerOf(0)).to.equal(user.address);
  });

  it("stores and returns token URI", async function () {
    const { ticketNFT, owner, user } = await deployTicketNFT();

    await ticketNFT.connect(owner).mintTicket(user.address, "ipfs://ticket-0");

    expect(await ticketNFT.tokenURI(0)).to.equal("ipfs://ticket-0");
  });

  it("allows the owner of a ticket to redeem it once", async function () {
    const { ticketNFT, owner, user } = await deployTicketNFT();

    await ticketNFT.connect(owner).mintTicket(user.address, "ipfs://ticket-0");
    await ticketNFT.connect(user).redeem(0);

    expect(await ticketNFT.isRedeemed(0)).to.equal(true);
  });

  it("rejects redeeming the same ticket twice", async function () {
    const { ticketNFT, owner, user } = await deployTicketNFT();

    await ticketNFT.connect(owner).mintTicket(user.address, "ipfs://ticket-0");
    await ticketNFT.connect(user).redeem(0);

    await expect(ticketNFT.connect(user).redeem(0)).to.be.revertedWith(
      "Ticket already redeemed"
    );
  });

  it("rejects redemption by non-owner", async function () {
    const { ticketNFT, owner, user, otherUser } = await deployTicketNFT();

    await ticketNFT.connect(owner).mintTicket(user.address, "ipfs://ticket-0");

    await expect(ticketNFT.connect(otherUser).redeem(0)).to.be.revertedWith(
      "Not ticket owner"
    );
  });
});