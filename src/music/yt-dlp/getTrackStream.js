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
    `--ffmpeg-location ${ffmpeg}`,
    '--buffer-size 128k'
];

module.exports = (url) => {
    if (!isValidHttpUrl(url)) return;

    const ytDlp = spawn('./src/music/yt-dlp/yt-dlp', [...options, url], {shell: true});

    ytDlp.stderr.on('data', data => {
        if (!ytDlp.stdout.destroyed) {
            ytDlp.stdout.emit('error', data);
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