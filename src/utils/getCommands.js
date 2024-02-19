const path = require('path');
const fs = require('fs');
const logger = require('./logger')('getCommands');

const files = fs.readdirSync(path.resolve(__dirname, '../commands'), {withFileTypes: true});
const commands = new Map();

for (const file of files) {
    if (file.isDirectory()) continue;
    const command = require(`../commands/${file.name}`);
    commands.set(command.name, command);
    //if command has aliases, adds alias as a different key to same command object
    if (command.aliases !== undefined) {
        command.aliases.forEach((alias) => {
            if (commands.get(alias)) {
                logger(`Found clashing alias '${alias}'`, 'warn');
            }
            else {
                commands.set(alias, command);
            }
        });
    }
}

module.exports = commands;