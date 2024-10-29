import AWS from "aws-sdk"

const dynamodb = new AWS.DynamoDB.DocumentClient()
// Create new SQS client to be able to send email messages
const sqs = new AWS.SQS()

export async function closeAuction(auction) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: "set #status = :status",
    ExpressionAttributeValues: {
      ":status": "CLOSED",
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  }

  await dynamodb.update(params).promise()

  // Destructure the auction object to obtain info for our email
  const { title, seller, highestBid } = auction
  const { amount, bidder } = highestBid

  // Cover the case when there are no bids, and the time for auction is elapsed.
  if (amount === 0) {
    await sqs
      .sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
          subject: "No bids on your auction item :(",
          recipient: seller,
          body: `Shame! Your item "${title}" didn't get any bids. Better luck next time!`,
        }),
      })
      .promise()
    return
  }

  // Generate Promises - one for notifying the seller, and another
  // for notifying the bidder, and execute them the same time with
  // Promise.all
  const notifySeller = sqs
    .sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: "Your item has been sold!",
        recipient: seller,
        body: `Success! Your item "${title}" has been sold for $${amount}.`,
      }),
    })
    .promise()

  const notifyBidder = sqs
    .sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: "You won an auction!",
        recipient: bidder,
        body: `What a great deal! You got yourself a "${title}" for $${amount}.`,
      }),
    })
    .promise()

  // We want to wait both Promises to resolve, the order of executing doesn't matter.
  return Promise.all([notifySeller, notifyBidder])
}
