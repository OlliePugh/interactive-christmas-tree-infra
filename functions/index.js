let functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const config = require("./config.js");
functions = functions.region("europe-west1");
const hasCoolDownFinished = require("./has-cool-down-finished/index.js");
const getBaubleBmp = require("./get-bauble-bmp");
const secrets = require("./secrets.js");
const axios = require("axios");

exports.changeSquare = functions.https.onCall(async (data, context) => {
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
    board.data[index] = { id: index, colour: "#ffffff" };
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

  const { colour, id } = data;
  // Authentication / user information is automatically added to the request.
  const uid = context.auth.uid;

  const action = {
    boardId: 0,
    squareId: id,
    colour: colour,
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
  axios.get(`${secrets.lightsIp}?bulb-id=${id}&colour=${colour.substring(1)}`, {
    headers: { Authorization: secrets.lightsApiKey },
  });
  admin.database().ref(`lights/data/${id}`).set(colour); // update the pixel
  return { status: "ok", code: 200 };
});

exports.getFullLights = functions.https.onRequest(async (req, res) => {
  if (req.get("Authorization") !== secrets.lightsApiKey) {
    res.sendStatus(401);
    return;
  }
  const snapshot = await admin.database().ref(`lights/data`).once("value");
  const data = snapshot.val();
  res.status(200).send(JSON.stringify(data));
});
exports.createProfile = functions.auth.user().onCreate((user) => {
  const userObject = { actions: [] };

  return admin
    .firestore()
    .doc("user-actions/" + user.uid)
    .set(userObject);
});

const _createCacheLights = async () => {
  const snapshot = await admin.database().ref(`lights/data`).once("value");
  const data = snapshot.val();

  const bucket = admin.storage().bucket();
  try {
    await bucket.file("lights.json").save(JSON.stringify(data));
  } catch (e) {
    console.log(e);
    console.log("File upload failed");
  }
};

// exports.createCacheLights = functions.pubsub.schedule("* * * * *").onRun(() => {
//   _createCacheLights();
// });

// exports.testCreateCacheLights = functions.https.onRequest(async (req, res) => {
//   _createCacheLights();
//   res.sendStatus(200);
// });

// exports.baubleBmpCronJob = functions.pubsub.schedule("* * * * *").onRun(() => {
//   getBaubleBmp();
// });

exports.getBaubleBmp = functions.https.onRequest(async (req, res) => {
  const byteResult = await getBaubleBmp({ admin, boardId: req.query.id });
  console.log(byteResult);
  res.sendStatus(200);
});
