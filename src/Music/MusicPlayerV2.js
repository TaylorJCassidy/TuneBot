const { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const {MessageButton, MessageActionRow} = require('discord.js');
const ytdl = require('ytdl-core');//4.10
const ytsr = require('ytsr');//3.5.3

const parseTime = require('../Utils/parseTime.js');
const commonResponses = Object.freeze(require('./MusicErrorReponses.json'));
const configs = Object.freeze(require('../../config/musicConsts.json'));
const Queue = require('../Utils/Queue.js');
const logger = require('../Utils/logger.js');

class MusicPlayerV2  {
 
    msg;
    buttons;
    buttonBindings;
    audioPlayer;
    connection;
    queue = new Queue(configs.MAXQUEUE);
    isPlaying = false;
    isLooping = false;
    isPaused = false;
    collector;
    currentTrack;
    trackTime;
    leaveTimeout;

    constructor() {
        this.buttons = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('stop')
					.setStyle('SECONDARY')
                    .setEmoji('⏹️'),
                new MessageButton()
					.setCustomId('loop')
					.setStyle('SECONDARY')
                    .setEmoji('🔁'),
                new MessageButton()
					.setCustomId('q')
					.setStyle('SECONDARY')
                    .setEmoji('🇶'),
                new MessageButton()
					.setCustomId('pause')
					.setStyle('SECONDARY')
                    .setEmoji('⏯️'),
                new MessageButton()
					.setCustomId('skip')
					.setStyle('SECONDARY')
                    .setEmoji('➡️'),
			);

        this.buttonBindings = new Map([
            ['stop',this.stop],
            ['loop',this.loop],
            ['q',this.q],
            ['pause',this.togglePaused],
            ['skip',this.skip]
        ]);

    }

    musicController(msg,cmd,arg) {
        this.msg = msg;
        switch(cmd.toLowerCase()) {
            case 'play':
            case 'p':
                if (arg === '') {
                    msg.channel.send(this.togglePaused());
                }
                else {
                    this.play(arg);
                }
                break;
            case 'skip':
            case 'fs':
            case 's':
                msg.channel.send(this.skip());
                break;
            case 'queue':
            case 'q':
                msg.channel.send(this.q());
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
                msg.channel.send(this.stop());
                break;
            case 'unpause':
            case 'pause':
                msg.channel.send(this.togglePaused());
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
                msg.channel.send(this.loop());
                break;
            case 'looping':
                this.looping();
                break;
            case 'bassboost':
                //this.bassboost(arg);
                msg.channel.send('Bass boost is temporarily broken. Blame Discord');
                break;
            case 'help':
                this.help();
                break;
            default:
                return false;
        }
        return true;
    }

    async join() {
        if (await this._connect()) {
            this._timeout();
        }
    }

    q() {
        if (!this.isPlaying) {
            return ':hole: The queue is empty';
        }
        else {
            let qString = `Current track is: **${this.currentTrack.title}**\n`;
            const currentTrackLength = parseInt(this.trackTime);

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

            return qString;
        }
    }

    stop() {
        if (this._isValid()) {
            if (this.isPlaying) {
                this._clearFields();
                return ':stop_button: Stopped';
            }
            else {
                return commonResponses.NO_TRACK_PLAYING;
            }
        }
    } 

    togglePaused() {
        if (this._isValid()) {
            let tosend;
            if (this.isPlaying) {
                if (this.isPaused) {
                    if (this.audioPlayer.unpause()) {
                        clearTimeout(this.leaveTimeout);
                        tosend = ':arrow_forward: The track has been resumed';
                    }
                    else {
                        tosend = 'There has been an error';
                    }         
                }
                else {
                    if (this.audioPlayer.pause()) {
                        this._timeout();
                        tosend = ':pause_button: The track has been paused';
                    }
                    else {
                        tosend = 'There has been an error';
                    }
                }
                this.isPaused = !this.isPaused;
            }
            else {
                tosend = commonResponses.NO_TRACK_PLAYING;
            }
            return tosend;
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

    loop() {
        if(this._isValid()) {
            if (this.isPlaying) {
                this.isLooping = !this.isLooping;
                return `:repeat: The track is ${this.isLooping ? 'now':'no longer'} looping`;
            }
            else {
                return commonResponses.NO_TRACK_PLAYING;
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


    leave() {
        if (this._isValid()) {
            this.connection.disconnect();
        }
    }

    skip() {
        if (this._isValid()) {
            if (this.isPlaying) {
                this.audioPlayer.stop();
                return ':white_check_mark: Track skipped';
            }
            else {
                return commonResponses.NO_TRACK_PLAYING;
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

    async play(arg) {
        if (await this._connect()) {
            let info = {
                title: null,
                url: null,
                length: null
            };

            try {
                if (ytdl.validateURL(arg)) {
                    const options = {
                        requestOptions: {
                            headers: {cookie: configs.COOKIE}
                        }
                    };
                    const tempinfo = (await ytdl.getBasicInfo(arg,options)).videoDetails;
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
                //info.url = info.url.substring(0,info.url.search(/&/));

                if (/(nightcore|chipmunk)/i.test(info.title)) {
                    throw new Error('nightcore');
                }

                if (!this.isPlaying) {
                    this._playMusic(info);
                    const msgContent = {
                        content: `:loud_sound: Now playing: **${info.title}**`,
                        components: [this.buttons]
                    };
                    const message = await this.msg.channel.send(msgContent);
                    this._reactionController(message);
                    clearTimeout(this.leaveTimeout);
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
                logger(e.message);
                this.msg.channel.send(':x: There has been an error, please try again');
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

            if (this._isValidConnection()) {
                return resolve(true);
            }

            const joinParams = {
                channelId: voiceChannel.id,
                guildId: voiceChannel.guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator
            };

            const connection = joinVoiceChannel(joinParams);
            entersState(connection, VoiceConnectionStatus.Ready, 3000).then(() => {
                this.connection = connection;
                this.audioPlayer = createAudioPlayer();
                let retry = 1;

                const listener = (oldState,newState) => {
                    if (voiceChannel.members.size == 1) {
                        this.connection.disconnect();
                    }
                };

                voiceChannel.client.on('voiceStateUpdate', listener);

                //fix for discord api being borked
                connection.on('stateChange', (old_state, new_state) => {
                    if (old_state.status === VoiceConnectionStatus.Ready && new_state.status === VoiceConnectionStatus.Connecting) {
                        connection.configureNetworking();
                        logger('Configured networking');
                    }
                });
            
                connection.on(VoiceConnectionStatus.Disconnected, () => {
                    //if real disconnect, catch should be triggered
                    Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, configs.DISCONNECTTIMEOUT),
                        entersState(connection, VoiceConnectionStatus.Connecting, configs.DISCONNECTTIMEOUT),
                    ]).catch(() => {
                        this.audioPlayer.removeAllListeners();
                        this._clearFields();
                        this.connection.destroy();
                        this.msg.client.removeListener('voiceStateUpdate',listener);
                    });
                });
                
                this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
                    if (this.isLooping) {
                        this._playMusic(this.currentTrack);
                    }
                    else if (this.queue.isEmpty()) {
                        this.isPlaying = false;
                        this._timeout();
                    }
                    else {
                        this._playMusic(this.queue.remove());
                    }
                });

                this.audioPlayer.on('error', (e) => {
                    logger('=========== SOMETHING WENT WRONG ===========');
                    if (e.message == 'Status code: 403' && retry <= configs.MAXRETRIES) {
                        logger(`Retrying, attempt ${retry}/${configs.MAXRETRIES}: ` + this.currentTrack.url);
                        setTimeout(() => {
                            this._playMusic(this.currentTrack,retry++);
                        },configs.RETRYTIMEOUTLENGTH);
                    }
                    else {
                        logger(this.currentTrack.url + '\n' + e.message);
                        this.audioPlayer.stop();
                        if (this.queue.isEmpty()) {
                            this.msg.channel.send(`:x: Unable to play the track **${this.currentTrack.title}**. Please try again`);
                        }
                        else {
                            this.msg.channel.send(`:x: Unable to play the track **${this.currentTrack.title}**. Playing next track`);
                        }
                    }
                    logger('============================================');
                });

                connection.subscribe(this.audioPlayer);
                resolve(true);
            })
            .catch((e) => {
                this.msg.channel.send('Unable to join channel, please try again');
                logger(e);
                resolve(false);
            });
        });
    }

    _isValidConnection() {
        return this.connection && this.connection.state.status == VoiceConnectionStatus.Ready;
    }

    _playMusic(info) {
        this.isPlaying = true;
        const options = { 
            quality: [250,251,249],
            highWaterMark: 1 << 25,
            requestOptions: {
                headers: {cookie: configs.COOKIE}
            }
        };
        const stream = ytdl(info.url, options);
        this.audioPlayer.play(createAudioResource(stream,{inputType: StreamType.WebmOpus}));   
        this.currentTrack = info;
        this.trackTime = info.length;
        //all error handling is part of _connect
    }
    
    _reactionController(msg) {
        if (this.collector && !this.collector.ended) {
            this.collector.stop();
        }

        const filter = (buttonClick,user) => {
            return user.id != msg.client.user.id;
        };
        this.collector = msg.createMessageComponentCollector({filter: filter, componentType: 'BUTTON', dispose: true});

        this.collector.on('collect', i => {
            i.deferUpdate();
            i.channel.send(`${i.user.toString()}, ${this.buttonBindings.get(i.customId).call(this)}`);
        });

        this.collector.on('end', collected => {
            msg.edit({components: []});
        });
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

    _clearFields() {
        this.queue = new Queue();
        this.isPlaying = false;
        this.isLooping = false;
        this.isPaused = false;
        this.audioPlayer.stop(true);

        if (this.collector && !this.collector.ended) {
            this.collector.stop();
        }
    }

}

module.exports = MusicPlayerV2;