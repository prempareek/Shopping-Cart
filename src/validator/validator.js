const isValid = function (value) {
    if (typeof (value) === undefined || typeof (value) === null) { return false }
    if (typeof (value) === "string" && value.trim().length > 0) { return true }
    if (typeof (value) === "number" && value.toString().trim().length > 0) { return true }
    if (typeof (value) === "object" && value.length > 0) { return true }
}

const isRightFormatemail = function (email) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

const isRightFormatmobile = function (phone) {
    return /^([+]\d{2})?\d{10}$/.test(phone);
}







module.exports.isValid = isValid;
module.exports.isRightFormatemail = isRightFormatemail;
module.exports.isRightFormatmobile = isRightFormatmobile;