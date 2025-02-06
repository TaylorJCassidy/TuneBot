const join = require('../music/join');
const config = require('../configs/music.json');
const logger = require('../utils/logger')('play');
const trackInfoProvider = require('../music/trackInfoProvider');

module.exports = {
    name: 'play',
    aliases: ['p'],
    run: function(msg, args, {guild}) {
        if (!args) return msg.channel.send(config.NO_TRACK_SEARCH_PROVIDED);
        trackInfoProvider.getTrackInfo(args)
            .then((track) => {
                if (!track) return msg.channel.send(config.UNABLE_TO_FIND_TRACK);
                join(msg.member.voice.channel, msg.channel, guild)
                    .then(() => {
                        const firstAdded = guild.audioPlayer.enqueue(track);

                        if (firstAdded) {
                            msg.channel.send(config.PLAYING.replace('1', track.title));
                        }
                        else {
                            msg.channel.send(config.QUEUED.replace('1', track.title));
                        }
                    })
                    .catch((err) => {
                        msg.channel.send(err.message);
                    });
            })
            .catch((err) => {
                msg.channel.send(config.ERROR_GETTING_TRACK);
                logger(`Error getting video with search '${args}'\n${err}`, 'error');
            });
        
    }
};