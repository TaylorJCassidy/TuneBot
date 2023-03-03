const configs = Object.freeze(require('../../config/musicConsts.json'));

class Queue {
    
    queue;
    maxlength;
    startIndex = 0;
    noElements = 0;

    constructor() {
        this.maxlength = configs.MAXQUEUE;
        this.queue = new Array(this.maxlength);
    }

    add(e) {
        if (this.noElements + 1 > this.maxlength) {
            return false;
        }
        else {
            this.queue[(this.startIndex+this.noElements++)%this.maxlength] = e;
            return true;
        }
        
    }

    peek() {
        return this.queue[this.startIndex];
    }

    remove() {
        let toReturn = this.queue[this.startIndex];
        this.startIndex = ++this.startIndex%this.maxlength;
        this.noElements--;
        return toReturn;
    }

    removeFromPos(offset) {
        if (offset > this.maxlength) {throw new Error('position is greater than max size of queue');}
        let wrappedOffset = (this.startIndex+offset-1)%this.maxlength;
        let toReturn = this.queue[wrappedOffset];
        this.noElements--;
        for (let i=wrappedOffset;i<this.noElements;i++) {
            let j = i%this.maxlength;
            this.queue[j] = this.queue[j+1];
        }
        return toReturn;
    }

    toString() {
        let toReturn = '';
        for (let i =0;i<this.noElements;i++) {
            toReturn += this.queue[(this.startIndex+i)%this.maxlength] + '\n';
        }
        return toReturn;
    }

    toArray() {
        let toReturn = new Array(this.noElements);
        for (let i =0;i<this.noElements;i++) {
            toReturn[i] = this.queue[(this.startIndex+i)%this.maxlength];
        }
        return toReturn;
    }

    size() {
        return this.noElements;
    }

    isEmpty() {
        return this.noElements == 0;
    }

}

module.exports = Queue;