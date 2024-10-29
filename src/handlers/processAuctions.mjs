import { getEndedAuctions } from "../lib/getEndedAuctions.mjs"
import { closeAuction } from "../lib/closeAuction.mjs"
import createError from "http-errors"

async function processAuctions(event, context) {
  try {
    const auctionsToClose = await getEndedAuctions()
    // Array of promises
    const closePromises = auctionsToClose.map((auction) =>
      closeAuction(auction)
    )
    // Wait for all promises to be resolved, i.e. close all of our auctions or none if error
    await Promise.all(closePromises)

    // We need to return something, and this is a fair-enough return value
    return {
      closed: closePromises.length,
    }
  } catch (error) {
    console.error(error)
    throw new createError.InternalServerError(error)
  }
}

export const handler = processAuctions
