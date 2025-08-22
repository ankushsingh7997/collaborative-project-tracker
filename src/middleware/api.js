const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");

const api_logs = catchAsync(async (req, res, next) => {
    try {
        let user_id = req.user?._id || "none";
        let payload = req.body || {};
        const clientIp = req.headers["x-forwarded-for"] || req.ip;
        const start_time = Date.now();

        const originalStatus = res.status.bind(res);
        const originalJson = res.json.bind(res);

        let statusCode;
        let responseBody;

        res.status = function (code) {
            statusCode = code;
            return originalStatus(code);
        };

        res.json = function (body) {
            responseBody = body;
            let to_log = {
                time_taken: Date.now() - start_time,
                received_at: start_time,
                status_code: statusCode || res.statusCode,
                received_payload: payload,
                user_id,
                method: req.method,
                url: req.originalUrl,
                sent_payload: body,
                ip: clientIp,
                flow: req.flow || null,
                additional_details: req.additional_details || null,
            };
            logger.api(to_log);
            return originalJson(body);
        };

        next();
    } catch (err) {
        logger.notify("Error occurred while logging for API");
        logger.error(err);
        next();
    }
});

module.exports = api_logs;
