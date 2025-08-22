const TransportStream = require("winston-transport");
const { SERVICE_NAME, LOG_COLLECTION_NAME } = require("../config/configs");
const { get_current_date_time, get_current_time, get_current_date } = require("./time");
const { LOG_LEVELS, LOG_BATCH_SIZE, LOG_INTERVAL } = require("../constants/loggerConstants");
const shutdownHandler = require("./shutdownHandler");
const dbInstance = require("./dbConnection"); 

const is_plain_object = (obj) => {
    return obj != null && typeof obj === "object" && obj.constructor === Object;
};

class DBTransport extends TransportStream {
    constructor() {
        let opts = {
            level: "db",
            batchSize: LOG_BATCH_SIZE,
            interval: LOG_INTERVAL,
        };
        super(opts);
        this.level = "db";
        this.collection_name = LOG_COLLECTION_NAME;
        this.batch_size = LOG_BATCH_SIZE;
        this.interval = LOG_INTERVAL;
        this.logs = [];
        this.collection = null;

        this.initDB();
        this.startBatchWriter();
        shutdownHandler.registerCleanupFunction(() => this.closeConnection(), true);
    }

    async initDB() {
        try {
            const db = await dbInstance.connect();
            this.collection = db.collection(this.collection_name);
            console.log(`${get_current_date_time()} | INFO | LOG DATABASE Connected for logging`);
        } catch (err) {
            console.error(`${get_current_date_time()} | ERROR | Error in Connecting to MongoDB: `, err);
        }
    }

    async empty_log_list() {
        if (!this.collection || this.logs.length === 0) return;
        try {
            await this.collection.insertMany(this.logs);
            this.logs = [];
        } catch (err) {
            console.error(`${get_current_date_time()} | ERROR | Error in Adding Log to Database: `, err);
        }
    }

    async send_to_db() {
        if (!this.collection || this.logs.length === 0) return;
        try {
            const logsToWrite = this.logs.splice(0, this.batch_size);
            await this.collection.insertMany(logsToWrite);
        } catch (err) {
            console.error(`${get_current_date_time()} | ERROR | Error in Adding Log to Database: `, err);
        }
    }

    async startBatchWriter() {
        setInterval(async () => {
            await this.send_to_db();
        }, this.interval);
    }

    async log(info, callback) {
        setImmediate(() => {
            this.emit("logged", info);
        });

        try {
            if (info.level !== "notify" && info.level !== "notifylog") {
                let object_to_log = {
                    level: info.level,
                    level_no: LOG_LEVELS["db"] - LOG_LEVELS[info.level],
                    date: get_current_date(),
                    time: get_current_time(),
                    timestamp: Date.now(),
                    time_zone: "IST (UTC+5:30)",
                    microservice: SERVICE_NAME,
                };
                if (is_plain_object(info.message)) {
                    object_to_log = { ...object_to_log, ...info.message };
                } else {
                    object_to_log.msg = info.message;
                }
                this.logs.push(object_to_log);
            }
        } catch (err) {
            console.error(`${get_current_date_time()} | ERROR | Error in pushing to log queue: `, err);
        }
        this.send_to_db();
        callback();
    }

    async closeConnection() {
        try {
            await this.empty_log_list();
            console.log(`${get_current_date_time()} | INFO | LOG DATABASE Connection Closed`);
        } catch (err) {
            console.error(`${get_current_date_time()} | ERROR | Error in Closing MongoDB Connection: `, err);
        }
    }
}

module.exports = DBTransport;
