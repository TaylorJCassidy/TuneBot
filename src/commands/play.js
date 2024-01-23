const ytdl = require('@distube/ytdl-core');
const ytsr = require('@distube/ytsr');
const join = require('../music/join');
const config = require('../configs/music.json');
const {parseTimeString} = require('../utils/parseTime');
const logger = require('../utils/logger')('play');

const search = async (limit, args) => (await ytsr(args, {type: 'video', limit, safeSearch: false})).items.filter(t => !t.isLive)[0];

module.exports = {
    name: 'play',
    aliases: ['p'],
    run: function(msg, args, {guild}) {
        join(msg.member.voice.channel, guild)
            .then(async () => {
                let track;
                if (ytdl.validateURL(args)) {
                    const info = await ytdl.getBasicInfo(args);
                    track = {
                        url: info.videoDetails.video_url,
                        title: info.videoDetails.title,
                        length: info.videoDetails.lengthSeconds
                    };
                    guild.audioPlayer.enqueue(track);
                }
                else {
                    let info;
                    for (let i = 0; i < config.SEARCH_RETRY_LIMIT; i++) {
                        info = await search(config.INITIAL_SEARCH_SIZE * (i + 1), args);
                        if (info) {
                            track = {
                                url: info.url,
                                title: info.name,
                                length: parseTimeString(info.duration)
                            };
                            guild.audioPlayer.enqueue(track);
                            break;
                        }
                    }

                    if (!info) {
                        logger(`Unable to find a non-live video for search '${args}'`, 'error');
                        throw new Error(config.UNABLE_TO_FIND_VIDEO);
                    }
                }

                if (guild.audioPlayer.getQueue().length == 1) {
                    msg.channel.send(config.PLAYING.replace('1', track.title));
                }
                else {
                    msg.channel.send(config.QUEUED.replace('1', track.title));
                }
            })
            .catch((err) => {
                msg.channel.send(err.message);
            });
    }
};