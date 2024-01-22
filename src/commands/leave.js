const {getVoiceConnection} = require('@discordjs/voice');
const config = require('../configs/music.json');

module.exports = {
    name: 'leave',
    aliases: ['getout', 'fuckoff'],
    run: function(msg, args, {guild}) {
        const connection = getVoiceConnection(guild.guildID);
        if (!connection) {
            msg.channel.send(config.NOT_IN_CHANNEL);
        }
        else {
            connection.disconnect();
        }
    }
};