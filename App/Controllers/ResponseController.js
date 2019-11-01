var ResponseController = {};

ResponseController.sendSuccessResponse = function(req, res, message, data, code) {
    code = code ? code : 200;
    let responseObj = { code : code, messages : message || "SuccessFul" }
    responseObj['data'] = data;
    console.log('response send for ',req.url);
    res.send(responseObj);
}

ResponseController.sendErrorResponse = function(req, res, message, data, code) {
    code = code ? code : 500;
    let responseObj = { code : code, messages : message || "Error" }
    responseObj['data'] = data;
    res.send(responseObj);
}

module.exports = ResponseController;