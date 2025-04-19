// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ZakatNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Mapping from receipt ID to token ID
    mapping(string => uint256) public receiptToToken;
    
    // Mapping from email to owned token IDs
    mapping(string => uint256[]) private _emailToTokens;
    
    // Mapping from token ID to email
    mapping(uint256 => string) private _tokenToEmail;
    
    // Receipt data structure
    struct ReceiptData {
        string receiptId;
        string name;
        string icNumber;
        string email;
        string phoneNumber;
        string zakatType;
        uint256 amount;
        uint256 timestamp;
        string transactionHash;
    }
    
    // Mapping from token ID to Receipt Data
    mapping(uint256 => ReceiptData) public receipts;
    
    // Events
    event ReceiptMinted(uint256 tokenId, string receiptId, string name, string email, uint256 amount, string transactionHash);
    
    constructor() ERC721("Zakat Receipt NFT", "ZAKAT") Ownable(msg.sender) {
    }
    
    // Check if a token exists (replacement for _exists)
    function tokenExists(uint256 tokenId) internal view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
    
    // Mint a new receipt NFT
    function mintReceiptNFT(
        string memory receiptId,
        string memory name,
        string memory icNumber,
        string memory email,
        string memory phoneNumber,
        string memory zakatType,
        uint256 amount,
        string memory transactionHash,
        string memory tokenURI
    ) external onlyOwner returns (uint256) {
        // Ensure receipt ID hasn't been used before
        require(receiptToToken[receiptId] == 0, "Receipt already minted");
        
        // Increment token ID
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        // Mint the token to the contract owner (deployer's address)
        _mint(owner(), newTokenId);
        
        // Set token URI
        _setTokenURI(newTokenId, tokenURI);
        
        // Associate token with email
        _tokenToEmail[newTokenId] = email;
        _emailToTokens[email].push(newTokenId);
        
        // Store receipt data
        receipts[newTokenId] = ReceiptData({
            receiptId: receiptId,
            name: name,
            icNumber: icNumber,
            email: email,
            phoneNumber: phoneNumber,
            zakatType: zakatType,
            amount: amount,
            timestamp: block.timestamp,
            transactionHash: transactionHash
        });
        
        // Map receipt ID to token ID
        receiptToToken[receiptId] = newTokenId;
        
        // Emit event
        emit ReceiptMinted(newTokenId, receiptId, name, email, amount, transactionHash);
        
        return newTokenId;
    }
    
    // Get receipt data by token ID
    function getReceiptData(uint256 tokenId) external view returns (ReceiptData memory) {
        require(tokenExists(tokenId), "Token does not exist");
        return receipts[tokenId];
    }
    
    // Get token ID by receipt ID
    function getTokenIdByReceiptId(string memory receiptId) external view returns (uint256) {
        uint256 tokenId = receiptToToken[receiptId];
        require(tokenId != 0, "Receipt not found");
        return tokenId;
    }
    
    // Check if a receipt exists
    function receiptExists(string memory receiptId) external view returns (bool) {
        return receiptToToken[receiptId] != 0;
    }
    
    // Get all tokens owned by an email
    function getTokensByEmail(string memory email) external view returns (uint256[] memory) {
        return _emailToTokens[email];
    }
    
    // Get email associated with a token
    function getEmailByToken(uint256 tokenId) external view returns (string memory) {
        require(tokenExists(tokenId), "Token does not exist");
        return _tokenToEmail[tokenId];
    }
} 