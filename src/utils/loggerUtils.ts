import * as winston from 'winston'

const level = process.env.LOG_LEVEL;

const config = {
    console: {
        level,
        handleExceptions: true,
        formatLog: item => `[${item.level}]: ${item.message} ${JSON.stringify(item.meta)}`
    }
};

const logger = winston.createLogger({
    levels: winston.config.npm.levels,
    transports: [
        new winston.transports.Console(config.console)
    ],
    exitOnError: false
});

export { logger }