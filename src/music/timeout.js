const {getVoiceConnection} = require('@discordjs/voice');
const config = require('../configs/music.json');

module.exports = {
    timeout: (guild) => {
        const leaveTimeout = setTimeout(() => {
            getVoiceConnection(guild.guildId).disconnect();
        }, config.LEAVE_TIMEOUT);
        guild.leaveTimeout = leaveTimeout;
        return leaveTimeout;
    },
    cancelTimeout: (guild) => {
        clearTimeout(guild.leaveTimeout);
    }
};