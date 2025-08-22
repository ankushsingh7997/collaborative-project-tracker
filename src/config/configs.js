const os = require("os");
const dotenv = require("dotenv");
const fs = require("fs");
let env_file = `.env.${process.env.NODE_ENV}`;

if (fs.existsSync(env_file)) {
    dotenv.config({ path: env_file });
} else {
    console.log(`${process.env.NODE_ENV ? process.env.NODE_ENV + " file is missing" : "No environment configured"} , loading default file`);
    dotenv.config();
}

function getInternalIp() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        for (const iface of interfaces[interfaceName]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null;
}

function requireEnv(key) {
    const val = process.env[key];
    if (!val) throw new Error(`Missing env variable ${key}`);
    return val.trim();
}

exports.SERVICE_NAME = requireEnv("SERVICE_NAME");
exports.CLUSTER_ID = requireEnv("ID");
exports.ENVIRONMENT = requireEnv("NODE_ENV").toUpperCase();
exports.INTERNAL_IP = getInternalIp();

// - Server Configs
exports.PORT = requireEnv("PORT");

// - Redis Configs
exports.REDIS_CONFIG = [
    {
        name: requireEnv("BROKER_REDIS_NAME"),
        host: requireEnv("BROKER_REDIS_HOST_URL"),
        port: requireEnv("BROKER_REDIS_PORT"),
        password: requireEnv("BROKER_REDIS_PASSWORD"),
        pub: +requireEnv("BROKER_REDIS_PUBLISHER"),
        sub: +requireEnv("BROKER_REDIS_SUBSCRIBER"),
        cache: +requireEnv("BROKER_REDIS_CACHE"),
        topics_to_subscribe: requireEnv("BROKER_REDIS_SUB_TOPICS").split(","),
    },
];

// - Monitoring and Logging
exports.LOG_DB_URI = requireEnv("LOG_DB_URI");
exports.LOG_DB_NAME = `${requireEnv("NODE_ENV").toUpperCase()}_${requireEnv("LOG_DB_NAME")}`;
exports.LOG_COLLECTION_NAME = "logs";

// - Database
exports.DB_URL = requireEnv("DB_URL");

// - Database Encryption
exports.ENCRYPTION_SECRET_KEY = requireEnv("ENCRYPTION_SECRET_KEY");
exports.ENCRYPTION_METHOD = requireEnv("ENCRYPTION_METHOD");

// - Authentication
exports.JWT_SECRET = requireEnv("JWT_SECRET");
exports.JWT_EXPIRY_DAYS = requireEnv("JWT_EXPIRY_DAYS");
