import { v4 as uuid } from "uuid"
import AWS from "aws-sdk"
import commonMiddleware from "../lib/commonMiddleware.mjs"
import validator from "@middy/validator"
import createAuctionSchema from "../lib/schemas/createAuctionSchema.mjs"
import createError from "http-errors"
import { transpileSchema } from "@middy/validator/transpile"

// A good case of using a global/outer scope of the file, because this is absolutely static.
const dynamodb = new AWS.DynamoDB.DocumentClient()

async function createAuction(event, context) {
  const { title } = event.body
  const { email } = event.requestContext.authorizer
  const now = new Date()
  const endDate = new Date()
  // Set the endDate to one hour in the future
  endDate.setHours(now.getHours() + 1)

  const auction = {
    id: uuid(),
    title,
    status: "OPEN",
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
    },
    seller: email,
  }

  // The defaults for the `put` method is to use callbacks,
  // so we chain the .promise() method that returns a thenable Promise
  try {
    await dynamodb
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: auction,
      })
      .promise()

    return {
      statusCode: 201,
      body: JSON.stringify(auction),
    }
  } catch (error) {
    console.error(error)
    throw new createError.InternalServerError(error)
  }
}

export const handler = commonMiddleware(createAuction).use(
  validator({
    eventSchema: transpileSchema(createAuctionSchema),
    ajvOptions: {
      useDefaults: true,
      strict: false,
    },
  })
)
