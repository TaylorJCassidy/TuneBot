const {getVoiceConnection} = require('@discordjs/voice');
const join = require('../music/join');

module.exports = {
    name: 'play',
    aliases: ['p'],
    run: async function(msg, args, {guild}) {
        join(msg.member.voice.channel, guild)
            .then(() => {
                guild.audioPlayer.enqueue({url: args});
            })
            .catch((err) => {
                msg.channel.send(err.message);
            });
    }
};