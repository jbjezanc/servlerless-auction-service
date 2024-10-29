const placeBidSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        amount: {
          type: "number",
        },
      },
      required: ["amount"], // Require title within the body
      additionalProperties: false, // Prevent additional properties
    },
  },
  required: ["body"], // Require the body
}

export default placeBidSchema
