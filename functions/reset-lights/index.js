let functions = require("firebase-functions");
const admin = require("firebase-admin");

const resetLights = functions.https.onCall((data, context) => {
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

module.exports = resetLights;
