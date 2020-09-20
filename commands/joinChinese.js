require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { SpeechClient } = require("@google-cloud/speech");
const util = require("util");

const exec = util.promisify(require("child_process").exec);
const { Translate } = require("@google-cloud/translate").v2;
const textToSpeech = require("@google-cloud/text-to-speech");

const client = new textToSpeech.TextToSpeechClient();
const translate = new Translate();

const ffmpeg = require("fluent-ffmpeg");
const GoogleSpeechClient = new SpeechClient();

module.exports = {
    name: "join-chinese",
    description: "Join Chinese server!",
    cooldown: 0,
    async execute(message) {
        message.channel.send("Joining chinese server...");
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

                connection.on("speaking", async(user, speaking) => {
                    if (speaking.bitfield == 0 /*|| user.bot*/ ) {
                        return;
                    }
                    console.log(`I'm listening to ${user.username}`);
                    message.channel.send(`I'm listening to ${user.username}`);

                    const discordReadStream = connection.receiver.createStream(user, {
                        mode: "pcm",
                    });

                    const filename =
                        user.username.replace(/[^a-z0-9]/gi, "_").toLowerCase() +
                        "_" +
                        Date.now() +
                        ".tmp";

                    const filePath = path.join(__dirname, "..", "userAudio", filename);
                    const writeStream = fs.createWriteStream(filePath);

                    discordReadStream.pipe(writeStream);

                    writeStream.on("error", (err) =>
                        console.log("Write stream error", err)
                    );

                    // discordReadStream.on("data", (chunk) => {
                    //   console.log(`Received ${chunk.length} bytes of data.`);
                    // });

                    discordReadStream.on("end", async() => {
                        const stats = fs.statSync(filePath);
                        const fileSizeInBytes = stats.size;
                        const duration = fileSizeInBytes / 48000 / 4;
                        console.log("duration: " + duration);

                        if (duration < 0.5 || duration > 19) {
                            console.log("TOO SHORT / TOO LONG; SKIPPING");
                            fs.unlinkSync(filePath);
                            return;
                        }

                        const encodedFilePath = filePath.replace(".tmp", ".wav");
                        const { stdout, stderr } = await exec(
                            `ffmpeg -f s16le -ar 48k -ac 2 -i ${filePath} ${encodedFilePath}`
                        );
                        const file = fs.readFileSync(encodedFilePath);

                        const audioBytes = file.toString("base64");
                        const audio = {
                            content: audioBytes,
                        };
                        const config = {
                            encoding: "LINEAR16",
                            sampleRateHertz: 48000,
                            languageCode: "en-US",
                            audioChannelCount: 2,
                        };
                        const request = {
                            audio: audio,
                            config: config,
                        };

                        console.log("Sending query to google speech...");

                        const [response] = await GoogleSpeechClient.recognize(request);
                        const transcription = response.results
                            .map((result) => result.alternatives[0].transcript)
                            .join("\n");
                        console.log(`Transcription: ${transcription}`);

                        message.channel.send(`${user.username} said: ${transcription}`);
                        const text = transcription;
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
                });
            } catch (err) {
                console.log(err);
            }
        }
    },
};