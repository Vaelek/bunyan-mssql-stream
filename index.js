'use strict';

var Stream = require('stream').Writable;
var util = require('util');
var sql = require('mssql');

var sqlConnection = {};
var preConnectBuffer = [];
var isConnected = false;

function insertRow(data) {
    if (!isConnected) {
        preConnectBuffer.push(data);
        return;
    }

    var fields = '';
    var values = '';

    for (var key in data)
        if ((!(key === 'msg')) && (!(key === 'v')) && (!(key === 'time'))) {
            if (typeof data[key] === 'object') {
                var _value = JSON.stringify(data[key]);
            } else {
                var _value = data[key];
            }

            if (fields == '') {
                fields = 'time,' + key + '';
                values = "GetDate(), '" + _value + "'";
            } else {
                fields = fields + "," + key;
                values = values + ",'" + _value + "'";
            }
        }

    var request = new sql.Request(sqlConnection);
    var query = 'INSERT INTO Node_Log (' + fields + ') VALUES (' + values + ')';
    request.query(query, function(err, recordset) {
        if (err) {
            console.log(query);
            console.dir(err)
            return;
        };
    });
}

/**
 * Simple stream that writes log level information and message text to the console stream(s)
 * @param config future use
 */
var consoleStream = function(config) {

    config = config || {};

    this.streamConfig = {};

    /**
     * Returns a string representation of the bunyan log levels
     * @param number bunyanLoggingLevel - integer representing a bunyan logging level
     * @return string representation of bunyanLoggingLevel
     * @see https://github.com/trentm/node-bunyan
     */
    this.getLoggingLevelString = function(bunyanLoggingLevel) {

        switch (bunyanLoggingLevel) {
            case 10:
                return 'TRACE';
            case 20:
                return 'DEBUG';
            case 30:
                return 'INFO';
            case 40:
                return 'WARN';
            case 50:
                return 'ERROR';
            case 60:
                return 'FATAL';
            default:
                return 'INFO';
        }
    };

    /**
     * Write data to the SQL table
     * @param data bunyan log record
     */
    this.write = function(data) {
        if (data) {
            data.level = this.getLoggingLevelString(data.level);
            insertRow(data);
        }
    }
};


util.inherits(consoleStream, Stream);

var createStream = function(config) {
    sqlConnection = new sql.Connection(config, function(err) {        
        if (err) console.dir(err);
        else {
            isConnected = true;

            for (var i = 0; i < preConnectBuffer.length; i++)
                insertRow(preConnectBuffer[i]);

            preConnectBuffer = [];
        }
    });

    return new consoleStream(config);
};

module.exports.createStream = createStream;