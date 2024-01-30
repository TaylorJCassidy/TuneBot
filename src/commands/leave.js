const {getVoiceConnection} = require('@discordjs/voice');
const config = require('../configs/music.json');

module.exports = {
    name: 'leave',
    aliases: ['getout', 'fuckoff'],
    run: function(msg, args, {guild}) {
        const connection = getVoiceConnection(guild.guildId);
        if (connection?.joinConfig.channelId == msg.member.voice.channel.id) connection.disconnect();
        else msg.channel.send(config.NOT_IN_CHANNEL);
    }
};