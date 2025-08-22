const pad = (num, size) => {
    let s = num.toString();
    while (s.length < size) s = "0" + s;
    return s;
};
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

exports.get_current_date_time = () => {
    return `${this.get_current_date("dd-mmm-yyyy")} ${this.get_current_time()}`;
};

exports.get_current_date = (format) => {
    let check_format = format?.toLowerCase() || "defualt";

    let now = new Date();
    const day = pad(now.getDate(), 2);
    const month = pad(now.getMonth() + 1, 2);
    const year = now.getFullYear();
    switch (check_format) {
        case "yyyy-mmm-dd":
            return `${year}-${months[now.getMonth()]}-${day}`;
        case "yy-mm-dd":
            return `${year.slice(-2)}-${month}-${day}`;
        case "dd-mm-yyyy":
            return `${day}-${month}-${year}`;

        case "dd-mmm-yyyy":
            return `${day}-${months[now.getMonth()]}-${year}`;

        default:
            return `${year}-${month}-${day}`;
    }
};

exports.get_future_date = (format = "default", days = 30, startDate = null) => {
    const check_format = format?.toLowerCase();
    const pad = (num, size) => num.toString().padStart(size, "0");

    const baseDate = startDate ? new Date(startDate) : new Date();
    const futureDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    const day = pad(futureDate.getDate(), 2);
    const month = pad(futureDate.getMonth() + 1, 2);
    const year = futureDate.getFullYear();

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    switch (check_format) {
        case "yyyy-mmm-dd":
            return `${year}-${months[futureDate.getMonth()]}-${day}`;
        case "yy-mm-dd":
            return `${year.toString().slice(-2)}-${month}-${day}`;
        case "dd-mm-yyyy":
            return `${day}-${month}-${year}`;
        case "dd-mmm-yyyy":
            return `${day}-${months[futureDate.getMonth()]}-${year}`;
        default:
            return `${year}-${month}-${day}`;
    }
};

exports.get_current_time = () => {
    let now = new Date();
    const hours = pad(now.getHours(), 2);
    const minutes = pad(now.getMinutes(), 2);
    const seconds = pad(now.getSeconds(), 2);
    const milliseconds = pad(now.getMilliseconds(), 3);
    return `${hours}:${minutes}:${seconds}:${milliseconds}`;
};

exports.get_seconds_for_day_end = () => {
    let now = new Date();
    let day_end = new Date();
    day_end.setHours(23, 59, 59, 999);
    return Math.ceil((day_end.getTime() - now.getTime()) / 1000);
};

exports.convert_to_alogwiz_ts = (time_string) => {
    let zero = new Date();
    let max = new Date();
    zero.setHours(9, 15, 0, 0);
    max.setHours(15, 30, 0, 0);
    let t = new Date();
    let [hours, minutes, seconds, milliseconds] = time_string ? time_string.split(":") : [];
    if (!hours) hours = 0;
    if (!minutes) minutes = 0;
    if (!seconds) seconds = 0;
    if (!milliseconds) milliseconds = 0;
    hours = hours * 1;
    minutes = minutes * 1;
    seconds = seconds * 1;
    milliseconds = milliseconds * 1;

    t.setHours(hours, minutes, seconds, milliseconds);
    return t.getTime() - zero.getTime();
};

exports.convert_to_time_string = (alogwiz_timestamp) => {
    let now = new Date();
    now.setHours(9, 15, 0, 0);
    let t = new Date(now.getTime() + alogwiz_timestamp);
    return `${pad(t.getHours(), 2)}:${pad(t.getMinutes(), 2)}:${pad(t.getSeconds(), 2)}:${pad(t.getMilliseconds(), 3)}`;
};

exports.clean_time_string = (ts) => {
    return this.convert_to_time_string(this.convert_to_alogwiz_ts(ts));
};

exports.get_delta_milliseconds = (time_delta_string) => {
    const timeDeltaRegex = /^(0[0-6]):([0-5][0-9]):([0-5][0-9])$/;
    if (!timeDeltaRegex.test(time_delta_string)) return false;
    let [hours = 0, minutes = 0, seconds = 0] = time_delta_string.split(":").map((part) => parseInt(part, 10));
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        throw new Error("Invalid time delta string");
    }
    return hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
};

exports.get_one_minute_ahead_time = () => {
    let now = new Date(Date.now() + 1000 * 60);
    const hours = pad(now.getHours(), 2);
    const minutes = pad(now.getMinutes(), 2);
    const seconds = pad(now.getSeconds(), 2);
    const milliseconds = pad(now.getMilliseconds(), 3);
    return `${hours}:${minutes}:${seconds}:${milliseconds}`;
};

exports.day_validation = (days_to_exe) => {
    let current_day = new Date().getDay();
    if (days_to_exe.indexOf(current_day) === -1) return false;
    return true;
};

exports.difference_in_days = (date1, date2) => {
    const diffMs = Math.abs(new Date(date1) - new Date(date2));
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return diffDays;
};
