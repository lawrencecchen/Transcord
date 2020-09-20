require("dotenv").config();

const fs = require("fs");
const path = require("path");
const SpeechToTextV1 = require("ibm-watson/speech-to-text/v1");
const { IamAuthenticator } = require("ibm-watson/auth");
// const Lame = require("node-lame").Lame;
const lame = require("@suldashi/lame");
const streamifier = require("streamifier");
const { Translate } = require("@google-cloud/translate").v2;
const textToSpeech = require("@google-cloud/text-to-speech");
const util = require("util");

const client = new textToSpeech.TextToSpeechClient();
const translate = new Translate();
// const translate = require('../utils/translate.js');
// const { Encoder } = require("lame");
// var encoder = new lame.Encoder({
//     // input
//     channels: 2, // 2 channels (left and right)
//     bitDepth: 16, // 16-bit samples
//     sampleRate: 48000, // 44,100 Hz sample rate

//     // output
//     bitRate: 128,
//     outSampleRate: 22050,
//     mode: lame.STEREO // STEREO (default), JOINTSTEREO, DUALCHANNEL or MONO
// });

function translateTextSample(text, target) {
    const { Translate } = require("@google-cloud/translate").v2;

    const translate = new Translate();

    async function translateText() {
        let [translations] = await translate.translate(text, target);
        translations = Array.isArray(translations) ? translations : [translations];
        console.log("Translations:");
        translations.forEach((translation, i) => {
            console.log(`${text[i]} => (${target}) ${translation}`);
        });
    }
    translateText();
}

// console.log(translateTextSample("You are smart.", "zh-TW"));



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
    rate: 22050,
};
const recognizeStream = SpeechToText.recognizeUsingWebSocket(params);

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








        recognizeStream.on("data", function(event) {
            console.log("Data");
            const transcript = event.results[0].alternatives[0].transcript;
            // if (transcript.length < 1) {
            //     return;
            // }

            onEvent("Data:", event);

            function onEvent(name, event) {
                console.log(name, JSON.stringify(event, null, 2));
            }

            message.channel.send(`${message.author.toString()} said ${transcript}`);
            const text = transcript;
            const target = "zh-TW";
            async function quickStart(text, target) {
                const request = {
                    input: { text: text },
                    voice: { languageCode: target, ssmlGender: "NEUTRAL" },
                    audioConfig: { audioEncoding: "MP3" },
                };

                // Performs the text-to-speech request
                const [response] = await client.synthesizeSpeech(request);
                // Write the binary audio content to a local file
                const writeFile = util.promisify(fs.writeFile);
                await writeFile("output.mp3", response.audioContent, "binary");
                console.log("Audio content written to file: output.mp3");
            }
            async function translateText(message) {
                let [translations] = await translate.translate(text, target);
                translations = Array.isArray(translations) ? translations : [translations];
                console.log("Translations:");
                translations.forEach((translation, i) => {
                    message.channel.send(`${text[i]} => (${target}) ${translation}`);

                    quickStart(translations[i], target);
                    connection.play('output.mp3');
                });
            }
            translateText(message);
        });

        if (connection) {
            try {
                console.log("Ready for speaking");

                connection.on("speaking", async(user, speaking) => {
                    if (speaking.bitfield == 0 /*|| user.bot*/ ) {
                        return;
                    }
                    console.log(`I'm listening to ${user.username}`);
                    message.channel.send(`I'm listening to ${user.username}`);

                    const discordReadStream = connection.receiver.createStream(user, {
                        mode: "pcm",
                    });
                    discordReadStream.pipe(new lame.Encoder({
                        // input
                        channels: 2, // 2 channels (left and right)
                        bitDepth: 16, // 16-bit samples
                        sampleRate: 48000, // 44,100 Hz sample rate

                        // output
                        bitRate: 128,
                        outSampleRate: 22050,
                        mode: lame.STEREO // STEREO (default), JOINTSTEREO, DUALCHANNEL or MONO
                    })).pipe(fs.createWriteStream(path.join(__dirname, '..', 'alien3.mp3')));

                    const writeStream = fs.createWriteStream(path.join(__dirname, '..', 'alien3.mp3'))

                    writeStream.on("error", (err) => console.log("Write stream error", err))

                    discordReadStream.on("data", (chunk) => {
                        console.log(`Received ${chunk.length} bytes of data.`);
                        // discordReadStream.pipe(writeStream);
                        // discordReadStream.pipe(recognizeStream);



                        // recognizeStream.on("data", function(event) {
                        //     console.log("Data");
                        //     const transcript = event.results.alternatives.transcript;
                        //     if (transcript.length < 1) {
                        //         return;
                        //     }

                        //     onEvent("Data:", event);
                        //     console.log(`${message.author.toString()} said ${transcript}`);
                        // });
                        // console.log(recognizeStream);


                        // encoder.encode()
                        //     .then(() => {
                        //         // const mp3Stream = streamifier.createReadStream(encoder.getBuffer());
                        //         // console.log(mp3Stream);
                        //         // mp3Stream.pipe(recognizeStream);
                        //     })


                    });

                    discordReadStream.on("end", async() => {
                        // connection.play(encoder);
                        mp3Stream = fs.createReadStream(path.join(__dirname, '..', 'alien3.mp3'));
                        // const recognizeStream = SpeechToText.recognizeUsingWebSocket(params);
                        mp3Stream.pipe(recognizeStream);
                    });

                    // const temp =
                    // user.username.replace(/[^a-z0-9]/gi, "_").toLowerCase() +
                    // "_" +
                    // Date.now() +
                    // ".tmp";

                    // const filename = path.join(__dirname, "..", "userAudio", temp);
                    // const writeStream = fs.createWriteStream(filename);
                    // const discordStream = connection.receiver.createStream(user);
                    // discordStream.pipe(writeStream);
                    // console.log(discordStream);



                    // discordStream.on("error", (e) => {
                    //     console.log("audioStreamError: " + e);
                    // });

                    // discordStream.on("data", (chunk) => {
                    //     console.log(`Received ${chunk.length} bytes of data.`);
                    // });
                    // discordStream.on("end", async() => {
                    //     const stats = fs.statSync(filename);
                    //     const fileSizeInBytes = stats.size;
                    //     const duration = fileSizeInBytes / 48000 / 4;
                    //     console.log("duration: " + duration);
                    //     if (duration < 0.5 || duration > 19) {
                    //         console.log("TOO SHORT / TOO LONG; SKIPPING");
                    //         fs.unlinkSync(filename);
                    //         return;
                    //     }
                    //     console.log("Stream has ended");
                    // });
                });
            } catch (err) {
                console.log(err)
            }
        }
    },
};