const {getVoiceConnection} = require('@discordjs/voice');

module.exports = (msg, guild) => {
    const connection = getVoiceConnection(guild.guildId);
    return connection?.joinConfig.channelId == msg.member.voice.channel?.id;
};