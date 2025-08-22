const appError = require("./appError");
const logger = require("./logger");

const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const handleCasteErrorDB = (err) => {
    const message = `Invalid ${err.path}:${err.value}.`;
    return new appError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    let value = err?.errmsg?.match(/dup key: { ([^{}]+) }/);
    let message = "";

    if (value) {
        let keyValueString = value[1];
        let formattedString = `{${keyValueString.replace(/(\w+):/g, '"$1":')}}`;
        let keyValueObject = JSON.parse(formattedString);
        for (const key in keyValueObject) {
            if (key === "user_id") continue;
            message += `${capitalize(key.split("_").join(" "))} (${keyValueObject[key]}) already used. Please use another ${capitalize(
                key.split("_").join(" ")
            )}. `;
        }
    } else {
        message = err.message;
    }
    return new appError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((ele) => `${ele.message.replaceAll(`"`, "")}\n`);
    let message = `${errors.join(". ")}`;
    message = message.slice(0, -1);
    return new appError(message, 400);
};

const send_error = (err, req, res) => {
    let err_res = {
        status: err.status,
        message: err.message,
        url: req.originalUrl,
        user_id: `${req?.user_id || req?.user?._id || "open_route"}`,
        // errStack: ENVIRONMENT !== "PRODUCTION" ? err.stack : "none",
    };

    if (err.is_operational) {
        return res.status(err.statusCode).json(err_res);
    } else {
        console.log({ ...err, ...err_res });
        logger.notify("Error has occurred in application!! This is global error handler speaking!!");
        logger.error({ ...err, ...err_res });
        err.message = "Something went wrong!!";
        return res.status(500).json(err);
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = false;
    let error = { ...err };
    error.message = err.message;

    if (err.name === "CastError") {
        error = handleCasteErrorDB(err);
        return send_error(error, req, res);
    }
    if (err.code === 11000 || err?.cause?.code === 11000) {
        error = handleDuplicateFieldsDB(err);
        return send_error(error, req, res);
    }
    if (err.name === "ValidationError") {
        error = handleValidationErrorDB(err);
        return send_error(error, req, res);
    }
    return send_error(error, req, res);
};
