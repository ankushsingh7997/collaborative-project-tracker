const { MongoClient } = require("mongodb");
const { LOG_DB_URI, LOG_DB_NAME } = require("../config/configs");
const { get_current_date_time } = require("./time");

class DBConnection {
    constructor() {
        this.db_uri = LOG_DB_URI;
        this.db_name = LOG_DB_NAME;
        this.client = new MongoClient(this.db_uri);
        this.db = null;
    }

    async connect() {
        if (this.db && this.client.topology?.isConnected()) {
            return this.db;
        }

        try {
            await this.client.connect();
            this.db = this.client.db(this.db_name);
            console.log(`${get_current_date_time()} | INFO | LOG DATABASE Connected`);
            return this.db;
        } catch (err) {
            console.error(`${get_current_date_time()} | ERROR | Error in Connecting to MongoDB: `, err);
            throw err;
        }
    }

    async close() {
        if (this.client && this.client.topology?.isConnected()) {
            try {
                await this.client.close();
                console.log(`${get_current_date_time()} | INFO | LOG DATABASE Connection Closed`);
            } catch (err) {
                send_mattermost_notification("ERROR WHILE CLOSING CONNECTION");
                console.error(`${get_current_date_time()} | ERROR | Error in Closing MongoDB Connection: `, err);
            }
        }
    }
}

const dbInstance = new DBConnection();
module.exports = dbInstance;
