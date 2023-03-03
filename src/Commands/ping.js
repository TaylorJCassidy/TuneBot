module.exports = {
    name: 'ping',
    run: async function(msg,args) {
        let time = new Date();
        const msgReply = await msg.reply('Please wait...');
        msgReply.edit(`${msg.author.toString()},\nDiscord API response time: ${msg.client.ws.ping}ms\nMessage response time: ${new Date() - time}ms`);
    }
};