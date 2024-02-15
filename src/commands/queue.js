const config = require('../configs/music.json');
const { toTimeString } = require('../utils/parseTime');

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
            const playingTrackRemainingTime = Math.floor((guild.audioPlayer.getSongStartedTimestamp() - Date.now()) / 1000) + playingTrack.length;
            content = config.CURRENT_TRACK_QUEUE.replace('1', playingTrack.title);
            if (guild.audioPlayer.queue.length > 1) {
                content += config.TRACKS_IN_QUEUE;
                let queueTotalTime = 0;
                for (let i = 1; i < guild.audioPlayer.queue.length; i++) {
                    const track = guild.audioPlayer.queue[i];
                    content += `${i}. **${track.title}**\n`;
                    queueTotalTime += track.length;
                }
                content += config.QUEUE_TIME_REMAINING.replace('1', toTimeString(playingTrackRemainingTime + queueTotalTime));
            }
            content += config.CURRENT_TIME_REMAINING.replace('1', toTimeString(playingTrackRemainingTime));
        }
        msg.channel.send(content);
    }
};