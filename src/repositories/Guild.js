const createCustomAudioPlayer = require("../music/createCustomAudioPlayer");

module.exports = (guildId) => ({
    guildId,
    leaveTimeout: null,
    audioPlayer: createCustomAudioPlayer(this)
});