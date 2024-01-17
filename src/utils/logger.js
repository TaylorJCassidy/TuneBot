module.exports = (where) => {
    return (log, level = 'info') => {
        console[level](`${new Date().toISOString()} - ${level.toUpperCase()} - ${where} :`, log);
    };
};