const trackInfoProvider = require('./distubeTrackInfoProvider');

module.exports = {
    getTrackStream: (url) => trackInfoProvider.getTrackStream(url),
    getTrackInfo: async (search) => trackInfoProvider.getTrackInfo(search)
};