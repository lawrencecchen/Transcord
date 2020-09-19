module.exports = {
  name: "leave",
  description: "leave server",
  cooldown: 0,
  async execute(message) {
    let connection = null;
    if (message.member.voice.channel) {
      connection = await message.member.voice.channel.leave();
      message.channel.send("Leaving channel...");
    }
  },
};
