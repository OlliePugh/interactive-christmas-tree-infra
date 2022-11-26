let functions = require("firebase-functions");
const admin = require("firebase-admin");
functions = functions.region("europe-west1");

const resetBoard = functions.https.onCall((data, context) => {
  if (!context.auth || context.auth.uid !== "gtfpqsy1DLhy4AEndnsppYFFeH22")
    return { status: "error", code: 401, message: "Not signed in" };
  // hardcoded to just me for now

  const { boardId, width, height } = data;
  // Authentication / user information is automatically added to the request.
  const board = {
    metadata: {
      height: height,
      width: width,
    },
    data: {},
  };
  for (let index = 0; index < width * height; index++) {
    board.data[index] = { id: index, colour: "#ffffff" };
  }

  admin.database().ref(`board${boardId}/`).set(board); // update the entire board

  return { status: "ok", code: 200 };
});

module.exports = resetBoard;
