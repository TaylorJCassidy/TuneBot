module.exports = (message) => {
    const time = new Date().toString().substring(0,24);
    console.log(`${time}: ` + message);
};