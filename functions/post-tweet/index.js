let functions = require("firebase-functions");
functions = functions.region("europe-west1");
const takeScreenshot = require("./take-screenshot");
const { TwitterApi, EUploadMimeType } = require("twitter-api-v2");
const axios = require("axios");
const Jimp = require("jimp");

const { defineString } = require("firebase-functions/params");

const TWITTER_API_KEY = defineString("TWITTER_API_KEY");
const TWITTER_API_SECRET = defineString("TWITTER_API_SECRET");
const TWITTER_ACCESS_TOKEN = defineString("TWITTER_ACCESS_TOKEN");
const TWITTER_ACCESS_SECRET = defineString("TWITTER_ACCESS_SECRET");
const TWITTER_BEARER = defineString("TWITTER_BEARER");

const postTweet = functions.https.onRequest(async (req, res) => {
  const client = new TwitterApi({
    appKey: TWITTER_API_KEY.value(),
    appSecret: TWITTER_API_SECRET.value(),
    accessToken: TWITTER_ACCESS_TOKEN.value(),
    accessSecret: TWITTER_ACCESS_SECRET.value(),
    bearerToken: TWITTER_BEARER.value(),
  });

  const baubleBuffer = async (id) => {
    console.log(`getting bauble ${id}`);
    const result = await axios.get(
      `https://europe-west1-real-world-games.cloudfunctions.net/getBaubleBmp?id=${id}`,
      {
        responseType: "arraybuffer",
      }
    );
    console.log(`downloaded bauble ${id}`);

    const image = await Jimp.read(result.data);
    const resized = image.resize(640, 480);
    const png = resized.getBufferAsync(Jimp.MIME_PNG);

    console.log("converted to png");
    return png;
  };

  const addMedia = async (buffer) => {
    try {
      const mediaId = await client.v1.uploadMedia(buffer, {
        mimeType: EUploadMimeType.Png,
      });
      console.log(`uploaded media with id ${mediaId}`);
      return mediaId;
    } catch (e) {
      console.error(e);
    }
  };

  const imagePromises = [
    takeScreenshot(),
    baubleBuffer(1),
    baubleBuffer(2),
    baubleBuffer(3),
  ];

  await Promise.all(imagePromises);

  const uploadPromises = imagePromises.map((x) => addMedia(x));

  const mediaIds = await Promise.all(uploadPromises);

  console.log(mediaIds);

  await client.v2.tweet({
    text: "Twitter is a fantastic social network. Look at this:",
    media: { media_ids: mediaIds },
  });
  res.status(200).send();
});

module.exports = postTweet;
