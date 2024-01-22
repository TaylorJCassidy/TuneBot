const queue = require("../music/queue");

module.exports = (guildID) => ({
    guildID,
    currentTrack: null,
    trackQueue: queue,
    isLooping: false,
    isPlaying: false
});