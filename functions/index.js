let functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
functions = functions.region("europe-west1");

exports.changeSquare = functions.https.onCall((data, context) => {
  if (!context.auth)
    return { status: "error", code: 401, message: "Not signed in" };

  const { color, id, boardId } = data;
  // Authentication / user information is automatically added to the request.
  const uid = context.auth.uid;

  const action = {
    boardId: boardId,
    squareId: id,
    color: color,
    time: new Date(),
  };

  const userActionsRef = admin.firestore().collection("user-actions").doc(uid); // get the user actions from firestore
  // add the action to the array of actions
  userActionsRef.update({
    actions: admin.firestore.FieldValue.arrayUnion(action),
  });

  admin.database().ref(`board${boardId}/${id}`).set({ color, id }); // update the pixel

  return { status: "ok", code: 200 };
});

exports.resetBoard = functions.https.onCall((data, context) => {
  if (!context.auth || context.auth.uid !== "gtfpqsy1DLhy4AEndnsppYFFeH22")
    return { status: "error", code: 401, message: "Not signed in" };
  // hardcoded to just me for now

  const { boardId, width, height } = data;
  // Authentication / user information is automatically added to the request.
  const board = {};
  for (let index = 0; index < width * height; index++) {
    board[index] = { id: index, color: "#ffffff" };
  }

  admin.database().ref(`board${boardId}/`).set(board); // update the entire board

  return { status: "ok", code: 200 };
});

exports.createProfile = functions.auth.user().onCreate((user) => {
  const userObject = { actions: [] };

  return admin
    .firestore()
    .doc("user-actions/" + user.uid)
    .set(userObject);
});
