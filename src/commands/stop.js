const config = require('../configs/music.json');
const valid = require('../music/valid');

module.exports = {
    name: 'stop',
    run: function(msg, args, {guild}) {
        if (valid(msg, guild)) {
            if (guild.audioPlayer.stop()) {
                msg.channel.send(config.STOPPED);
            }
            else {
                msg.channel.send(config.NO_CURRENT_TRACK);
            }
        }
        else msg.channel.send(config.NOT_IN_CHANNEL);
    }
};