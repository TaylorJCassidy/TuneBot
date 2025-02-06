const ytdl = require('@distube/ytdl-core');
const ytsr = require('@distube/ytsr');
const {parseTimeString} = require('../utils/parseTime');
const config = require('../configs/music.json');

const options = { 
    quality: [171, 249, 250, 251, 139, 140, 141], //https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
    highWaterMark: 1 << 24
};

module.exports = {
    getTrackStream: (url) => {
        return ytdl(url, options);
    },
    getTrackInfo: async (search) => {
        if (ytdl.validateURL(search)) {
            return ytdl.getBasicInfo(search)
                .then((info) => ({
                    url: info.videoDetails.video_url,
                    title: info.videoDetails.title,
                    length: parseInt(info.videoDetails.lengthSeconds)
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
    }
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