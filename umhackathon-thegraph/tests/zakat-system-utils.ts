import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Approval,
  OwnershipTransferred,
  RecipientAdded,
  ShopOwnerAdded,
  TokenClaimed,
  TokenSpent,
  Transfer,
  ZakatDistributed
} from "../generated/ZakatSystem/ZakatSystem"

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return approvalEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createRecipientAddedEvent(
  id: string,
  name: string
): RecipientAdded {
  let recipientAddedEvent = changetype<RecipientAdded>(newMockEvent())

  recipientAddedEvent.parameters = new Array()

  recipientAddedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromString(id))
  )
  recipientAddedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )

  return recipientAddedEvent
}

export function createShopOwnerAddedEvent(
  id: string,
  name: string
): ShopOwnerAdded {
  let shopOwnerAddedEvent = changetype<ShopOwnerAdded>(newMockEvent())

  shopOwnerAddedEvent.parameters = new Array()

  shopOwnerAddedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromString(id))
  )
  shopOwnerAddedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )

  return shopOwnerAddedEvent
}

export function createTokenClaimedEvent(
  id: string,
  amount: BigInt
): TokenClaimed {
  let tokenClaimedEvent = changetype<TokenClaimed>(newMockEvent())

  tokenClaimedEvent.parameters = new Array()

  tokenClaimedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromString(id))
  )
  tokenClaimedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return tokenClaimedEvent
}

export function createTokenSpentEvent(
  recipientId: string,
  shopOwnerId: string,
  amount: BigInt
): TokenSpent {
  let tokenSpentEvent = changetype<TokenSpent>(newMockEvent())

  tokenSpentEvent.parameters = new Array()

  tokenSpentEvent.parameters.push(
    new ethereum.EventParam(
      "recipientId",
      ethereum.Value.fromString(recipientId)
    )
  )
  tokenSpentEvent.parameters.push(
    new ethereum.EventParam(
      "shopOwnerId",
      ethereum.Value.fromString(shopOwnerId)
    )
  )
  tokenSpentEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return tokenSpentEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}

export function createZakatDistributedEvent(
  totalAmount: BigInt,
  recipientCount: BigInt
): ZakatDistributed {
  let zakatDistributedEvent = changetype<ZakatDistributed>(newMockEvent())

  zakatDistributedEvent.parameters = new Array()

  zakatDistributedEvent.parameters.push(
    new ethereum.EventParam(
      "totalAmount",
      ethereum.Value.fromUnsignedBigInt(totalAmount)
    )
  )
  zakatDistributedEvent.parameters.push(
    new ethereum.EventParam(
      "recipientCount",
      ethereum.Value.fromUnsignedBigInt(recipientCount)
    )
  )

  return zakatDistributedEvent
}
