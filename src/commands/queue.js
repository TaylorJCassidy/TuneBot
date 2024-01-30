const config = require('../configs/music.json');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    run: function(msg, args, {guild}) {
        let content = '';
        if (guild.audioPlayer == null || guild.audioPlayer.queue.length == 0) {
            content = config.EMPTY_QUEUE;
        }
        else {
            const playingTrack = guild.audioPlayer.queue[0];
            content = config.CURRENT_TRACK_QUEUE.replace('1', playingTrack.title);
            if (guild.audioPlayer.queue.length > 1) {
                content += config.TRACKS_IN_QUEUE;
                for (let i = 1; i < guild.audioPlayer.queue.length; i++) {
                    const track = guild.audioPlayer.queue[i];
                    content += `${i}. **${track.title}**\n`;
                }
            }
        }
        msg.channel.send(content);
    }
};