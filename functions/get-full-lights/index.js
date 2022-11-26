let functions = require("firebase-functions");
const admin = require("firebase-admin");
const secrets = require("../secrets.js");

const getFullLights = functions.https.onRequest(async (req, res) => {
  if (req.get("Authorization") !== secrets.lightsApiKey) {
    res.sendStatus(401);
    return;
  }
  const snapshot = await admin.database().ref(`lights/data`).once("value");
  const data = snapshot.val();
  res.status(200).send(JSON.stringify(data));
});

module.exports = getFullLights;
