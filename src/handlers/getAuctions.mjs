import AWS from "aws-sdk"
import commonMiddleware from "../lib/commonMiddleware.mjs"
import validator from "@middy/validator"
import createError from "http-errors"
import getAuctionsSchema from "../lib/schemas/getAuctionsSchema.mjs"
import { transpileSchema } from "@middy/validator/transpile"

const dynamodb = new AWS.DynamoDB.DocumentClient()

async function getAuctions(event, context) {
  const { status } = event.queryStringParameters || {
    status: "OPEN",
  } // fallback to "OPEN"

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: "statusAndEndDate",
    KeyConditionExpression: "#status = :status",
    ExpressionAttributeValues: {
      ":status": status,
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  }

  try {
    const result = await dynamodb.query(params).promise()
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    }
  } catch (error) {
    console.error(error)
    throw new createError.InternalServerError(error)
  }
}

export const handler = commonMiddleware(getAuctions).use(
  validator({
    eventSchema: transpileSchema(getAuctionsSchema),
    ajvOptions: {
      useDefaults: true,
      strict: false,
    },
  })
)
