const createCustomAudioPlayer = require("../music/createCustomAudioPlayer");

module.exports = (guildID) => ({
    guildID,
    leaveTimeout: null,
    audioPlayer: createCustomAudioPlayer(this)
});