const bmp = require("bmp-js");

const getBaubleBmp = async ({ admin, boardId }) => {
  const snapshot = await admin
    .database()
    .ref(`board${boardId}/data`)
    .once("value");

  const data = snapshot.val();
  const pixels = [];

  Object.entries(data).forEach(([id, { colour }]) => {
    const red = colour.slice(1, 3);
    const green = colour.slice(3, 5);
    const blue = colour.slice(5, 7);
    pixels.push(Buffer.from("ff" + blue + green + red, "hex"));
  });
  const bmpData = {
    data: Buffer.concat(pixels),
    width: 160,
    height: 124,
  };
  return bmp.encode(bmpData).data;
};

module.exports = getBaubleBmp;
