const MusicPlayer = require('../Music/MusicPlayerV2.js');

module.exports = {
    generateMusicRepo: (guilds) => {
        const musicRepo = new Map();
        const guildKeys = Array.from(guilds.cache.keys());
        for (let key of guildKeys) {
            musicRepo.set(key,new MusicPlayer(key));
        }
        return musicRepo;
    }
};