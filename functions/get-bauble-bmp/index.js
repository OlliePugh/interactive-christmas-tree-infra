const getBaubleBmp = async ({ admin, boardId }) => {
  const snapshot = await admin
    .database()
    .ref(`board${boardId}/data`)
    .once("value");

  const data = snapshot.val();
  const pixels = [];

  Object.entries(data).forEach(([id, { color }]) => {
    pixels.push(Buffer.from(color.slice(1), "hex"));
  });
  console.log(Buffer.concat(pixels));
  return true;
};

module.exports = getBaubleBmp;
