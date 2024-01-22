const join = require('../music/join');
const timeout = require('../music/timeout');

module.exports = {
    name: 'join',
    run: function(msg, args, {guild}) {
        join(msg.member.voice.channel, guild)
            .then(() => {
                timeout(guild);
            })
            .catch((err) => {
                msg.channel.send(err.message);
            });
    }
};