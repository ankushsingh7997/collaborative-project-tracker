const { createClient } = require("redis");
const { REDIS_CONFIG, UNDERLYINGS } = require("../congig/configs");
const logger = require("./logger");
const shutdownHandler = require("./shutdownHandler");

class RedisConnections {
    constructor() {
        /*

            @ redis_config structure
            {
                host,
                port,
                passowrd,
                name
            }
        
        */
        this.client_map = {};
        this.pub_map = {};
        this.sub_map = {};
        for (let i = 0; i < REDIS_CONFIG.length; i++) {
            let conf = REDIS_CONFIG[i];
            let redis_config =
                conf.password === "NONE"
                    ? {
                          host: conf.host,
                          port: conf.port,
                      }
                    : {
                          password: conf.password,
                          socket: {
                              host: conf.host,
                              port: conf.port,
                          },
                      };
            if (conf.cache) this.connect_cache(redis_config, conf.name);
            if (conf.pub) this.connect_publisher(redis_config, conf.name);
            if (conf.sub) this.connect_subscriber(redis_config, conf.name, conf.topics_to_subscribe);
        }
    }

    set_hooks(redis_client, name, type, shutdown_function) {
        redis_client.on("connect", () => {
            logger.info(`Redis client connected to ${name} for ${type}`);
        });
        redis_client.on("error", (err) => {
            logger.notify(`Redis ${name} encountered an error, Type : ${type}`);
            logger.error(`Redis ${name} encountered an error:`, err);
        });
        redis_client.on("ready", () => {
            logger.info(`Redis ${name} is ready to use for ${type}`);
        });
        redis_client.on("end", () => {
            logger.info(`Redis ${name} connection has closed. Type: ${type}`);
        });
        shutdownHandler.registerCleanupFunction(shutdown_function, true);
    }

    connect_cache(config, name) {
        this.client_map[name] = createClient(config);
        this.set_hooks(this.client_map[name], name, "cache", async () => {
            if (this.client_map[name]) {
                await this.client_map[name].quit();
                logger.info(`Redis ${name} connection is beging closed. Type: cache`);
            }
        });
        this.client_map[name].connect();
    }

    get_redis_client(name) {
        return this.client_map[name] ? this.client_map[name] : undefined;
    }

    
}

module.exports = new RedisConnections();
