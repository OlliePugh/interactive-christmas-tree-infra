const admin = require("firebase-admin");

const storeBaubleBpm = (boardId, data) => {
  const bucket = admin.storage().bucket();
  const file = bucket.file(`board${boardId}`);
  const stream = file.createWriteStream({
    metadata: {
      contentType: "image/bmp",
    },
  });

  stream.end(data);
};

module.exports = storeBaubleBpm;
