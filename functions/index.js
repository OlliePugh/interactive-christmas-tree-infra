let functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const config = require("./config.js");
functions = functions.region("europe-west1");
const hasCoolDownFinished = require("./has-cool-down-finished/index.js");

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
  try {
    hasCoolDownFinished({ admin, action, uid });
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

exports.resetLights = functions.https.onCall((data, context) => {
  if (!context.auth || context.auth.uid !== "gtfpqsy1DLhy4AEndnsppYFFeH22")
    return { status: "error", code: 401, message: "Not signed in" };
  // hardcoded to just me for now

  const { length } = data;
  // Authentication / user information is automatically added to the request.
  const lights = {
    metadata: {
      length,
    },
    data: {},
  };
  for (let index = 0; index < length; index++) {
    lights.data[index] = "#ffffff";
  }

  admin.database().ref(`lights/`).set(lights); // update the entire board

  return { status: "ok", code: 200 };
});

exports.changeLight = functions.https.onCall(async (data, context) => {
  if (!context.auth)
    return { status: "error", code: 401, message: "Not signed in" };

  const { color, id } = data;
  // Authentication / user information is automatically added to the request.
  const uid = context.auth.uid;

  const action = {
    boardId: 0,
    squareId: id,
    color: color,
    time: new Date(),
  };

  console.log("Starting transaction");
  try {
    await hasCoolDownFinished({
      admin,
      action,
      uid,
      modifierCooldown: config.modifierCooldown,
    });
  } catch (e) {
    console.error(e);
    return { status: "too-many", code: 429 }; // cooldown has not finished
  }

  admin.database().ref(`lights/data/${id}`).set(color); // update the pixel
  return { status: "ok", code: 200 };
});

exports.createProfile = functions.auth.user().onCreate((user) => {
  const userObject = { actions: [] };

  return admin
    .firestore()
    .doc("user-actions/" + user.uid)
    .set(userObject);
});
