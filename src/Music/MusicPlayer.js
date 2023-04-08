/* eslint-disable no-unused-vars */
const Queue = require('../Utils/Queue.js');
const ytdl = require('ytdl-core');//4.10
const ytsr = require('ytsr');//3.5.3
const parseTime = require('../Utils/parseTime.js');
const commonResponses = Object.freeze(require('./MusicErrorReponses.json'));
const configs = Object.freeze(require('../app.json'));

const { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioPlayer } = require('@discordjs/voice');

class MusicPlayer {

    REACTS = new Map([
        ['⏹️',this.stop],
        ['🔁',this.loop],
        ['🇶',this.q],
        ['⏯️',this.togglePaused],
        ['➡️',this.skip]
    ]);

    msg;
    currentTrack;
    queue = new Queue();
    connection;
    audioPlayer;
    dispatcher;
    collector;
    isPlaying = false;
    isLooping = false;
    trackTime;
    leaveTimeout;

    musicController(msg,cmd,arg) {
        this.msg = msg;
        switch(cmd.toLowerCase()) {
            case 'play':
            case 'p':
                if (arg === '') {
                    this.togglePaused();
                }
                else {
                    this.play(arg);
                }
                break;
            case 'skip':
            case 'fs':
            case 's':
                this.skip();
                break;
            case 'queue':
            case 'q':
                this.q();
                break;
            case 'getout':
            case 'fuckoff':
            case 'leave':
                this.leave();
                break;
            case 'join':
                this.join();
                break;
            case 'stop':
                this.stop();
                break;
            case 'unpause':
            case 'pause':
                this.togglePaused();
                break;
            case 'song':
            case 'link':
                this.link();
                break;
            case 'clear':
                this.clear();
                break;
            case 'remove':
                this.remove(arg);
                break;
            case 'loop':
                this.loop();
                break;
            case 'looping':
                this.looping();
                break;
            case 'bassboost':
                this.bassboost(arg);
                break;
            case 'help':
                this.help();
                break;
            default:
                return false;
        }
        return true;
    }

    async play(arg) {
        if (await this._connect()) {
            try {
                let info = {
                    title: null,
                    url: null,
                    length: null
                };

                if (ytdl.validateURL(arg)) {
                    const tempinfo = (await ytdl.getBasicInfo(arg,{requestOptions: {headers: {cookie: configs.COOKIE}}})).videoDetails;
                    info.title = tempinfo.title;
                    info.url = tempinfo.video_url;
                    info.length = parseInt(tempinfo.lengthSeconds);
                }
                else {
                    //const url = (await ytsr.getFilters(arg)).get('Type').get('Video').url; PROPER USEAGE HOWEVER SLOWER
                    const url = `https://www.youtube.com/results?search_query=${arg}&sp=EgIQAQ%253D%253D`;
                    const tempinfo = (await ytsr(url, { limit: '1' })).items[0];
                    info.title = tempinfo.title;
                    info.url = tempinfo.url;
                    info.length = parseTime.parseTimeString(tempinfo.duration);
                }

                info.title = info.title.replace(/\*\*/,'\\*\\*');

                if (/nightcore/i.test(info.title)) {
                    throw new Error('nightcore');
                }

                if (!this.isPlaying) {
                    this.isPlaying = true;
                    clearTimeout(this.leaveTimeout);
                    this._playMusic(info);
                    let message = await this.msg.channel.send(`:loud_sound: Now playing: **${info.title}**`);
                    this._reactionController(message);
                }
                else {
                    if (!this.queue.add(info)) {
                        this.msg.channel.send(':x: Cannot add to queue, as the queue is currently full');
                    }
                    else {
                        this.msg.channel.send(':white_check_mark: Added **' + info.title + '** to the queue');
                    }
                }
            }
            catch(e) {
                this._timeout();
                this.msg.channel.send(':x: Unable to add this track to the queue');
                console.log(Date.now() + ': ' + e.message);
            }
        }
        
    }

    skip() {
        if (this._isValid()) {
            if (this.isPlaying) {
                this.dispatcher.destroy();
                if (!this.queue.isEmpty()) {
                    this._playMusic(this.queue.remove());
                }
                else {
                    this.isPlaying = false;
                    this._timeout();
                }
                this.msg.channel.send(':white_check_mark: Track skipped');
            }
            else {
                this.msg.channel.send(commonResponses.NO_TRACK_PLAYING);
            }
        }
    }

    q() {
        if (!this.isPlaying) {
            this.msg.channel.send(':hole: The queue is empty');
        }
        else {
            let qString = `Current track is: **${this.currentTrack.title}**\n`;
            const currentTrackLength = parseInt((this.trackTime-Date.now())/1000);

            if (!this.queue.isEmpty()) {
                qString += 'Tracks Currently in queue:\n';
                const queues = this.queue.toArray();
                let totalTime = currentTrackLength;

                for (let i=0;i<queues.length;i++) {
                    qString += `${i+1}. **${queues[i].title}**\n`;
                    totalTime += queues[i].length;
                }

                let eoq;
                if (this.isLooping) {
                    eoq = 'Track is looping';
                }
                else {
                    eoq = parseTime.toTimeString(totalTime);
                }
                qString += `\nTime until end of queue: ${eoq}\n`;
            }
            const nextTrackTime = parseTime.toTimeString(currentTrackLength);
            qString += `Time until end of current track: ${nextTrackTime}\n`;
            if (this.isLooping) {
                qString += ':repeat: The track is looping';
            }

            this.msg.channel.send(qString);
        }
    }

    leave() {
        if (this._isValid()) {
            this.connection.disconnect();
        }
    }

    async join() {
        if (await this._connect()) {
            this._timeout();
        }
    }

    stop() {
        if (this._isValid()) {
            if (this.isPlaying) {
                this._clearFields();
                this.msg.channel.send(':stop_button: Stopped');
                this._timeout();
            }
            else {
                this.msg.channel.send(commonResponses.NO_TRACK_PLAYING);
            }
        }
    } 

    togglePaused() {
        if (this._isValid()) {
            if (this.isPlaying) {
                if (this.dispatcher.paused) {
                    //WORKAROUND AS SINGULAR PAUSE DOES NOT WORK WITH CURRENT NODEJS AND DISCORDJS
                    this.dispatcher.resume();
                    this.dispatcher.pause();
                    this.dispatcher.resume();
                    clearTimeout(this.leaveTimeout);
                    this.msg.channel.send(':arrow_forward: The track has been resumed');
                }
                else {
                    this.dispatcher.pause();
                    this._timeout();
                    this.msg.channel.send(':pause_button: The track has been paused');
                }
            }
            else {
                this.msg.channel.send(commonResponses.NO_TRACK_PLAYING);
            }
        }
    }

    link() {
        if (this.isPlaying) {
            this.msg.channel.send(this.currentTrack.url);
        }
        else {
            this.msg.channel.send(commonResponses.NO_TRACK_PLAYING);
        }
    }

    clear() {
        if (this._isValid()) {
            if (this.queue.isEmpty()) {
                this.msg.channel.send(commonResponses.QUEUE_EMPTY);
            }
            else {
                this.queue = new Queue(configs.MAXQUEUE);
            }
        }
    }

    remove(arg) {
        if (this._isValid()) {
            if (!this.queue.isEmpty()) {
                if (isNaN(arg)) {
                    this.msg.channel.send(':x: Please provide a number');
                }
                else {
                    if (arg <= this.queue.size()) {
                        const removed = this.queue.removeFromPos(arg);
                        this.msg.channel.send(`:white_check_mark: Removed **${removed.title}** from position **${arg}** of the queue`);
                    }
                    else {
                        this.msg.channel.send(`:x: The queue is not ${arg} tracks long`);
                    }
                }
            }
            else {
                this.msg.channel.send(commonResponses.QUEUE_EMPTY);
            }
        }
    }

    loop() {
        if(this._isValid()) {
            if (this.isPlaying) {
                this.isLooping = !this.isLooping;
                this.msg.channel.send(`:repeat: The track is ${this.isLooping ? 'now':'no longer'} looping`);
            }
            else {
                this.msg.channel.send(commonResponses.NO_TRACK_PLAYING);
            }
        }
    }

    looping() {
        if (this.isPlaying) {
            this.msg.channel.send(`The track is ${this.isLooping ? '':'not'} looping`);
        }
        else {
            this.msg.channel.send(commonResponses.NO_TRACK_PLAYING);
        }
    }

    bassboost(arg) {
        if(this._isValid()) {
            if (this.isPlaying) {
                const baseFactor = 3;
                let increase = baseFactor;

                if (arg != '' && arg > 0) {
                    increase *= arg;
                }

                if (this.dispatcher.volume+increase > ((configs.MAXBASSBOOST*baseFactor)+1)) {
                    this.msg.channel.send(`:x: Cannot boost more than ${configs.MAXBASSBOOST} times (for health and safety)`);
                }
                else {
                    this.dispatcher.setVolume(this.dispatcher.volume+increase);
                }
            }
            else {
                this.msg.channel.send(commonResponses.NO_TRACK_PLAYING);
            }
        }
    }
    
    help() {
        const p = this.msg.client.prefix;
        this.msg.channel.send(
           `\`\`\`${p}play      Searches and plays a track from Youtube\
            \n${p}skip      Skips the current track\
            \n${p}queue     Shows the current queue\
            \n${p}leave     Leaves the channel\
            \n${p}join      Joins the channel\
            \n${p}stop      Stops the current track and clears the queue\
            \n${p}link      Shows the link of the current track\
            \n${p}clear     Clears the queue\
            \n${p}pause     Toggles pausing of current track\
            \n${p}loop      Loops current track\
            \n${p}remove    Removes a track from queue ${p}remove <queue position>\
            \n${p}bassboost Bass boosts the current track ${p}bassboost <number>\`\`\``
        );
    }

    _playMusic(info,retry = 1) {
        const stream = ytdl(info.url, { quality: [250,251,249], highWaterMark: 1 << 25, requestOptions: {headers: {cookie: configs.COOKIE}}});
        this.dispatcher = this.audioPlayer.play(stream,{type: 'webm/opus', bitrate: 'auto'});
        this.currentTrack = info;
        this.trackTime = Date.now()+(info.length*1000);

        this.dispatcher.on('finish', () => {
            this.dispatcher.destroy();
            if (this.isLooping) {
                this._playMusic(info);
            }
            else if (this.queue.isEmpty()) {
                this.isPlaying = false;
                this.isLooping = false;
                this._timeout();
            }
            else {
                this._playMusic(this.queue.remove());
            }
        });

        stream.on('error', (e) => {
            let time = new Date().toString().substring(0,24);
            this.dispatcher.destroy();
            if (e.statusCode == 403 && retry < 3) {
                console.log(time + `: Retrying, attempt ${retry}:` + info.url);
                setTimeout(() => {
                    this._playMusic(info,retry++);
                },configs.RETRYTIMEOUTLENGTH);
            }
            else {
                console.log(time + ': ' + info.url + '\n' + e.message);
                if (this.queue.isEmpty()) {
                    this.msg.channel.send(`:x: Unable to play the track **${info.title}**. Please try again`);
                    this.isPlaying = false;
                    this._timeout();
                }
                else {
                    this.msg.channel.send(`:x: Unable to play the track **${info.title}**. Playing next track`);
                    this._playMusic(this.queue.remove());
                }
            }
        });
    }

    async _connect() {
        return new Promise((resolve) => {
            const voiceChannel = this.msg.member.voice.channel;
            if (!voiceChannel) {
                this.msg.channel.send(commonResponses.NOT_CONNECTED);
                return resolve(false);
            }

            if (!voiceChannel.joinable) {
                this.msg.channel.send('Cant connect');
                return resolve(false);
            }
            /* if (this.connection == undefined || this.connection.status == 4) {
                const listener = (oldState,newState) => {
                    if (this.connection.channel.members.size == 1) {
                        this.connection.disconnect();
                    }
                };

                const voiceChannel = this.msg.member.voice.channel;
                const joinParams = {
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guildId,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator
                };

                this.connection = joinVoiceChannel(joinParams);
                this.connection.on('disconnect',() => {
                    this._clearFields();
                    clearTimeout(this.leaveTimeout);
                    this.msg.client.removeListener('voiceStateUpdate',listener);
                });

                this.connection.on('error', (e) => {
                    this.msg.channel.send(':x: Cannot connect to this channel. Please check permissions and try again');
                });

                this.listener = this.msg.client.on('voiceStateUpdate', listener);
                return setTimeout(() => {
                    return true;
                },10000);
            }
            else {
                if (this.msg.guild.me.voice.channelID != this.msg.member.voice.channelID) {
                    this.msg.channel.send(commonResponses.INCORRECT_CHANNEL);
                    return false;
                }
                else {
                    return true;
                }
            } */

            
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator
            });

            entersState(connection, VoiceConnectionStatus.Ready, 3000).then(() => {
                this.connection = connection;
                createAudioPlayer();
                resolve(true);
            })
            .catch((e) => {
                this.msg.channel.send('Unable to join channel, please try again');
                console.log(e);
                resolve(false);
            });
            
        });
    }

    _reactionController(msg) {
        if (this.collector && !this.collector.ended) {
            this.collector.stop();
        }
        
        this.REACTS.forEach(async (value,key) => {
            await msg.react(key);
        });

        this.collector = msg.createReactionCollector((reaction,user) => {
            return this.REACTS.has(reaction.emoji.name) && user.id != msg.client.user.id;
        },{dispose: true});

        this.collector.on('collect',async (reaction,user) => {
            msg.channel.send(`${user.toString()},`);
            this.REACTS.get(reaction.emoji.name).bind(this)();
            reaction.users.remove(user);
        });

        this.collector.on('end',async () => {
            msg.reactions.removeAll();
        });
    }

    _clearFields() {
        if (this.dispatcher && !this.dispatcher.destroyed) {
            this.dispatcher.destroy();
        }
        this.queue = new Queue();
        this.isPlaying = false;
        this.isLooping = false;
        if (this.collector && !this.collector.ended) {
            this.collector.stop();
        }
    }

    _timeout() {
        this.leaveTimeout = setTimeout(() => {
            this.connection.disconnect();
        },configs.LEAVETIMEOUTLENGTH);
    }

    _isValid() {
        if (!this.msg.member.voice.channel) {
            this.msg.channel.send(commonResponses.NOT_CONNECTED);
        }
        else if (this.msg.guild.me.voice.channelID != this.msg.member.voice.channelID) {
            this.msg.channel.send(commonResponses.INCORRECT_CHANNEL);
        }
        else {
            return true;
        }
        return false;
    }
}

module.exports = MusicPlayer;