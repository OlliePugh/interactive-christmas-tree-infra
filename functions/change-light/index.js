let functions = require("firebase-functions");
functions = functions.region("europe-west1");
const admin = require("firebase-admin");
const hasCoolDownFinished = require("../has-cool-down-finished/index.js");
const config = require("../config.js");
const axios = require("axios");
const secrets = require("../secrets.js");

const changeLight = functions.https.onCall(async (data, context) => {
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
      boardId: 0,
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

module.exports = changeLight;
