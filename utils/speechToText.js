require("dotenv").config();

const fs = require("fs");
const SpeechToTextV1 = require("ibm-watson/speech-to-text/v1");
const { IamAuthenticator } = require("ibm-watson/auth");

const SPEECH_TO_TEXT_IAM_APIKEY =
  "F_de1DoAkvwc7M5rq7HljDXsiVKTWa_TN_QmLhX6sni2";

const SpeechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: SPEECH_TO_TEXT_IAM_APIKEY || "<iam_apikey>",
  }),
});

const params = {
  contentType: "audio/mp3",
  objectMode: true,
};

function speechToText(fileUrl) {
  // create the stream
  const recognizeStream = SpeechToText.recognizeUsingWebSocket(params);

  // pipe in some audio
  fs.createReadStream(fileUrl).pipe(recognizeStream);

  recognizeStream.on("data", function (event) {
    onEvent("Data:", event);
  });
  recognizeStream.on("error", function (event) {
    onEvent("Error:", event);
  });
  recognizeStream.on("close", function (event) {
    onEvent("Close:", event);
  });

  // Displays events on the console.
  function onEvent(name, event) {
    console.log(name, JSON.stringify(event, null, 2));
  }
}

speechToText(__dirname + "/resources/recording.mp3");
