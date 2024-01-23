const {joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus} = require('@discordjs/voice');
const config = require('../configs/music.json');
const createCustomAudioPlayer = require('./createCustomAudioPlayer');
const logger = require('../utils/logger')('join');

module.exports = (voiceChannel, guild) => {
    return new Promise((resolve, reject) => {
        if (!voiceChannel) return reject(new Error(config.NOT_IN_CHANNEL));
        if (!voiceChannel.joinable) return reject(new Error(config.UNABLE_TO_CONNECT));
        if (getVoiceConnection(voiceChannel.guildId)) return resolve();

        const joinParams = {
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        };

        const connection = joinVoiceChannel(joinParams);
        entersState(connection, VoiceConnectionStatus.Ready, 3000).then(() => {
            connection.subscribe(guild.audioPlayer);

            const disconnectListener = () => voiceChannel.members.size == 1 && connection.disconnect();
            voiceChannel.client.on('voiceStateUpdate', disconnectListener);

            connection.on(VoiceConnectionStatus.Disconnected, () => {
                //if real disconnect, catch should be triggered
                Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, config.DISCONNECT_TIMEOUT),
                    entersState(connection, VoiceConnectionStatus.Connecting, config.DISCONNECT_TIMEOUT),
                ]).catch(() => {
                    voiceChannel.client.removeListener('voiceStateUpdate', disconnectListener);
                    clearTimeout(guild.leaveTimeout);
                    guild.audioPlayer.stop();
                    connection.destroy();
                });
            });
            
            return resolve();
        })
        .catch((e) => {
            logger(e, 'error');
            reject(new Error(config.FAILED_TO_CONNECT));
        });
    });
};