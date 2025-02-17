const {getVoiceConnection} = require('@discordjs/voice');

module.exports = (msg, guild) => {
    const connection = getVoiceConnection(guild.guildId);
    if (!connection || !msg.member.voice.channel || !guild.audioPlayer) return false;
    return connection.joinConfig.channelId == msg.member.voice.channel.id;
};