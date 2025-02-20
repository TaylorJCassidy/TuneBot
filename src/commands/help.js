const p = process.env.PREFIX;

module.exports = {
    name: 'help',
    run: function(msg, args) {
        const content = 
            `${p}play      Searches and plays a track from Youtube\
            \n${p}skip      Skips the current track\
            \n${p}queue     Shows the current queue\
            \n${p}leave     Leaves the channel\
            \n${p}join      Joins the channel\
            \n${p}stop      Stops the current track and clears the queue\
            \n${p}link      Shows the link of the current track\
            \n${p}clear     Clears the queue\
            \n${p}pause     Toggles pausing of current track\
            \n${p}loop      Loops current track\
            \n${p}looping   Shows if current track is looping\
            \n${p}remove    Removes a track from queue ${p}remove <queue position>\
            \n${p}volume    Changes the volume of the current track 1-100 ${p}volume <number>`;

        msg.channel.send('```' + content + '```');
    }
};