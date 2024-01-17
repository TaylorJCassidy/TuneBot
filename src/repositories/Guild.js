const MusicPlayer = require('../music/MusicPlayer');

module.exports = (guildID) => ({
    guildID,
    musicController: new MusicPlayer().musicController
});