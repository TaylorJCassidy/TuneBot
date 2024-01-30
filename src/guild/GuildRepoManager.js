const createGuild = require('./Guild');
const guildsMap = new Map();

module.exports = {
    setupGuilds: (guilds) => {
        guilds.cache.each((value, key) => {
            const guild = createGuild(key);
            guildsMap.set(key, guild);
        });
    },

    addGuild: (guildId) => {
        const guild = createGuild(guildId);
        guildsMap.set(guildId, guild);
    },

    getGuild: (guildId) => {
        return guildsMap.get(guildId);
    },

    deleteGuild: (guildId) => {
        const guild = guildsMap.get(guildId);
        guild.deleteGuild();
        guildsMap.delete(guildId);
    }
};