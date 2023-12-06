let functions = require("firebase-functions");
const admin = require("firebase-admin");
functions = functions.region("europe-west1");
const axios = require("axios");
const secrets = require("../secrets.js");
const config = require("../config.js");

const changeBulk = functions.https.onCall(async (data, context) => {
  const uid = context.auth.uid;
  const adminRef = admin.firestore().collection("admins").doc(uid); // todo move into is admin
  const isAdminSnapshot = await adminRef.get();
  if (!isAdminSnapshot.exists || !isAdminSnapshot.data().isAdmin) {
    return { status: "forbidden", code: 403 };
  }

  isAdmin = isAdminSnapshot.data().isAdmin;

  if (isAdmin === false) return { status: "forbidden", code: 403 };
  /* I think this is covered above with JS falseyness
  nonsense but shouldve done this in typescript to be sure */

  const { colour, ids, boardId } = data;
  if (!Object.values(config.baubleColours).includes(colour)) {
    return {
      status: "error",
      code: 401,
      message: "Illegal colour - thanks for pointing this out rick roll man",
    };
  }

  ids.forEach(async (currentId) => {
    if (isNaN(currentId) || currentId < 0 || currentId >= 20480) {
      return {
        status: "error",
        code: 401,
        message: "Invalid square id",
      };
    }
    const updatePath = `board${boardId}/data/${currentId}`;
    const updateData = { colour, currentId };

    admin
      .database()
      .ref(updatePath)
      .set(updateData, (error) => {
        if (error) {
          console.error(`Error updating document with ID ${currentId}:`, error);
        } else {
          console.log(`Document with ID ${currentId} updated successfully!`);
        }
      });

    const change = {
      squareId: currentId,
      colour: colour,
      time: new Date(),
      uid,
    };
    await admin.firestore().collection(`board${boardId}`).doc().set(change);
  });

  return { status: "ok", code: 200 };
});

module.exports = changeBulk;
