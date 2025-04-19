import {
  Approval as ApprovalEvent,
  ItemAdded as ItemAddedEvent,
  ItemPurchased as ItemPurchasedEvent,
  ItemRemoved as ItemRemovedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  RecipientAdded as RecipientAddedEvent,
  ShopOwnerAdded as ShopOwnerAddedEvent,
  TokenClaimed as TokenClaimedEvent,
  TokenSpent as TokenSpentEvent,
  Transfer as TransferEvent,
  ZakatDistributed as ZakatDistributedEvent
} from "../generated/ZakatSystem/ZakatSystem"
import {
  Approval,
  ItemAdded,
  ItemPurchased,
  ItemRemoved,
  OwnershipTransferred,
  RecipientAdded,
  ShopOwnerAdded,
  TokenClaimed,
  TokenSpent,
  Transfer,
  ZakatDistributed
} from "../generated/schema"

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.spender = event.params.spender
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleItemAdded(event: ItemAddedEvent): void {
  let entity = new ItemAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.itemCode = event.params.itemCode
  entity.name = event.params.name

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleItemPurchased(event: ItemPurchasedEvent): void {
  let entity = new ItemPurchased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.recipientId = event.params.recipientId
  entity.itemCode = event.params.itemCode

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleItemRemoved(event: ItemRemovedEvent): void {
  let entity = new ItemRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.itemCode = event.params.itemCode

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRecipientAdded(event: RecipientAddedEvent): void {
  let entity = new RecipientAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.internal_id = event.params.id
  entity.name = event.params.name

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleShopOwnerAdded(event: ShopOwnerAddedEvent): void {
  let entity = new ShopOwnerAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.internal_id = event.params.id
  entity.name = event.params.name

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokenClaimed(event: TokenClaimedEvent): void {
  let entity = new TokenClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.internal_id = event.params.id
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokenSpent(event: TokenSpentEvent): void {
  let entity = new TokenSpent(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.recipientId = event.params.recipientId
  entity.shopOwnerId = event.params.shopOwnerId
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleZakatDistributed(event: ZakatDistributedEvent): void {
  let entity = new ZakatDistributed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.totalAmount = event.params.totalAmount
  entity.recipientCount = event.params.recipientCount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
