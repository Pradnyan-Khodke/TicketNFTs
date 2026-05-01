// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;
    uint256 private _nextEventId;

    struct EventData {
        string name;
        address organizer;
        bool exists;
        bool active;
        uint256 categoryCount;
    }

    struct CategoryData {
        string ticketType;
        string metadataURI;
        uint256 price;
        uint256 maxSupply;
        uint256 minted;
        bool transferable;
        bool exists;
    }

    struct TicketData {
        uint256 eventId;
        uint256 categoryId;
        string ticketType;
        bool transferable;
    }

    mapping(address => bool) private _organizers;
    mapping(uint256 => EventData) private _events;
    mapping(uint256 => mapping(uint256 => CategoryData)) private _categories;
    mapping(uint256 => bool) private _redeemed;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => TicketData) private _ticketData;

    constructor(address initialOwner)
        ERC721("TicketNFT", "TNFT")
        Ownable(initialOwner)
    {
        _organizers[initialOwner] = true;
    }

    modifier onlyAdminOrOrganizer() {
        require(
            msg.sender == owner() || _organizers[msg.sender],
            "Not authorized organizer"
        );
        _;
    }

    modifier onlyEventManager(uint256 eventId) {
        require(_events[eventId].exists, "Event does not exist");
        require(
            msg.sender == owner() || msg.sender == _events[eventId].organizer,
            "Not event organizer"
        );
        _;
    }

    function setOrganizer(address organizer, bool approved) external onlyOwner {
        require(organizer != address(0), "Invalid organizer");
        _organizers[organizer] = approved;
    }

    function isOrganizer(address account) external view returns (bool) {
        return account == owner() || _organizers[account];
    }

    function createEvent(
        string memory name
    ) external onlyAdminOrOrganizer returns (uint256) {
        require(bytes(name).length > 0, "Event name required");

        uint256 eventId = _nextEventId;
        _nextEventId++;

        _events[eventId] = EventData({
            name: name,
            organizer: msg.sender,
            exists: true,
            active: true,
            categoryCount: 0
        });

        return eventId;
    }

    function setEventActive(
        uint256 eventId,
        bool active
    ) external onlyEventManager(eventId) {
        _events[eventId].active = active;
    }

    function createCategory(
        uint256 eventId,
        string memory ticketType,
        string memory metadataURI,
        uint256 price,
        uint256 maxSupply,
        bool transferable
    ) external onlyEventManager(eventId) returns (uint256) {
        require(bytes(ticketType).length > 0, "Ticket type required");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(maxSupply > 0, "Max supply must be greater than zero");

        EventData storage eventData = _events[eventId];
        uint256 categoryId = eventData.categoryCount;
        eventData.categoryCount++;

        _categories[eventId][categoryId] = CategoryData({
            ticketType: ticketType,
            metadataURI: metadataURI,
            price: price,
            maxSupply: maxSupply,
            minted: 0,
            transferable: transferable,
            exists: true
        });

        return categoryId;
    }

    function purchaseTicket(
        uint256 eventId,
        uint256 categoryId
    ) external payable returns (uint256) {
        EventData storage eventData = _events[eventId];
        require(eventData.exists, "Event does not exist");
        require(eventData.active, "Event is not active");

        CategoryData storage category = _categories[eventId][categoryId];
        require(category.exists, "Category does not exist");
        require(category.minted < category.maxSupply, "Category sold out");
        require(msg.value == category.price, "Incorrect payment");

        category.minted++;

        uint256 tokenId = _mintTicket(
            msg.sender,
            category.metadataURI,
            eventId,
            categoryId,
            category.ticketType,
            category.transferable
        );

        (bool sent, ) = payable(eventData.organizer).call{value: msg.value}("");
        require(sent, "Organizer payment failed");

        return tokenId;
    }

    function mintTicket(
        address to,
        string memory uri,
        uint256 eventId,
        string memory ticketType
    ) external onlyOwner returns (uint256) {
        return
            _mintTicket(
                to,
                uri,
                eventId,
                type(uint256).max,
                ticketType,
                true
            );
    }

    function redeem(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not ticket owner");
        require(!_redeemed[tokenId], "Ticket already redeemed");

        _redeemed[tokenId] = true;
    }

    function isRedeemed(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return _redeemed[tokenId];
    }

    function getTicketInfo(uint256 tokenId)
        external
        view
        returns (uint256 eventId, string memory ticketType, bool redeemed)
    {
        _requireOwned(tokenId);

        TicketData memory ticket = _ticketData[tokenId];
        return (ticket.eventId, ticket.ticketType, _redeemed[tokenId]);
    }

    function getTicketCategoryId(uint256 tokenId) external view returns (uint256) {
        _requireOwned(tokenId);
        return _ticketData[tokenId].categoryId;
    }

    function getTicketTransferable(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return _ticketData[tokenId].transferable;
    }

    function getEventCount() external view returns (uint256) {
        return _nextEventId;
    }

    function getTotalMintedTickets() external view returns (uint256) {
        return _nextTokenId;
    }

    function getEventInfo(
        uint256 eventId
    )
        external
        view
        returns (
            string memory name,
            address organizer,
            bool active,
            uint256 categoryCount
        )
    {
        EventData memory eventData = _events[eventId];
        require(eventData.exists, "Event does not exist");

        return (
            eventData.name,
            eventData.organizer,
            eventData.active,
            eventData.categoryCount
        );
    }

    function getCategory(
        uint256 eventId,
        uint256 categoryId
    )
        external
        view
        returns (
            string memory ticketType,
            string memory metadataURI,
            uint256 price,
            uint256 maxSupply,
            uint256 minted,
            uint256 remaining,
            bool transferable
        )
    {
        require(_events[eventId].exists, "Event does not exist");

        CategoryData memory category = _categories[eventId][categoryId];
        require(category.exists, "Category does not exist");

        return (
            category.ticketType,
            category.metadataURI,
            category.price,
            category.maxSupply,
            category.minted,
            category.maxSupply - category.minted,
            category.transferable
        );
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0) && _redeemed[tokenId]) {
            revert("Redeemed ticket cannot be transferred");
        }

        if (
            from != address(0) &&
            to != address(0) &&
            !_ticketData[tokenId].transferable
        ) {
            revert("Soul-bound ticket cannot be transferred");
        }

        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, amount);
    }

    function _mintTicket(
        address to,
        string memory uri,
        uint256 eventId,
        uint256 categoryId,
        string memory ticketType,
        bool transferable
    ) internal returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        _ticketData[tokenId] = TicketData({
            eventId: eventId,
            categoryId: categoryId,
            ticketType: ticketType,
            transferable: transferable
        });

        return tokenId;
    }
}
