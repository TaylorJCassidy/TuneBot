const config = require('../configs/music.json');

module.exports = {
    name: 'looping',
    aliases: ['islooping'],
    run: function(msg, args, {guild}) {
        msg.channel.send(guild.audioPlayer.isLooping() ? config.CURRENTLY_LOOPING : config.NOT_LOOPING);
    }
};