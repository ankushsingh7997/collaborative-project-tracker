const { PORT } = require("./src/config/configs");
const logger = require("./src/utils/logger");
const app = require("./src/app/app");
const connectToDb = require("./src/utils/mongoConnection");

connectToDb();

const server = app.listen(PORT, () => {
    logger.info(`App successfully listening on port ${PORT}`);
});
