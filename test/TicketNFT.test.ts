import { expect } from "chai";
import hre from "hardhat";

describe("TicketNFT", function () {
  async function deployTicketNFT() {
    const { ethers } = await hre.network.connect();
    const [owner, organizer, user, otherUser] = await ethers.getSigners();
    const TicketNFT = await ethers.getContractFactory("TicketNFT");
    const ticketNFT = await TicketNFT.deploy(owner.address);
    await ticketNFT.waitForDeployment();

    return { ticketNFT, owner, organizer, user, otherUser };
  }

  async function createEventWithCategory() {
    const { ticketNFT, owner, organizer, user, otherUser } =
      await deployTicketNFT();
    const price = 100n;

    await ticketNFT.connect(owner).setOrganizer(organizer.address, true);
    await ticketNFT.connect(organizer).createEvent("Spring Showcase");
    await ticketNFT
      .connect(organizer)
      .createCategory(0, "VIP", "ipfs://vip-ticket", price, 2);

    return { ticketNFT, owner, organizer, user, otherUser, price };
  }

  async function purchaseVipTicket() {
    const setup = await createEventWithCategory();

    await setup.ticketNFT.connect(setup.user).purchaseTicket(0, 0, {
      value: setup.price,
    });

    return setup;
  }

  describe("event and category management", function () {
    it("allows the owner to create an event", async function () {
      const { ticketNFT, owner } = await deployTicketNFT();

      await ticketNFT.connect(owner).createEvent("Campus Concert");

      const eventInfo = await ticketNFT.getEventInfo(0);

      expect(eventInfo[0]).to.equal("Campus Concert");
      expect(eventInfo[1]).to.equal(owner.address);
      expect(eventInfo[2]).to.equal(true);
      expect(eventInfo[3]).to.equal(0n);
    });

    it("allows an approved organizer to create an event", async function () {
      const { ticketNFT, owner, organizer } = await deployTicketNFT();

      await ticketNFT.connect(owner).setOrganizer(organizer.address, true);
      await ticketNFT.connect(organizer).createEvent("Hackathon Finals");

      const eventInfo = await ticketNFT.getEventInfo(0);

      expect(eventInfo[0]).to.equal("Hackathon Finals");
      expect(eventInfo[1]).to.equal(organizer.address);
      expect(await ticketNFT.isOrganizer(organizer.address)).to.equal(true);
    });

    it("rejects event creation by an unauthorized account", async function () {
      const { ticketNFT, user } = await deployTicketNFT();

      await expect(ticketNFT.connect(user).createEvent("Unauthorized Event")).to
        .be.revertedWith("Not authorized organizer");
    });

    it("allows the event organizer to create a category", async function () {
      const { ticketNFT } = await createEventWithCategory();

      const eventInfo = await ticketNFT.getEventInfo(0);
      const categoryInfo = await ticketNFT.getCategory(0, 0);

      expect(eventInfo[3]).to.equal(1n);
      expect(categoryInfo[0]).to.equal("VIP");
      expect(categoryInfo[1]).to.equal("ipfs://vip-ticket");
      expect(categoryInfo[2]).to.equal(100n);
      expect(categoryInfo[3]).to.equal(2n);
      expect(categoryInfo[4]).to.equal(0n);
      expect(categoryInfo[5]).to.equal(2n);
    });

    it("allows the contract owner to create a category for an existing event", async function () {
      const { ticketNFT, owner, organizer } = await deployTicketNFT();

      await ticketNFT.connect(owner).setOrganizer(organizer.address, true);
      await ticketNFT.connect(organizer).createEvent("Student Showcase");
      await ticketNFT
        .connect(owner)
        .createCategory(0, "Regular", "ipfs://regular-ticket", 50, 5);

      const categoryInfo = await ticketNFT.getCategory(0, 0);

      expect(categoryInfo[0]).to.equal("Regular");
      expect(categoryInfo[2]).to.equal(50n);
      expect(categoryInfo[3]).to.equal(5n);
      expect(categoryInfo[5]).to.equal(5n);
    });

    it("rejects category creation by an account that does not manage the event", async function () {
      const { ticketNFT, owner, organizer, user } = await deployTicketNFT();

      await ticketNFT.connect(owner).setOrganizer(organizer.address, true);
      await ticketNFT.connect(organizer).createEvent("Debate Finals");

      await expect(
        ticketNFT
          .connect(user)
          .createCategory(0, "VIP", "ipfs://vip-ticket", 100, 10)
      ).to.be.revertedWith("Not event organizer");
    });
  });

  describe("purchase and inventory", function () {
    it("purchases a ticket successfully from available inventory", async function () {
      const { ticketNFT, user, price } = await createEventWithCategory();

      await ticketNFT.connect(user).purchaseTicket(0, 0, { value: price });

      expect(await ticketNFT.ownerOf(0)).to.equal(user.address);
      expect(await ticketNFT.tokenURI(0)).to.equal("ipfs://vip-ticket");
    });

    it("stores the correct ticket data on purchase", async function () {
      const { ticketNFT, price } = await purchaseVipTicket();

      const ticketInfo = await ticketNFT.getTicketInfo(0);

      expect(ticketInfo[0]).to.equal(0n);
      expect(ticketInfo[1]).to.equal("VIP");
      expect(ticketInfo[2]).to.equal(false);
      expect(await ticketNFT.getTicketCategoryId(0)).to.equal(0n);
    });

    it("tracks minted and remaining inventory after purchase", async function () {
      const { ticketNFT } = await purchaseVipTicket();

      const categoryInfo = await ticketNFT.getCategory(0, 0);

      expect(categoryInfo[4]).to.equal(1n);
      expect(categoryInfo[5]).to.equal(1n);
    });

    it("rejects purchases with incorrect payment", async function () {
      const { ticketNFT, user, price } = await createEventWithCategory();

      await expect(
        ticketNFT.connect(user).purchaseTicket(0, 0, { value: price - 1n })
      ).to.be.revertedWith("Incorrect payment");
    });

    it("rejects purchases for an invalid event", async function () {
      const { ticketNFT, user } = await deployTicketNFT();

      await expect(ticketNFT.connect(user).purchaseTicket(999, 0)).to.be
        .revertedWith("Event does not exist");
    });

    it("rejects purchases for an invalid category", async function () {
      const { ticketNFT, user, price } = await createEventWithCategory();

      await expect(
        ticketNFT.connect(user).purchaseTicket(0, 999, { value: price })
      ).to.be.revertedWith("Category does not exist");
    });

    it("rejects purchases once a category is sold out", async function () {
      const { ticketNFT, user, otherUser, price } = await createEventWithCategory();

      await ticketNFT.connect(user).purchaseTicket(0, 0, { value: price });
      await ticketNFT.connect(otherUser).purchaseTicket(0, 0, { value: price });

      await expect(
        ticketNFT.connect(user).purchaseTicket(0, 0, { value: price })
      ).to.be.revertedWith("Category sold out");
    });

    it("blocks purchases when an event has been deactivated", async function () {
      const { ticketNFT, organizer, user, price } = await createEventWithCategory();

      await ticketNFT.connect(organizer).setEventActive(0, false);

      const eventInfo = await ticketNFT.getEventInfo(0);
      expect(eventInfo[2]).to.equal(false);

      await expect(
        ticketNFT.connect(user).purchaseTicket(0, 0, { value: price })
      ).to.be.revertedWith("Event is not active");
    });
  });

  describe("ticket lifecycle after purchase", function () {
    it("assigns ownership to the purchaser", async function () {
      const { ticketNFT, user } = await purchaseVipTicket();

      expect(await ticketNFT.ownerOf(0)).to.equal(user.address);
    });

    it("allows the owner of a purchased ticket to redeem it once", async function () {
      const { ticketNFT, user } = await purchaseVipTicket();

      await ticketNFT.connect(user).redeem(0);

      expect(await ticketNFT.isRedeemed(0)).to.equal(true);

      const ticketInfo = await ticketNFT.getTicketInfo(0);
      expect(ticketInfo[2]).to.equal(true);
    });

    it("rejects redeeming the same purchased ticket twice", async function () {
      const { ticketNFT, user } = await purchaseVipTicket();

      await ticketNFT.connect(user).redeem(0);

      await expect(ticketNFT.connect(user).redeem(0)).to.be.revertedWith(
        "Ticket already redeemed"
      );
    });

    it("rejects redemption by a non-owner after purchase", async function () {
      const { ticketNFT, otherUser } = await purchaseVipTicket();

      await expect(ticketNFT.connect(otherUser).redeem(0)).to.be.revertedWith(
        "Not ticket owner"
      );
    });

    it("allows transfer before redemption and preserves ticket invariants", async function () {
      const { ticketNFT, user, otherUser } = await purchaseVipTicket();

      await ticketNFT
        .connect(user)
        .transferFrom(user.address, otherUser.address, 0);

      expect(await ticketNFT.ownerOf(0)).to.equal(otherUser.address);

      const ticketInfo = await ticketNFT.getTicketInfo(0);
      expect(ticketInfo[0]).to.equal(0n);
      expect(ticketInfo[1]).to.equal("VIP");
      expect(ticketInfo[2]).to.equal(false);
      expect(await ticketNFT.getTicketCategoryId(0)).to.equal(0n);
    });

    it("allows the new owner to redeem after transfer before redemption", async function () {
      const { ticketNFT, user, otherUser } = await purchaseVipTicket();

      await ticketNFT
        .connect(user)
        .transferFrom(user.address, otherUser.address, 0);

      await ticketNFT.connect(otherUser).redeem(0);

      expect(await ticketNFT.isRedeemed(0)).to.equal(true);
    });

    it("rejects transfer after redemption", async function () {
      const { ticketNFT, user, otherUser } = await purchaseVipTicket();

      await ticketNFT.connect(user).redeem(0);

      await expect(
        ticketNFT.connect(user).transferFrom(user.address, otherUser.address, 0)
      ).to.be.revertedWith("Redeemed ticket cannot be transferred");
    });
  });

  describe("existing invariants and legacy helper behavior", function () {
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

    it("keeps the legacy owner-only manual mint helper restricted to the contract owner", async function () {
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
});
