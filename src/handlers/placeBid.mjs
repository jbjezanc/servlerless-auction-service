import AWS from "aws-sdk"
import commonMiddleware from "../lib/commonMiddleware.mjs"
import placeBidSchema from "../lib/schemas/placeBidSchema.mjs"
import validator from "@middy/validator"
import createError from "http-errors"
import { getAuctionById } from "./getAuction.mjs"
import { transpileSchema } from "@middy/validator/transpile"

const dynamodb = new AWS.DynamoDB.DocumentClient()

async function placeBid(event, context) {
  const { id } = event.pathParameters
  const { amount } = event.body
  const { email } = event.requestContext.authorizer

  const auction = await getAuctionById(id)

  // Bid Identity Validation
  if (email === auction.seller) {
    throw new createError.Forbidden(`You cannot bid on your own auctions!`)
  }

  // Avoid Double Bidding
  if (email === auction.highestBid.bidder) {
    throw new createError.Forbidden(`You are already the highest bidder.`)
  }

  // Auction Status Validation
  if (auction.status !== "OPEN") {
    throw new createError.Forbidden(
      `You cannot bid on closed auctions!`
    )
  }

  // Bid Amount Validation
  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(
      `Your bid must be higher than ${auction.highestBid.amount}!`
    )
  }

  // This way, define update params as a separate object to avoid clutter and
  // more clearly express our intention
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression:
      "set highestBid.amount = :amount, highestBid.bidder = :bidder", // using expression language here
    ExpressionAttributeValues: {
      ":amount": amount,
      ":bidder": email,
    },
    ReturnValues: "ALL_NEW", // when done with db operations return these, in this case updated item
  }

  try {
    const result = await dynamodb.update(params).promise()
    const updatedAuction = result.Attributes

    return {
      statusCode: 200,
      body: JSON.stringify(updatedAuction),
    }
  } catch (error) {
    console.error(error)
    throw new createError.InternalServerError(error)
  }
}

export const handler = commonMiddleware(placeBid).use(
  validator({
    eventSchema: transpileSchema(placeBidSchema),
    ajvOptions: {
      useDefaults: true,
      strict: false,
    },
  })
)
