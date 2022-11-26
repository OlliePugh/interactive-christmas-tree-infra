let functions = require("firebase-functions");
const admin = require("firebase-admin");

const createProfile = functions.auth.user().onCreate((user) => {
  const userObject = { actions: [] };

  return admin
    .firestore()
    .doc("user-actions/" + user.uid)
    .set(userObject);
});

module.exports = createProfile;
