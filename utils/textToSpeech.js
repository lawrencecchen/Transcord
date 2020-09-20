const textToSpeech = require("@google-cloud/text-to-speech");

const fs = require("fs");
const util = require("util");

const client = new textToSpeech.TextToSpeechClient();

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

quickStart("你很聰明", "cmn-TW");
