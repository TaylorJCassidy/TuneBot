const config = require('../configs/music.json');
const valid = require('../music/valid');

module.exports = {
    name: 'skip',
    aliases: ['s', 'fs'],
    run: function(msg, args, {guild}) {
        if (valid(msg, guild)) {
            if (guild.audioPlayer.skip()) {
                msg.channel.send(config.SKIPPED);
            }
            else {
                msg.channel.send(config.NO_CURRENT_TRACK);
            }
        }
        else msg.channel.send(config.NOT_IN_CHANNEL);
    }
};