const config = require('../configs/music.json');
const valid = require('../music/valid');

module.exports = {
    name: 'pause',
    aliases: ['unpause', 'resume'],
    run: function(msg, args, {guild}) {
        if (valid(msg, guild)) {
            const isPaused = guild.audioPlayer.togglePaused();
            msg.channel.send(isPaused ? config.NOW_PAUSED : config.NO_LONGER_PAUSED);
        }
        else msg.channel.send(config.NOT_IN_CHANNEL);
    }
};