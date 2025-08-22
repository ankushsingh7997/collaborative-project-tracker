const jwt = require("jsonwebtoken");
const { ENVIRONMENT, JWT_SECRET, JWT_EXPIRY_DAYS } = require("../config/configs");
const logger = require("../utils/logger");

function sign_jwt(mongodb_user_id, ) {
    return jwt.sign({ id: mongodb_user_id  }, JWT_SECRET, {
        expiresIn: JWT_EXPIRY_DAYS * 24 * 60 * 60,
    });
}

function sign_and_send_token(user_id,  res, status_code, message = "None") {
    try {
        let cookie_options = {
            expires: new Date(Date.now() + JWT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: ENVIRONMENT !== "LOCAL",
        };
        let token = sign_jwt(user_id );
        res.cookie("jwt", token, cookie_options);
        let response_to_send = { status: true, message };
        if (ENVIRONMENT !== "PRODUCTION") response_to_send.jwt = token;
        return res.status(status_code).json(response_to_send);
    } catch (err) {
        logger.notify("Error signing token while logging in!!");
        logger.error(err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong!!",
        });
    }
}

async function get_and_verify_user(Model, token) {
    try {
        if (!token) return { status: false, message: "Please login to get access!!", code: 401 };
        let user_data = jwt.verify(token, JWT_SECRET);
        let user = await Model.findById(user_data.id).select("+password_changed_at");
        if (!user) return { status: false, message: "User does not exist!!", code: 404 };
        if (await user.check_changed_password(user_data.iat))
            return { status: false, message: "Password recently changed, Please login again!!", code: 401 };
        return { status: true, data: user, message: "User Found!", id: user_data.id };
    } catch (err) {
        let err_name = err.name;
        if (err_name !== "JsonWebTokenError" && err_name !== "TokenExpiredError") {
            logger.notify("Error in decoding jwt!");
            logger.error(err);
            return { status: false, message: "Something went worng!", code: 500 };
        } else {
            return { status: false, message: "Please login again to access!!", code: 401 };
        }
    }
}

module.exports = { sign_jwt, sign_and_send_token, get_and_verify_user };
