module.exports = {
    /**
     * Parse a time string to seconds
     * @param {String} timeString Time string to parse to seconds (hh:mm:ss)
     * @returns {number} Time string pased to seconds
     */
    parseTimeString: function(timeString) {
        let time = timeString.split(':');
        let s = 0;
        let m = 1;

        while (time.length > 0) {
            s += m * parseInt(time.pop(), 10);
            m *= 60;
        }
        return s;
    },
    /**
     * Parse seconds into a time string
     * @param {number} timeInSec Time in seconds to parse to a time string (hh:mm:ss)
     * @returns {String} Seconds parsed into a time string
     */
    toTimeString: function(timeInSec) {
        let time = 's';

        while (timeInSec > 60) {
            let s = timeInSec%60;
            timeInSec -= s;
            time = `:${(s < 10 ? '0' : '')+s}${time}`;
            timeInSec /= 60;
        }

        return `${timeInSec}${time}`;
    }
};