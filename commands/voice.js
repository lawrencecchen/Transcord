module.exports = {
  name: "voice",
  description: "Join voice server!",
  cooldown: 0,
  async execute(message) {
    message.channel.send("Joining voice server...");
    let connection = null;
    if (message.member.voice.channel) {
      connection = await message.member.voice.channel.join();
    }
    if (connection) {
      // const audio = connection.receiver.createStream(message.member);

      // const dispatcher = connection.play(audio, { type: "opus" });
      const dispatcher = connection.play(
        "https://ia803207.us.archive.org/27/items/HamiltonMusical/1-01%20Alexander%20Hamilton.mp3"
      );

      dispatcher.on("start", () =>
        message.channel.send("Playing music on voice channel...")
      );
    }
  },
};
