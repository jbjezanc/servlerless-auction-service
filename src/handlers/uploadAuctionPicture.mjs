import middy from "@middy/core"
import httpErrorHandler from "@middy/http-error-handler"
import validator from "@middy/validator"
import cors from "@middy/http-cors"
import { transpileSchema } from "@middy/validator/transpile"
import createError from "http-errors"
import { getAuctionById } from "./getAuction.mjs"
import { uploadPictureToS3 } from "../lib/uploadPictureToS3.mjs"
import { setAuctionPictureUrl } from "../lib/setAuctionPictureUrl.mjs"
import uploadAuctionPictureSchema from "../lib/schemas/uploadAuctionPictureSchema.mjs"

export async function uploadAuctionPicture(event) {
  const { id } = event.pathParameters
  const { email } = event.requestContext.authorizer
  const auction = await getAuctionById(id)

  // Make sure the uploader is a seller
  if (auction.seller !== email) {
    throw new createError.Forbidden(
      `You are not the seller of this auction item!`
    )
  }

  // Strip off some characters from the base64 string to avoid corruption:
  // Examples: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..." -> "iVBORw0KGgoAAAANSUhEUgAAAAUA..."
  //           "data:image/svg+xml;base64,PHN2ZyB4bWxucz0i..." -> "PHN2ZyB4bWxucz0i..."
  const base64 = event.body.replace(
    /^data:image\/\w+;base64,/,
    ""
  )
  // Create a buffer from that string
  const buffer = Buffer.from(base64, "base64")

  let updatedAuction

  try {
    // By using that buffer we can upload our image to S3
    const pictureUrl = await uploadPictureToS3(
      auction.id + ".jpg",
      buffer
    )
    updatedAuction = await setAuctionPictureUrl(
      auction.id,
      pictureUrl
    )
  } catch (error) {
    console.error(error)
    throw new createError.InternalServerError(error)
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  }
}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())
  .use(
    validator({
      eventSchema: transpileSchema(
        uploadAuctionPictureSchema
      ),
      ajvOptions: {
        useDefaults: true,
        strict: false,
      },
    })
  )
  .use(cors())
