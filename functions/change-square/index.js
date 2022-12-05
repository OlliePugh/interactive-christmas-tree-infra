let functions = require("firebase-functions");
const admin = require("firebase-admin");
functions = functions.region("europe-west1");
const axios = require("axios");
const secrets = require("../secrets.js");
const config = require("../config.js");

const hasCoolDownFinished = require("../has-cool-down-finished/index.js");

const changeSquare = functions.https.onCall(async (data, context) => {
  if (!context.auth)
    return { status: "error", code: 401, message: "Not signed in" };

  const { colour, id, boardId } = data;
  if (!Object.values(config.baubleColours).includes(colour)) {
    return {
      status: "error",
      code: 401,
      message: "Illegal colour - thanks for pointing this out rick roll man",
    };
  }

  if (isNaN(id) || id < 0 || id >= 20480) {
    return {
      status: "error",
      code: 401,
      message: "Invalid square id",
    };
  }
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
    await hasCoolDownFinished({
      admin,
      action,
      uid,
      boardId,
      modifierCooldown: config.modifierCooldown,
    });
  } catch (e) {
    console.error(e);
    return { status: "too-many", code: 429 };
  }

  // add the action to the array of actions
  axios.get(
    `${secrets[`bauble${boardId}Ip`]}?light-id=${id}&colour=${colour.substring(
      1
    )}`,
    {
      headers: { Authorization: secrets.lightsApiKey },
    }
  );
  admin.database().ref(`board${boardId}/data/${id}`).set({ colour, id }); // update the pixel
  return { status: "ok", code: 200 };
});

module.exports = changeSquare;
