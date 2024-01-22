const EventEmitter = require('node:events');

const eventEmitter = new EventEmitter();
const queue = [];

const add = (element) => {
    queue.push(element);
    eventEmitter.emit('newTrack', element);
};

const remove = () => {
    return queue.shift();
};

const isEmpty = () => {
    return queue.length == 0;
};

module.exports = {
    add,
    remove,
    isEmpty,
    __proto__: eventEmitter
};