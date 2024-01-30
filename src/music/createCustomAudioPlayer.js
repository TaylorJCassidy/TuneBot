const { createAudioResource, createAudioPlayer, StreamType, AudioPlayerStatus } = require("@discordjs/voice");
const ytdl = require('@distube/ytdl-core');
const timeout = require('./timeout');

const audioPlayer = createAudioPlayer();

const options = { 
    quality: [171, 249, 250, 251], //https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
    highWaterMark: 1 << 24
};

const queue = [];
let isLooping = false;

module.exports = (guild) => {
    const play = (track) => {
        const stream = ytdl(track.url, options);
        audioPlayer.play(createAudioResource(stream, {inputType: StreamType.WebmOpus}));
    };
    
    const playHeadOfQueue = () => {
        play(queue[0]);
    };
    
    const player = () => {
        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            if (isLooping) {
                playHeadOfQueue();
            }
            else {
                queue.shift();
                if (queue.length > 0) {
                    playHeadOfQueue();
                }
                else {
                    timeout(guild);
                }
            }
        });
    };

    const enqueue = (track) => {
        queue.push(track);
        if(audioPlayer.state.status != AudioPlayerStatus.Playing) {
            clearTimeout(guild.timeout);
            playHeadOfQueue();
        }
    };

    const skip = () => {
        if (audioPlayer.state.status == AudioPlayerStatus.Playing) {
            audioPlayer.stop();
            return true;
        }
        return false;
    };

    const toggleLooping = () => {
        isLooping = !isLooping;
        return isLooping;
    };

    player();

    return {
        enqueue,
        skip,
        toggleLooping,
        isLooping: () => isLooping,
        queue,
        __proto__: audioPlayer
    };
};