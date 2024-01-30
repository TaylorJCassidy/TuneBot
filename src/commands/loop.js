const config = require('../configs/music.json');
const valid = require('../music/valid');

module.exports = {
    name: 'loop',
    run: function(msg, args, {guild}) {
        if (valid(msg, guild)) {
            const isLooping = guild.audioPlayer.toggleLooping();
            msg.channel.send(isLooping ? config.NOW_LOOPING : config.NO_LONGER_LOOPING);
        }
        else msg.channel.send(config.NOT_IN_CHANNEL);
    }
};