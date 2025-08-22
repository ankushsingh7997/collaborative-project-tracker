const axios = require("axios");
const logger = require("./logger");

const requestHandler = async ({
    method = "GET",
    url,
    payload = "",
    headers = {},
    contentType = "application/json",
    user_id,
    service,
    actid = null,
    log = true,
}) => {
    const startTime = Date.now();
    const requestDetails = {
        method,
        payload,
        headers: {
            "Content-Type": contentType,
            ...headers,
        },
        url,
        start_time: startTime,
        user_id,
        service,
        actid,
    };

    try {
        let axios_config = {
            method,
            maxBodyLength: Infinity,
            url,
            data: payload,
            headers: requestDetails.headers,
            timeout: 7000,
        };
        if (method === "GET") delete axios_config.data;
        const response = await axios.request(axios_config);
        requestDetails.time_taken = Date.now() - startTime;
        requestDetails.response = response.data;
        requestDetails.status = true;
        if (log) logger.request(requestDetails);

        return {
            status: true,
            response: response.data,
            message: "Response Received Successfully",
        };
    } catch (error) {
        let statusCode = error.response?.status;
        if (statusCode < 400) {
            return {
                status: true,
                response: error.response?.data || {},
                message: "OK",
            };
        }
        const errorTypes = {
            ECONNABORTED: "Connection Timeout",
            ECONNREFUSED: "Connection Refused",
            RESPONSE: "Response Received Successfully",
            NO_RESPONSE: "No Response Received",
            UNKNOWN: "Something Went Very Wrong",
        };

        const errorType = error.response ? "RESPONSE" : error.code ? error.code : error.request ? "NO_RESPONSE" : "UNKNOWN";
        const message = errorTypes[errorType] || errorTypes.UNKNOWN;

        if (errorType !== "RESPONSE") {
            requestDetails.time_taken = null;
            requestDetails.response = errorTypes[errorType];
            const logMessage = JSON.stringify(requestDetails);
            logger.notify(`Error Occurred in Sending Request.\n${logMessage}`);
            if (errorType === "UNKNOWN") {
                logger.error({
                    message: error.message,
                    error_function: "requestHandler",
                    service,
                    user_id,
                    actid,
                });
            }
        } else {
            requestDetails.response = error.response.data;
        }

        requestDetails.status = false;
        requestDetails.error_code = error.code ? error.code : "UNKNOWN/NORESPONSE";
        requestDetails.msg = message;
        logger.request(requestDetails);

        return {
            status: false,
            response: error.response?.data || {},
            message,
        };
    }
};

module.exports = requestHandler;
