module.exports = {
    name: 'uptime',
    run : function(msg,args) {
        let timeIn = msg.client.uptime;
        let time = new Array;

        time[0] = Math.floor(timeIn / 86400000);
        timeIn %= 86400000;
        time[1] = Math.floor(timeIn / 3600000);
        timeIn %= 3600000;
        time[2] = Math.floor(timeIn / 60000);
        timeIn %= 60000;
        time[3] = Math.floor(timeIn / 1000);

        let timeOut = time[0] + 'd ' + time[1] + 'h ' + time[2] + 'm ' + time[3] + 's';

        msg.reply(timeOut);
    }
}