const ytdl = require('@distube/ytdl-core');
const ytsr = require('@distube/ytsr');
const join = require('../music/join');
const config = require('../configs/music.json');
const {parseTimeString} = require('../utils/parseTime');
const logger = require('../utils/logger')('play');

module.exports = {
    name: 'play',
    aliases: ['p'],
    run: function(msg, args, {guild}) {
        join(msg.member.voice.channel, msg.channel, guild)
            .then(async () => {
                getTrackInfo(args).then((track) => {
                    if (!track) return msg.channel.send(config.UNABLE_TO_FIND_TRACK);
                    const firstAdded = guild.audioPlayer.enqueue(track);

                    if (firstAdded) {
                        msg.channel.send(config.PLAYING.replace('1', track.title));
                    }
                    else {
                        msg.channel.send(config.QUEUED.replace('1', track.title));
                    }
                })
                .catch((err) => {
                    msg.channel.send(config.ERROR_GETTING_TRACK);
                    logger(`Error getting video with search '${args}'\n${err}`, 'error');
                });
            })
            .catch((err) => {
                msg.channel.send(err.message);
            });
    }
};

const getTrackInfo = async (search) => {
    if (ytdl.validateURL(search)) {
        return ytdl.getBasicInfo(search)
            .then((info) => ({
                url: info.videoDetails.video_url,
                title: info.videoDetails.title,
                length: info.videoDetails.lengthSeconds
            }));
    }
    
    return yt_search(search)
        .then((info) => {
            if (info) {
                return {
                    url: info.url,
                    title: info.name,
                    length: parseTimeString(info.duration)
                };
            }
        });
};

const yt_search = (search, limit = config.INITIAL_SEARCH_SIZE, retryCount = 1) => {
    return ytsr(search, {type: 'video', limit, safeSearch: false})
        .then((results) => {
            const info = results.items.filter(t => !t.isLive).shift();
            if (info) return info;

            if (retryCount < config.SEARCH_RETRY_LIMIT + 1) {
                return yt_search(search, limit * (retryCount + 1), retryCount + 1);
            }
            return null;
        });
};