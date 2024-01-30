const config = require('../configs/music.json');
const valid = require('../music/valid');

module.exports = {
    name: 'clear',
    run: function(msg, args, {guild}) {
        if (valid(msg, guild)) {
            if (guild.audioPlayer.clear()) {
                msg.channel.send(config.QUEUE_CLEARED);
            }
            else {
                msg.channel.send(config.QUEUE_ALREADY_CLEAR);
            }
        }
        else msg.channel.send(config.NOT_IN_CHANNEL);
    }
};