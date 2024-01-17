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
                const cmd = msg.content.slice(prefix.length).trim().match(/^([^ ]+(?= )*)/)[0];
                const arg = msg.content.substring(cmd.length+2).trim();

                const guild = GuildRepoManager.getGuild(msg.guild.id);
                
                if (!guild.musicController(msg,cmd,arg)) {
                    if (commands.has(cmd)) {
                        commands.get(cmd).run(msg,arg);
                    }
                }
            }
            else if (msg.mentions.has(client.user.id) && !msg.mentions.everyone) {
                msg.reply(`The current prefix is '**${prefix}**'`);
            }
        }
    });
};