'use strict';

// Logging class for sending messages to console log
class Logger {
    constructor() { }

    static log(level, message) {
        if (level <= process.env.LOGGING_LEVEL) {
            console.log('[info] ', message);
        }
    }

    static warn(level, message) {
        if (level <= process.env.LOGGING_LEVEL) {
            console.log('[warn] ', message);
        }
    }

    static error(level, message) {
        if (level <= process.env.LOGGING_LEVEL) {
            console.log('[error] ', message);
        }
    }

    static get levels() {
        return {
            INFO: 1,
            ROBUST: 2,
        };
    }
}

module.exports = Object.freeze(Logger);
