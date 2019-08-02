module.exports.getResponse = function (msg, result, flag) {
    let response = {
        "status": {
            "statusCode": "",
            "statusMessage": msg
        }
    };
    if (flag) {
        response.status.statusCode = "200";
        response.data = result;
        return response;
    }
    else {
        response.status.statusCode = "500";
        response.error = result;
        return response;
    }
};