const fs = require("fs");
const winston = require("winston");
const { LOG_LEVELS, LEVEL } = require("../constants/loggerConstants");
const { SERVICE_NAME, ENVIRONMENT, CLUSTER_ID, INTERNAL_IP } = require("../config/configs");
const { get_current_date_time } = require("./time");
const DBTransport = require("./mongoTransport");


if (!fs.existsSync("./Logs")) {
    // fs.mkdirSync("./Logs");
}

const custom_format = winston.format.printf(({ level, message }) => {
    if (level === "order") return `${get_current_date_time()} | ${level.toUpperCase()} | Order update received and stored in logs - ${message.actid}`;
    return `${get_current_date_time()} | ${level.toUpperCase()} | ${typeof message === "string" ? message : JSON.stringify(message)}`;
});

const console_filter = winston.format((info) => {
    const levelsToSkip = ["notify", "notifylog", "error", "request", "order", "strategy", "api", "monitor", "db", "telegram"];
    if (levelsToSkip.includes(info.level)) {
        return false;
    }
    return info;
});


const dbTransport = new DBTransport();

const logger = winston.createLogger({
    levels: LOG_LEVELS,
    level: LEVEL,
    format: winston.format.combine(custom_format),
    transports:
        ENVIRONMENT !== "LOCAL"
            ? [
                  new winston.transports.Console({
                      format: winston.format.combine(console_filter(), custom_format),
                  }),
                  
                  dbTransport,
                  
              ]
            : [new winston.transports.Console()],
});

module.exports = logger;
