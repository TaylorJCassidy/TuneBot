const commands = require('./utils/getCommands.js');
const {ChannelType} = require('discord.js');
const {prefix} = require('./app.json');
const GuildRepoManager = require('./repositories/GuildRepoManager.js');

module.exports = (client) => {
    client.once('ready', () => {
        GuildRepoManager.setupGuilds(client.guilds);
    });

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag} at ${new Date().toISOString()}`);
    });

    client.on('guildDelete', (guild) => {
        GuildRepoManager.deleteGuild(guild.id);
    });

    client.on('guildCreate', (guild) => {  
        GuildRepoManager.addGuild(guild.id);
    });

    client.on('messageCreate', msg => {
        if (msg.author.id != client.user.id && msg.channel.type === ChannelType.GuildText) {
            if (msg.content.startsWith(prefix) && msg.content.length > prefix.length) {
                const content = msg.content.slice(prefix.length);
                const split = content.search(/ |$/);
                const command = content.substring(0, split).toLowerCase();
                const args = content.substring(split+1).trim();

                const guild = GuildRepoManager.getGuild(msg.guild.id);
                
                if (commands.has(command)) {
                    commands.get(command).run(msg, args, {guild});
                }
            }
            else if (msg.mentions.has(client.user.id) && !msg.mentions.everyone) {
                msg.reply(`The current prefix is '**${prefix}**'`);
            }
        }
    });
};