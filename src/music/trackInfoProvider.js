const distubeTrackInfoProvider = require('./distubeTrackInfoProvider');
const ytDlpTrackInfoProvider = require('./yt-dlp/ytDlpTrackInfoProvider');

module.exports = {
    getTrackStream: (url) => ytDlpTrackInfoProvider.getTrackStream(url),
    getTrackInfo: async (search) => distubeTrackInfoProvider.getTrackInfo(search)
};