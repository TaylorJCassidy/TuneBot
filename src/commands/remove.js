const config = require('../configs/music.json');
const valid = require('../music/valid');

module.exports = {
    name: 'remove',
    run: function(msg, args, {guild}) {
        if (valid(msg, guild)) {
            //if arguement isnt a valid index
            if (isNaN(args) || (args < 1 || args > guild.audioPlayer.queue.length - 1)) {
                msg.channel.send(config.INVALID_REMOVE_INDEX);
            }
            else {
                const [removed] = guild.audioPlayer.queue.splice(args, 1);
                msg.channel.send(config.REMOVED_FROM_QUEUE.replace('1', removed.title));
            }
        }
        else msg.channel.send(config.NOT_IN_CHANNEL);
    }
};