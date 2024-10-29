const getAuctionsSchema = {
  type: "object",
  properties: {
    queryStringParameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["OPEN", "CLOSED"],
          default: "OPEN", // Sets default to "OPEN" if status is not provided
        },
      },
      // Mark `queryStringParameters` as optional
      additionalProperties: false,
    },
  },
}

export default getAuctionsSchema
