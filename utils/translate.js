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

console.log(translateTextSample("You are smart.", "zh-TW"));
