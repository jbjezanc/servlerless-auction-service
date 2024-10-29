const uploadAuctionPictureSchema = {
  type: "object",
  properties: {
    body: {
      type: "string",
      minLength: 1, // "The best thing I can do is minLength: 1  :))"
      // pattern: "=$", // Ends with equal sign - don't! this is not true!!!
    },
  },
  required: ["body"],
}

export default uploadAuctionPictureSchema
