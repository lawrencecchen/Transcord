require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { SpeechClient } = require("@google-cloud/speech");
const util = require("util");

const exec = util.promisify(require("child_process").exec);

async function speechToText(inputFile) {
  const outputFile = inputFile.replace(".tmp", ".wav");
  await exec(`ffmpeg -f s16le -ar 48k -ac 2 -i demo.tmp demoOut.wav`);
}

async function main() {
  // Imports the Google Cloud client library

  // Creates a client
  const client = new SpeechClient();

  // The name of the audio file to transcribe
  const fileName = path.join(__dirname, "resources", "demo.tmp");

  // Reads a local audio file and converts it to base64
  const file = fs.readFileSync(fileName);

  // const audioBytes = file.toString("base64");

  // // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  // const audio = {
  //   content: audioBytes,
  // };
  // const config = {
  //   encoding: "LINEAR16",
  //   sampleRateHertz: 48000,
  //   languageCode: "en-US",
  // };
  // const request = {
  //   audio: audio,
  //   config: config,
  // };

  // // Detects speech in the audio file
  // const [response] = await client.recognize(request);
  // console.log(response);
  // const transcription = response.results
  //   .map((result) => result.alternatives[0].transcript)
  //   .join("\n");
  // console.log(`Transcription: ${transcription}`);
}

// main().catch(console.error);
