// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    struct TicketData {
        uint256 eventId;
        string ticketType;
    }

    mapping(uint256 => bool) private _redeemed;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => TicketData) private _ticketData;

    constructor(address initialOwner)
        ERC721("TicketNFT", "TNFT")
        Ownable(initialOwner)
    {}

    function mintTicket(
        address to,
        string memory uri,
        uint256 eventId,
        string memory ticketType
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        _ticketData[tokenId] = TicketData({
            eventId: eventId,
            ticketType: ticketType
        });

        return tokenId;
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

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0) && _redeemed[tokenId]) {
            revert("Redeemed ticket cannot be transferred");
        }

        return super._update(to, tokenId, auth);
    }
}