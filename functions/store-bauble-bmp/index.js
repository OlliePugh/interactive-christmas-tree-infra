const admin = require("firebase-admin");
const Jimp = require("jimp");

const storeBaubleBmp = (boardId, data) =>
  storeData(`board${boardId}`, data, Jimp.MIME_BMP);

const storeData = (filename, data, contentType) => {
  const bucket = admin.storage().bucket();
  const file = bucket.file(filename);
  const stream = file.createWriteStream({
    metadata: {
      contentType: contentType,
    },
  });
  stream.end(data);
};

// data is a bmp buffer
const storeBaubleJpeg = async (boardId, data) => {
  const image = await Jimp.read(data);
  const resized = image.resize(640, 480);
  const jpeg = await resized.getBufferAsync(Jimp.MIME_JPEG);
  storeData(`board${boardId}.jpeg`, jpeg, Jimp.MIME_JPEG);
};

module.exports = { storeBaubleBmp, storeBaubleJpeg };
