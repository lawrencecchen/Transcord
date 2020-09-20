require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { SpeechClient } = require("@google-cloud/speech").v1p1beta1;
const util = require("util");
const Discord = require('discord.js')
const exec = util.promisify(require("child_process").exec);
const { Translate } = require("@google-cloud/translate").v2;
const textToSpeech = require("@google-cloud/text-to-speech");
const GoogleSpeechClient = new SpeechClient();
const { prefix, token } = require("../config");

var otherLanguage;
var otherLanguageEnglish;
var origLanguageSTT;
var origLanguage;
var origLanguageEnglish;

// Google Cloud API for text to speech
const client = new textToSpeech.TextToSpeechClient();
async function googleTextToSpeech(text, target, connection, message) {
    const request = {
        input: { text: text },
        voice: { languageCode: target, ssmlGender: "NEUTRAL" },
        audioConfig: { audioEncoding: "MP3" },
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(`${message.channel}.mp3`, response.audioContent, "binary");
    console.log("Audio content written to file");
    connection.play(`${message.channel}.mp3`);
}

// Google Cloud API for translate
const translate = new Translate();
async function translateText(text, target, message, connection, user) {
    let [translations] = await translate.translate(text, target);
    translations = Array.isArray(translations) ? translations : [translations];
    console.log("Translations:");
    console.log(translations)
    const originalLanguage = (target === origLanguage) ? otherLanguageEnglish : origLanguageEnglish;
    const targetLanguage = (target === origLanguage) ? origLanguageEnglish : otherLanguageEnglish;

    translations.forEach((translation, i) => {
        const embedDescription = `**${originalLanguage}:** ${text} \n **${targetLanguage}:** ${translation}`;

        //Text translated text to chat
        const conversationCard = new Discord.MessageEmbed().setTitle(`${user.username} says`).setDescription(embedDescription).setFooter('Transcord: Built by 3S1N', 'https://i.ibb.co/n161zYJ/transcord-logo-blue.png');
        message.channel.send(conversationCard);

        // textToSpeechWatson(translations[i], target, connection);
        googleTextToSpeech(translations[i], target, connection, message);
    });
}

// IBM Watson APIs for text to speech
const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const { createContext } = require("vm");

const WatsonTextToSpeech = new TextToSpeechV1({
    authenticator: new IamAuthenticator({
        apikey: process.env.WATSON_VOICE_KEY,
    }),
    serviceUrl: 'https://api.us-south.text-to-speech.watson.cloud.ibm.com/instances/39070628-c9e1-4408-abc9-1aa8f69bc315',
});

async function textToSpeechWatson(text, target, connection) {
    connection.play("alien3.mp3")
    const voices = {
        'en': 'en-US_AllisonV3Voice',
        'zh-TW': 'zh-CN_ZhangJingVoice'
    }

    if (!target in voices) {
        throw new Error("Target is wrong")
    }

    const synthesizeParams = {
        text: text,
        accept: 'audio/mp3',
        voice: voices[target],
    };

    WatsonTextToSpeech.synthesize(synthesizeParams)
        .then(async(response) => {
            // only necessary for wav formats,
            // otherwise `response.result` can be directly piped to a file
            // const writeFile = util.promisify(fs.writeFile);
            // await writeFile("output.mp3", response.result, "binary");
            response.result.pipe(fs.createWriteStream('output.mp3'));
            console.log("Audio content written to file: output.mp3");
            connection.play('output.mp3');
        })
        .catch(err => {
            console.log('error:', err);
        });
}

module.exports = {
    name: "start",
    description: "Start Transcord!",
    cooldown: 0,
    async execute(message) {

        let connection = null;

        const args = message.content.slice(prefix.length).trim().split(' ');
        if (args[1] === "japanese") {
            otherLanguage = "ja";
            otherLanguageSTT = "ja-jp";
            otherLanguageEnglish = "Japanese";
        } else if (args[1] === "english") {
            otherLanguage = "en";
            otherLanguageSTT = "en-us";
            otherLanguageEnglish = "English";
        } else if (args[1] === "spanish") {
            otherLanguage = "es";
            otherLanguageSTT = "es-es";
            otherLanguageEnglish = "Spanish";
        } else if (args[1] === "korean") {
            otherLanguage = "ko";
            otherLanguageSTT = "ko-kr";
            otherLanguageEnglish = "Korean";
        } else if (args[1] === "Chinese") {
            otherLanguage = "zh-TW";
            otherLanguageSTT = "cmn-hant-tw";
            otherLanguageEnglish = "Chinese";
        } else {
            const languageErrorCard = new Discord.MessageEmbed().setColor('RED').setTitle('Language argument error').setDescription('No input for first language. \n Format: -start <language1> <language2>').setFooter('Transcord: Built by 3S1N', 'https://i.ibb.co/n161zYJ/transcord-logo-blue.png');
            message.channel.send(languageErrorCard);
            return;
        }

        if (args[2] === "japanese") {
            origLanguage = "ja";
            origLanguageSTT = "ja-jp";
            origLanguageEnglish = "Japanese";
        } else if (args[2] === "english") {
            origLanguage = "en";
            origLanguageSTT = "en-us";
            origLanguageEnglish = "English";
        } else if (args[2] === "spanish") {
            origLanguage = "es";
            origLanguageSTT = "es-ew";
            origLanguageEnglish = "Spanish";
        } else if (args[2] === "korean") {
            origLanguage = "ko";
            origLanguageSTT = "ko-kr";
            origLanguageEnglish = "Korean";
        } else if (args[2] === "chinese") {
            origLanguage = "zh-TW";
            origLanguageSTT = "cmn-hant-tw";
            origLanguageEnglish = "Chinese";
        } else {
            const languageErrorCard = new Discord.MessageEmbed().setColor('RED').setTitle('Language argument error').setDescription('No input for second language. \n Format: -start <language1> <language2>').setFooter('Provided by Transcord', 'https://i.ibb.co/n161zYJ/transcord-logo-blue.png');
            message.channel.send(languageErrorCard);
            return;
        }

        if (message.member.voice.channel) {
            const voiceChannel = message.member.voice.channel;
            connection = await voiceChannel.join();
        }

        if (connection) {
            try {
                console.log("Transcord is ready!");
                const readyCard = new Discord.MessageEmbed().setTitle(`Transcord is ready!`).setFooter('Transcord: Built by 3S1N', 'https://i.ibb.co/n161zYJ/transcord-logo-blue.png');
                message.channel.send(readyCard);

                connection.on("speaking", async(user, speaking) => {
                    if (speaking.bitfield == 0 /*|| user.bot*/ ) {
                        return;
                    }
                    console.log(`I'm listening to ${user.username}`);

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
                            alternativeLanguageCodes: ["zh-TW", "ja"],

                        };
                        const request = {
                            audio: audio,
                            config: config,
                        };

                        console.log("Sending query to google speech...");

                        const [response] = await GoogleSpeechClient.recognize(request);

                        //getting transcription response from api
                        const transcription = response.results
                            .map((result) => result.alternatives[0].transcript)
                            .join("\n");

                        // remove raw (.tmp) and .wav files
                        fs.unlinkSync(filePath);
                        fs.unlinkSync(encodedFilePath);

                        // If there is nothing in transcription, do not continue
                        if (!transcription || transcription.length === 0) {
                            return;
                        }

                        // Working with languages of Chinese and English zh-TW = chinese, en = english
                        console.log(origLanguageSTT);
                        console.log("speech to text:" +
                            response.results[0].languageCode);
                        if (response.results[0].languageCode === origLanguageSTT) {
                            target = otherLanguage;
                        } else if (response.results[0].languageCode === otherLanguageSTT) {
                            target = origLanguage;
                        } else {
                            const inErrCard = new Discord.MessageEmbed().setColor('RED').setTitle('Language input error').setDescription('Are you sure you are speaking in ' + origLanguageEnglish + ' or ' + otherLanguageEnglish + '?').setFooter('Transcord: Built by 3S1N', 'https://i.ibb.co/n161zYJ/transcord-logo-blue.png');
                            message.channel.send(inErrCard);
                            return;
                        }

                        console.log(target);
                        translateText(transcription, target, message, connection, user);
                    });
                });
            } catch (err) {
                console.log(err);
            }
        }
    },
};