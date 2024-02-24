const config = require('../configs/music.json');

module.exports = {
    name: 'link',
    aliases: ['song', 'track'],
    run: function(msg, args, {guild}) {
        const track = guild.audioPlayer?.queue[0];
        if (track) msg.channel.send(track.url);
        else msg.channel.send(config.NO_CURRENT_TRACK);
    }
};