const { spawn } = require('node:child_process');
const ffmpeg = require("ffmpeg-static");

const formats = [
    251,
    250,
    249,
    140,
    141
];

const options = [
    '-o -', //write to stdout
    '-q', //be quiet
    `-x`, //audio only
    `-f ${formats.join('/')}`, //formats in order of priority
    '--extractor-args "youtube:player-client=tv,web_embedded,web_music"',
    `--ffmpeg-location ${ffmpeg}`,
    '--js-runtimes node',
    '--buffer-size 16k'
];

module.exports = (url) => {
    if (!isValidHttpUrl(url)) return;

    const ytDlp = spawn('./src/yt_dlp', [...options, url], {shell: true});

    ytDlp.stderr.on('data', data => {
        console.log(data.toString());
        if (!ytDlp.stdout.destroyed) {
            ytDlp.stdout.emit('error', data);
            ytDlp.kill();
        }
    });

    return ytDlp.stdout;
};

function isValidHttpUrl(url) {
    let validUrl;
    
    try {
        validUrl = new URL(url);
    } catch (_) {
      return false;  
    }
  
    return validUrl.protocol === "http:" || validUrl.protocol === "https:";
  }