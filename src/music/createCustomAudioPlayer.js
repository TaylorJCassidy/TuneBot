const { createAudioResource, createAudioPlayer, StreamType, AudioPlayerStatus } = require("@discordjs/voice");
const ytdl = require('@distube/ytdl-core');
const {timeout, cancelTimeout} = require('./timeout');
const config = require('../configs/music.json');
const logger = require('../utils/logger')('createCustomAudioPlayer');

const options = { 
    quality: [171, 249, 250, 251], //https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
    highWaterMark: 1 << 24
};

module.exports = (guild) => {
    const audioPlayer = createAudioPlayer();
    const queue = [];
    let isLooping = false;
    let songStartedTimestamp;
    let currentAudioResource;

    const play = (track) => {
        currentAudioResource = createAudioResource(ytdl(track.url, options), {inputType: StreamType.WebmOpus, inlineVolume: true});
        songStartedTimestamp = Date.now();
        audioPlayer.play(currentAudioResource);
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

    const audioPlayerErrorListener = (e) => {
        logger(e, 'error');
        guild.reply(config.ERROR_PLAYING_TRACK);
    };

    /**
     * Enqueues a track to be played
     * @param {*} track The track to be enqueued
     * @returns {Boolean} returns true if the track is the first added to an empty queue
     */
    const enqueue = (track) => {
        queue.push(track);
        if(audioPlayer.state.status != AudioPlayerStatus.Playing) {
            cancelTimeout(guild);
            playHeadOfQueue();
            return true;
        }
        return false;
    };

    /**
     * Skips the current track
     * @returns {Boolean} returns true if the audioplayer skipped a track
     */
    const skip = () => {
        if (audioPlayer.state.status == AudioPlayerStatus.Playing) {
            audioPlayer.stop();
            return true;
        }
        return false;
    };

    /**
     * Toggles looping of the track at the head of the queue
     * @returns {boolean} returns true if the track is looping
     */
    const toggleLooping = () => {
        isLooping = !isLooping;
        return isLooping;
    };

    /**
     * Destroys the audioplayer
     */
    const destroy = () => {
        audioPlayer.removeListener('error', audioPlayerErrorListener);
        audioPlayer.removeListener(AudioPlayerStatus.Idle, audioPlayerIdleListener);
        audioPlayer.stop(true);
    };

    /**
     * Clears the queue
     * @returns {Boolean} returns true if the queue was cleared
     */
    const clear = () => {
        if (queue.length > 1) {
            queue.length = 1;
            return true;
        }
        return false;
    };

    /**
     * Stops the audio player
     * @returns {Boolean} returns true if the audioplayer was stopped
     */
    const stop = () => {
        if (audioPlayer.state.status == AudioPlayerStatus.Playing) {
            queue.length = 0; //empty queue
            audioPlayer.stop();
            return true;
        }
        return false;
    };

    /**
     * Toggles the playing of the audioplayer
     * @returns {Boolean} returns true is the audioplayer is paused
     */
    const togglePaused = () => {
        if (audioPlayer.state.status == AudioPlayerStatus.Playing) {
            audioPlayer.pause();
            timeout(guild);
        }
        else {
            cancelTimeout(guild);
            audioPlayer.unpause();
        }
        return audioPlayer.state.status == AudioPlayerStatus.Paused;
    };

    /**
     * Sets the volume of the audio resource
     * @param {Number} volume volume to set
     */
    const setVolume = (volume) => {
        if (audioPlayer.state.status == AudioPlayerStatus.Playing) {
            currentAudioResource.volume.volume = volume;
        }
    };

    audioPlayer.on(AudioPlayerStatus.Idle, audioPlayerIdleListener);

    audioPlayer.on('error', audioPlayerErrorListener);

    return {
        enqueue,
        skip,
        toggleLooping,
        isLooping: () => isLooping,
        destroy,
        clear,
        stop,
        getSongStartedTimestamp: () => songStartedTimestamp,
        togglePaused,
        isPaused: () => audioPlayer.state.status == AudioPlayerStatus.Paused,
        isPlaying: () => audioPlayer.state.status == AudioPlayerStatus.Playing,
        setVolume,
        queue,
        __proto__: audioPlayer
    };
};