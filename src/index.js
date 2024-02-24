const {Client, GatewayIntentBits} = require('discord.js');
const app = require('./app');

const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
]});
client.login(process.env.TOKEN);

app(client);