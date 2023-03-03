const {Client} = require('discord.js'); //13.9.2
const {Intents} = require('discord.js');
const client = new Client({intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES
]});
const MusicPlayer = require('./Music/MusicPlayerV2.js');

const {prefix} = require('../config/prefix.json');
client.prefix = prefix;

let musicRepo;
const commands = require('./Utils/getCommands.js').getCommands();

client.once('ready',() => {
    musicRepo = require('./Utils/generateMusicRepo.js').generateMusicRepo(client.guilds);
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag} at ${new Date().toISOString()}`);
});

client.on('guildDelete', (guild) => {
    musicRepo.delete(guild.id);
});

client.on('guildCreate', (guild) => {  
    musicRepo.set(guild.id,new MusicPlayer());
});

client.on('messageCreate', msg => {
    if (msg.author.id != client.user.id && msg.channel.type == 'GUILD_TEXT') {
        if (msg.content.startsWith(prefix) && msg.content.length > prefix.length) {
            const cmd = msg.content.slice(prefix.length).trim().match(/^([^ ]+(?= )*)/)[0];
            const arg = msg.content.substring(cmd.length+2).trim();
            if (!musicRepo.get(msg.guild.id).musicController(msg,cmd,arg)) {
                if (commands.has(cmd)) {
                    commands.get(cmd).run(msg,arg);
                }
            }
        }
        else if (msg.mentions.has(client.user.id) && msg.mentions.everyone == false) {
            msg.reply(`The current prefix is '**${prefix}**'`);
        }
    }
});

client.login(process.env.TOKEN);