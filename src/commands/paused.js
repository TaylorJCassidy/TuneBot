const config = require('../configs/music.json');

module.exports = {
    name: 'paused',
    aliases: ['ispaused'],
    run: function(msg, args, {guild}) {
        msg.channel.send(guild.audioPlayer.isPaused() ? config.CURRENTLY_PAUSED : config.NOT_PAUSED);
    }
};