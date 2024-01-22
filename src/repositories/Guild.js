const queue = require("../music/queue");

module.exports = (guildID) => ({
    guildID,
    leaveTimeout: null
});