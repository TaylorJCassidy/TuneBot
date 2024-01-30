const config = require('../configs/music.json');

module.exports = {
    name: 'loop',
    run: function(msg, args, {guild}) {
        const isLooping = guild.audioPlayer.toggleLooping();
        msg.channel.send(isLooping ? config.NOW_LOOPING : config.NO_LONGER_LOOPING);
    }
};