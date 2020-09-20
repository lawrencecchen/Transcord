require("dotenv").config();

const fs = require("fs");
const path = require("path");
const SpeechToTextV1 = require("ibm-watson/speech-to-text/v1");
const { IamAuthenticator } = require("ibm-watson/auth");
const { SpeechClient } = require("@google-cloud/speech")

const GoogleSpeechClient = new SpeechClient();

const SPEECH_TO_TEXT_IAM_APIKEY =
  "F_de1DoAkvwc7M5rq7HljDXsiVKTWa_TN_QmLhX6sni2";

const SpeechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: SPEECH_TO_TEXT_IAM_APIKEY || "<iam_apikey>",
  }),
});

const params = {
  contentType: "audio/wav",
  objectMode: true,
};
const recognizeStream = SpeechToText.recognizeUsingWebSocket(params);

// recognizeStream.on("data", function(event) {
//     const transcript = event.results.alternatives.transcript;
//     if (transcript.length < 1) {
//         return;
//     }

//     onEvent("Data:", event);
//     console.log(`${message.author.toString()} said ${transcript}`);
// });
// recognizeStream.on("error", function(event) {
//     onEvent("Error:", event);
// });
// recognizeStream.on("close", function(event) {
//     onEvent("Close:", event);
// });

// function onEvent(name, event) {
//     console.log(name, JSON.stringify(event, null, 2));
// }

module.exports = {
  name: "join-english",
  description: "Join English server!",
  cooldown: 0,
  async execute(message) {
    message.channel.send("Joining english server...");
    let connection = null;

    if (message.member.voice.channel) {
      const voiceChannel = message.guild.channels.cache.find(
        (channel) => channel.name === "english"
      );
      connection = await voiceChannel.join();
    }

    if (connection) {
      try {
        console.log("Ready for speaking");

        connection.on("speaking", async (user, speaking) => {
          if (speaking.bitfield == 0 /*|| user.bot*/) {
            return;
          }
          console.log(`I'm listening to ${user.username}`);
          message.channel.send(`I'm listening to ${user.username}`);

          const discordReadStream = connection.receiver.createStream(user, {
            mode: "pcm",
          });

          const filename = user.username.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_' + Date.now() + '.tmp';
          const filePath = path.join(__dirname, '..', 'userAudio', filename)
          const writeStream = fs.createWriteStream(filePath)

          discordReadStream.pipe(writeStream)

          writeStream.on("error", (err) => console.log("Write stream error", err))

          // discordReadStream.on("data", (chunk) => {
          //   console.log(`Received ${chunk.length} bytes of data.`);
          // });

          discordReadStream.on("end", async () => {
            const stats = fs.statSync(filePath);
            const fileSizeInBytes = stats.size;
            const duration = fileSizeInBytes / 48000 / 4;
            console.log("duration: " + duration)

            if (duration < 0.5 || duration > 19) {
              console.log("TOO SHORT / TOO LONG; SKIPPING")
              fs.unlinkSync(filePath)
              return;
            }

            const file = fs.readFileSync(filePath)
            const audioBytes = file.toString('base64')
            const audio = {
              content: audioBytes
            }
            const config = {
              encoding: 'LINEAR16',
              sampleRateHertz: 48000,
              languageCode: 'en-US',
            };
            const request = {
              audio: audio,
              config: config,
            };

            console.log("Sending query to google speech...")

            const [response] = await GoogleSpeechClient.recognize(request);
            const transcription = response.results
              .map(result => result.alternatives[0].transcript)
              .join('\n');
            console.log(`Transcription: ${transcription}`);

            message.channel.send(`${user.username} said ${transcription}`)
          })
        });
      } catch (err) {
        console.log(err)
      }
    }
  },
};
