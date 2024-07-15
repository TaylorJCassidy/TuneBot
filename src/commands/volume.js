const config = require('../configs/music.json');
const valid = require('../music/valid');

module.exports = {
    name: 'volume',
    aliases: ['bassboost'],
    run: function(msg, args, {guild}) {
        if (valid(msg, guild)) {
            if (isNaN(args) || args < 1 || args > config.MAX_VOLUME) {
                msg.channel.send(config.INVALID_VOLUME);
            }
            else if (guild.audioPlayer.isPlaying()) {
                guild.audioPlayer.setVolume(args);
                msg.channel.send(config.VOLUME_CHANGED.replace('1', args));
            }
            else {
                msg.channel.send(config.NO_CURRENT_TRACK);
            }
        }
        else msg.channel.send(config.NOT_IN_CHANNEL);
    }
};