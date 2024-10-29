const createAuctionSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        title: {
          type: "string",
          minLength: 1, // Ensure title is not an empty string
        },
      },
      required: ["title"], // Require title within the body
      additionalProperties: false, // Prevent additional properties
    },
  },
  required: ["body"], // Require the body
}

export default createAuctionSchema
