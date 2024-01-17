const createGuild = require('./Guild');
const guildsMap = new Map();

module.exports = {
    setupGuilds: (guilds) => {
        guilds.cache.each((value, key) => {
            const guild = createGuild(key);
            guildsMap.set(key, guild);
        });
    },

    addGuild: (guildID) => {
        const guild = createGuild(guildID);
        guildsMap.set(guildID, guild);
    },

    getGuild: (guildID) => {
        return guildsMap.get(guildID);
    },

    deleteGuild: (guildID) => {
        const guild = guildsMap.get(guildID);
        guild.deleteGuild();
        guildsMap.delete(guildID);
    }
};