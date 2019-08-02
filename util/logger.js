const { logLevel, fileLog } = require('../config/log.config.json');
const moment = require('moment');
const fs = require("fs");

module.exports.debugLog = function (req, res, functionName, message) {
    if (logLevel >= 4) {
        if (fileLog) {
            writeToLog("Debug", req, res, functionName, message);
        }
        else {
            return true;
        }
    }

};

module.exports.errorLog = function (req, res, functionName, message) {

    if (logLevel >= 2) {
        if (fileLog) {
            writeToLog("Error", req, res, functionName, message);
        }
        else {
            return true;
        }
    }
};

module.exports.criticalLog = function (req, res, functionName, message) {
    if (logLevel >= 1) {
        if (fileLog) {
            writeToLog("Critical", req, res, functionName, message);
        }
        else {
            return true;
        }
    }
};

function writeToLog(context, req, res, functionName, message) {
    let fileName;
    const request = JSON.stringify(req);
    const response = JSON.stringify(res);
    const msg = 'LogType:: ' + context + '\n' +
        'Log level::' + logLevel + '\n' +
        'Timestamp::' + new Date() + '\n' +
        'FunctionName::' + functionName + '\n' +
        'Request::' + request + '\n' +
        'Response::' + response + '\n' +
        'Message::' + message + '\n' +
        '======================================== \n';
        if(context == 'Debug'){
             fileName = 'debug( '+moment().format("DD-MM-YYYY")+' ).log';
        }
        else if(context == 'Error'){
            fileName = 'error( '+moment().format("DD-MM-YYYY")+' ).log';
        }
        else {
            fileName = 'critical( '+moment().format("DD-MM-YYYY")+' ).log'
        }
        fs.writeFile(fileName , msg, { 'flag': 'a' }, function (err) {
            if (err) {
                return err;
            }
        });
}