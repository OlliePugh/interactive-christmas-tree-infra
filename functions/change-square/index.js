let functions = require("firebase-functions");
const admin = require("firebase-admin");
functions = functions.region("europe-west1");

const hasCoolDownFinished = require("../has-cool-down-finished/index.js");

const changeSquare = functions.https.onCall(async (data, context) => {
  if (!context.auth)
    return { status: "error", code: 401, message: "Not signed in" };

  const { colour, id, boardId } = data;
  // Authentication / user information is automatically added to the request.
  const uid = context.auth.uid;

  const action = {
    boardId: boardId,
    squareId: id,
    colour: colour,
    time: new Date(),
  };

  console.log("Starting transaction");
  try {
    hasCoolDownFinished({ admin, action, uid });
  } catch (e) {
    console.error(e);
    return { status: "too-many", code: 429 };
  }

  // add the action to the array of actions
  admin.database().ref(`board${boardId}/data/${id}`).set({ colour, id }); // update the pixel
  return { status: "ok", code: 200 };
});

module.exports = changeSquare;
