const {getVoiceConnection} = require('@discordjs/voice');
const config = require('../configs/music.json');
const valid = require('../music/valid');

module.exports = {
    name: 'leave',
    aliases: ['getout', 'fuckoff'],
    run: function(msg, args, {guild}) {
        if (valid(msg, guild)) getVoiceConnection(guild.guildId).disconnect();
        else msg.channel.send(config.NOT_IN_CHANNEL);
    }
};