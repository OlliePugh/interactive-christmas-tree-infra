let functions = require("firebase-functions");
const admin = require("firebase-admin");
const { defineSecret } = require("firebase-functions/params");
admin.initializeApp({
  ...functions.config().firebase,
  databaseURL:
    "https://interactive-christmas-tree.europe-west1.firebasedatabase.app/",
  storageBucket: "real-world-games.appspot.com",
});
functions = functions.region("europe-west1");
const storeBaubleBmp = require("./store-bauble-bmp");

const getBaubleBmp = require("./get-bauble-bmp");

exports.changeSquare = require("./change-square/index.js");

exports.resetBoard = require("./reset-board/index.js");

exports.resetLights = require("./reset-lights/index.js");

exports.changeLight = require("./change-light/index.js");

exports.getFullLights = require("./get-full-lights/index.js");

exports.postTweet = require("./post-tweet/index.js");

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

const _baubleBmpCronJob = async (boardId) => {
  const bmpData = await getBaubleBmp({ admin, boardId });
  storeBaubleBmp(boardId, bmpData);
};

exports.baubleBmpCronJob1 = functions.pubsub
  .schedule("0 * * * *")
  .onRun(async () => {
    await Promise.all([
      _baubleBmpCronJob(1),
      _baubleBmpCronJob(2),
      _baubleBmpCronJob(3),
    ]);
  });

exports.baubleBmpCronJob2 = functions.pubsub
  .schedule("10 * * * *")
  .onRun(async () => {
    await Promise.all([
      _baubleBmpCronJob(1),
      _baubleBmpCronJob(2),
      _baubleBmpCronJob(3),
    ]);
  });

exports.baubleBmpCronJob3 = functions.pubsub
  .schedule("20 * * * *")
  .onRun(async () => {
    await Promise.all([
      _baubleBmpCronJob(1),
      _baubleBmpCronJob(2),
      _baubleBmpCronJob(3),
    ]);
  });

exports.baubleBmpCronJob4 = functions.pubsub
  .schedule("30 * * * *")
  .onRun(async () => {
    await Promise.all([
      _baubleBmpCronJob(1),
      _baubleBmpCronJob(2),
      _baubleBmpCronJob(3),
    ]);
  });

exports.baubleBmpCronJob5 = functions.pubsub
  .schedule("40 * * * *")
  .onRun(async () => {
    await Promise.all([
      _baubleBmpCronJob(1),
      _baubleBmpCronJob(2),
      _baubleBmpCronJob(3),
    ]);
  });

exports.baubleBmpCronJob6 = functions.pubsub
  .schedule("50 * * * *")
  .onRun(async () => {
    await Promise.all([
      _baubleBmpCronJob(1),
      _baubleBmpCronJob(2),
      _baubleBmpCronJob(3),
    ]);
  });

// exports.testbaubleBmpCronJob = functions.https.onRequest(async (req, res) => {
//   await _baubleBmpCronJob(req.query.id);
//   res.sendStatus(200);
// });

exports.getBaubleBmp = functions.https.onRequest(async (req, res) => {
  const boardId = req.query.id;
  const byteResult = await getBaubleBmp({ admin, boardId });
  res.writeHead(200, {
    "Content-Type": "image/bmp",
    "Content-disposition": `inline;filename=bauble${boardId}.bmp`,
    "Content-Length": Buffer.byteLength(byteResult),
  });
  res.end(byteResult);
});
