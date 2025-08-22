exports.LOG_LEVELS = {
    notify: 1,
    notifylog: 2,
    error: 3,
    request: 4,
    order: 5,
    api: 6,
    db: 7,
    warn: 8,
    info: 9,
    debug: 10,
    telegram: 11,
};

exports.LEVEL = process.env.NODE_ENV?.trim() === "production" ? "info" : "debug";
exports.LOG_BATCH_SIZE = 25;
exports.LOG_INTERVAL = 5000;
