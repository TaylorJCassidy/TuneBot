const {Client, GatewayIntentBits, ChannelType} = require('discord.js'); //13.9.2
const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
]});
const MusicPlayer = require('./Music/MusicPlayer.js');

const {prefix} = require('./app.json');
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
    if (msg.author.id != client.user.id && msg.channel.type === ChannelType.GuildText) {
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