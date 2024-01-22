const {getVoiceConnection} = require('@discordjs/voice');
const config = require('../configs/music.json');

module.exports = (guild) => {
    const leaveTimeout = setTimeout(() => {
        getVoiceConnection(guild.guildID).disconnect();
    }, config.LEAVE_TIMEOUT);
    guild.leaveTimeout = leaveTimeout;
    return leaveTimeout;
};