let functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const config = require("./config.js");
functions = functions.region("europe-west1");

exports.changeSquare = functions.https.onCall(async (data, context) => {
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

  console.log("Starting transaction");
  const userDocRef = admin.firestore().collection("user-actions").doc(uid);
  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const userActionsDoc = await transaction.get(userDocRef);

      if (!userActionsDoc.exists) {
        throw "Document does not exist!";
      }
      console.log("newAction", JSON.stringify(action));
      const sortedActions = userActionsDoc
        .data()
        .actions.filter((act) => act.boardId === boardId);

      const mostRecentAction = sortedActions[sortedActions.length - 1];
      console.log("mostRecentAction", JSON.stringify(mostRecentAction));

      if (mostRecentAction) {
        // if its not null
        const timeDelta =
          new Date().getTime() -
          new Date(mostRecentAction.time.seconds * 1000).getTime();

        console.log("Time Delta", timeDelta);

        if (timeDelta < config.modifierCooldown) {
          return Promise.reject("cooldown");
        }
      }

      // been over a minute let the user place it again
      console.log("Adding new action to the list of actions");
      await transaction.update(userDocRef, {
        actions: admin.firestore.FieldValue.arrayUnion(action),
      });
    });
  } catch (e) {
    console.error(e);
    return { status: "too-many", code: 429 };
  }

  // add the action to the array of actions
  admin.database().ref(`board${boardId}/data/${id}`).set({ color, id }); // update the pixel
  return { status: "ok", code: 200 };
});

exports.resetBoard = functions.https.onCall((data, context) => {
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
    board.data[index] = { id: index, color: "#ffffff" };
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
