// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ZakatSystem is ERC20, Ownable, ReentrancyGuard {
    struct Recipient {
        string name;
        bool isRegistered;
        uint256 tokenAmount;
    }

    struct ShopOwner {
        string name;
        bool isRegistered;
        uint256 tokenBalance;
    }

    // Item struct to track allowed items
    struct AllowedItem {
        string name;
        bool isAllowed;
    }

    // Maps Malaysian ID to Recipient
    mapping(string => Recipient) public recipients;
    // Maps ShopOwner ID to ShopOwner
    mapping(string => ShopOwner) public shopOwners;
    // Maps item code to AllowedItem
    mapping(string => AllowedItem) public allowedItems;

    // Array to track all allowed item codes
    string[] public itemCodes;

    // Array of all recipient IDs for iteration
    string[] public recipientIds;
    // Array of all shop owner IDs for iteration
    string[] public shopOwnerIds;
    // Boolean to track whether distribution has occurred
    bool public distributionCompleted;
    // Track total amount distributed
    uint256 public totalDistributedAmount;
    // Track total zakat collected
    uint256 public totalZakatCollected;

    event RecipientAdded(string id, string name);
    event ShopOwnerAdded(string id, string name);
    event ZakatDistributed(uint256 totalAmount, uint256 recipientCount);
    event TokenSpent(string recipientId, string shopOwnerId, uint256 amount);
    event TokenClaimed(string id, uint256 amount);
    event ItemAdded(string itemCode, string name);
    event ItemRemoved(string itemCode);
    event ItemPurchased(string recipientId, string itemCode);

    constructor() ERC20("ZakatToken", "ZKT") Ownable(msg.sender) {
        distributionCompleted = false;
        totalDistributedAmount = 0;
        totalZakatCollected = 0;
    }

    // Called by your API when someone pays Zakat
    function mintZakat(uint256 amount) external onlyOwner {
        require(!distributionCompleted, "Zakat collection period has ended");
        _mint(address(this), amount);
        totalZakatCollected += amount;
    }

    // Add an allowed item
    function addAllowedItem(
        string memory itemCode,
        string memory name
    ) external onlyOwner {
        require(!allowedItems[itemCode].isAllowed, "Item already allowed");

        allowedItems[itemCode] = AllowedItem({name: name, isAllowed: true});

        itemCodes.push(itemCode);

        emit ItemAdded(itemCode, name);
    }

    // Remove an allowed item
    function removeAllowedItem(string memory itemCode) external onlyOwner {
        require(allowedItems[itemCode].isAllowed, "Item not found");

        allowedItems[itemCode].isAllowed = false;

        emit ItemRemoved(itemCode);
    }

    // Check if multiple items are allowed (returns false if any item is not allowed)
    function areItemsAllowed(
        string[] memory itemCodesToCheck
    ) public view returns (bool) {
        for (uint i = 0; i < itemCodesToCheck.length; i++) {
            if (!allowedItems[itemCodesToCheck[i]].isAllowed) {
                return false;
            }
        }
        return true;
    }

    // Check each item individually and return an array of results
    function checkItemsAllowed(
        string[] memory itemCodesToCheck
    ) public view returns (bool[] memory) {
        bool[] memory results = new bool[](itemCodesToCheck.length);

        for (uint i = 0; i < itemCodesToCheck.length; i++) {
            results[i] = allowedItems[itemCodesToCheck[i]].isAllowed;
        }

        return results;
    }

    // Spend tokens for specific items
    function spendTokensForItems(
        string memory recipientId,
        string memory shopOwnerId,
        uint256 amount,
        string[] memory itemCodesToCheck
    ) external onlyOwner nonReentrant {
        require(
            recipients[recipientId].isRegistered,
            "Recipient not registered"
        );
        require(
            shopOwners[shopOwnerId].isRegistered,
            "Shop owner not registered"
        );
        require(
            recipients[recipientId].tokenAmount >= amount,
            "Insufficient token balance"
        );

        // Check if all items are allowed
        for (uint i = 0; i < itemCodesToCheck.length; i++) {
            require(
                allowedItems[itemCodesToCheck[i]].isAllowed,
                "One or more items are not allowed for purchase"
            );

            emit ItemPurchased(recipientId, itemCodesToCheck[i]);
        }

        recipients[recipientId].tokenAmount -= amount;
        shopOwners[shopOwnerId].tokenBalance += amount;

        emit TokenSpent(recipientId, shopOwnerId, amount);
    }

    // Register a recipient
    function addRecipient(
        string memory id,
        string memory name
    ) external onlyOwner {
        require(!recipients[id].isRegistered, "Recipient already registered");

        recipients[id] = Recipient({
            name: name,
            isRegistered: true,
            tokenAmount: 0
        });

        recipientIds.push(id);

        emit RecipientAdded(id, name);
    }

    // Register a shop owner
    function addShopOwner(
        string memory id,
        string memory name
    ) external onlyOwner {
        require(!shopOwners[id].isRegistered, "Shop owner already registered");

        shopOwners[id] = ShopOwner({
            name: name,
            isRegistered: true,
            tokenBalance: 0
        });

        shopOwnerIds.push(id);

        emit ShopOwnerAdded(id, name);
    }

    // Distribute tokens evenly among recipients
    function distributeZakat() external onlyOwner nonReentrant {
        require(!distributionCompleted, "Distribution already completed");
        require(recipientIds.length > 0, "No recipients registered");

        uint256 contractBalance = balanceOf(address(this));
        require(contractBalance > 0, "No tokens to distribute");

        uint256 amountPerRecipient = contractBalance / recipientIds.length;

        for (uint i = 0; i < recipientIds.length; i++) {
            string memory id = recipientIds[i];
            recipients[id].tokenAmount += amountPerRecipient;
        }

        // Store the total amount distributed
        totalDistributedAmount = contractBalance;
        distributionCompleted = true;

        emit ZakatDistributed(contractBalance, recipientIds.length);
    }

    // ShopOwner claims MYR by burning tokens
    function claimShopOwnerTokens(
        string memory shopOwnerId,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(
            shopOwners[shopOwnerId].isRegistered,
            "Shop owner not registered"
        );
        require(
            shopOwners[shopOwnerId].tokenBalance >= amount,
            "Insufficient token balance"
        );

        shopOwners[shopOwnerId].tokenBalance -= amount;
        _burn(address(this), amount);

        emit TokenClaimed(shopOwnerId, amount);
    }

    // Recipient claims MYR by burning tokens
    function claimRecipientTokens(
        string memory recipientId,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(
            recipients[recipientId].isRegistered,
            "Recipient not registered"
        );
        require(
            recipients[recipientId].tokenAmount >= amount,
            "Insufficient token balance"
        );

        recipients[recipientId].tokenAmount -= amount;
        _burn(address(this), amount);

        emit TokenClaimed(recipientId, amount);
    }

    // Get recipient balance
    function getRecipientBalance(
        string memory id
    ) external view returns (uint256) {
        require(recipients[id].isRegistered, "Recipient not registered");
        return recipients[id].tokenAmount;
    }

    // Get shop owner balance
    function getShopOwnerBalance(
        string memory id
    ) external view returns (uint256) {
        require(shopOwners[id].isRegistered, "Shop owner not registered");
        return shopOwners[id].tokenBalance;
    }

    // Reset for a new Zakat period
    function resetZakatPeriod() external onlyOwner {
        require(distributionCompleted, "Previous distribution not completed");
        distributionCompleted = false;
        totalDistributedAmount = 0;
        // Reset totalZakatCollected to 0 for the new period
        totalZakatCollected = 0;
    }

    // Get total number of registered recipients
    function getTotalRecipients() external view returns (uint256) {
        return recipientIds.length;
    }

    // Get total number of registered shop owners
    function getTotalShopOwners() external view returns (uint256) {
        return shopOwnerIds.length;
    }

    // Get total number of allowed items
    function getTotalAllowedItems() external view returns (uint256) {
        return itemCodes.length;
    }

    // Get total amount of tokens initially distributed
    function getTotalDistributedTokens() external view returns (uint256) {
        return totalDistributedAmount;
    }

    // Get total zakat collected in this period
    function getTotalZakatCollected() external view returns (uint256) {
        return totalZakatCollected;
    }

    // Get current total amount held by recipients
    function getCurrentRecipientTokens() public view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < recipientIds.length; i++) {
            string memory id = recipientIds[i];
            total += recipients[id].tokenAmount;
        }
        return total;
    }

    // Get total amount of tokens held by shop owners
    function getTotalShopOwnerTokens() public view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < shopOwnerIds.length; i++) {
            string memory id = shopOwnerIds[i];
            total += shopOwners[id].tokenBalance;
        }
        return total;
    }

    // Get tokens available for distribution (not yet distributed)
    function getUndistributedTokens() external view returns (uint256) {
        if (distributionCompleted) {
            return 0;
        } else {
            uint256 totalHeldByUsers = getCurrentRecipientTokens() +
                getTotalShopOwnerTokens();
            return totalSupply() - totalHeldByUsers;
        }
    }
}
