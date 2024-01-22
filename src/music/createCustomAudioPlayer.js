const { createAudioResource, createAudioPlayer, StreamType, AudioPlayerStatus } = require("@discordjs/voice");
const ytdl = require('@distube/ytdl-core');
const timeout = require('./timeout');

const audioPlayer = createAudioPlayer();

const options = { 
    quality: [250,251,249],
    highWaterMark: 1 << 24
};

const queue = [];
let isPlaying = false;

module.exports = (guild) => {
    const play = (track) => {
        isPlaying = true;
        const stream = ytdl(track.url, options);
        audioPlayer.play(createAudioResource(stream, {inputType: StreamType.WebmOpus}));
    };
    
    const playHeadOfQueue = () => {
        play(queue[0]);
    };
    
    const player = () => {
        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            queue.shift();
            if (queue.length > 0) {
                playHeadOfQueue();
            }
            else {
                isPlaying = false;
                timeout(guild);
            }
        });
    };

    const enqueue = (track) => {
        queue.push(track);
        if(!isPlaying) {
            clearTimeout(guild.timeout);
            playHeadOfQueue();
        }
    };

    player();

    return {
        enqueue,
        queue,
        __proto__: audioPlayer
    };
};