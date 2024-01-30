const { createAudioResource, createAudioPlayer, StreamType, AudioPlayerStatus } = require("@discordjs/voice");
const ytdl = require('@distube/ytdl-core');
const timeout = require('./timeout');

const options = { 
    quality: [171, 249, 250, 251], //https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
    highWaterMark: 1 << 24
};

module.exports = (guild) => {
    const audioPlayer = createAudioPlayer();
    const queue = [];
    let isLooping = false;

    const play = (track) => {
        const stream = ytdl(track.url, options);
        audioPlayer.play(createAudioResource(stream, {inputType: StreamType.WebmOpus}));
    };
    
    const playHeadOfQueue = () => {
        play(queue[0]);
    };

    const audioPlayerIdleListener = () => {
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

    const destroy = () => {
        audioPlayer.removeListener(AudioPlayerStatus.Idle, audioPlayerIdleListener);
        audioPlayer.stop(true);
    };

    const clear = () => {
        if (queue.length > 1) {
            queue.length = 1;
            return true;
        }
        return false;
    };

    const stop = () => {
        if (audioPlayer.state.status == AudioPlayerStatus.Playing) {
            queue.length = 0; //empty queue
            audioPlayer.stop();
            return true;
        }
        return false;
    };

    audioPlayer.on(AudioPlayerStatus.Idle, audioPlayerIdleListener);

    return {
        enqueue,
        skip,
        toggleLooping,
        isLooping: () => isLooping,
        destroy,
        clear,
        stop,
        queue,
        __proto__: audioPlayer
    };
};