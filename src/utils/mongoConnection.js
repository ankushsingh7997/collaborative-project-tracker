const mongoose = require("mongoose");
const { DB_URL } = require("../config/configs");
const logger = require("./logger");
const shutdown_handler = require("./shutdownHandler");
const { get_current_date_time } = require("./time");

let connection;

async function connectToDb() {
    console.log("trying ....")
    mongoose
        .connect(DB_URL,{serverSelectionTimeoutMS: 30000})
        .then((con) => {
            connection = con;
            logger.info("Database Connection Successful.");
        })
        .catch((err) => {
            logger.info(err);
            logger.notify("Database Connection Failed.");
        });
}

async function closeDbConnection() {
    if (connection) {
        try {
            await mongoose.connection.close();
            console.log(`${get_current_date_time()} | INFO | Database Connection Closed.`);
        } catch (err) {
            console.error(`${get_current_date_time()} | ERROR | Error in closing database connection: `, err);
        }
    }
}

shutdown_handler.registerCleanupFunction(async () => await closeDbConnection(), true);
module.exports = connectToDb;
