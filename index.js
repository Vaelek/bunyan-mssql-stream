'use strict';

var Stream = require('stream').Writable;
var util = require('util');
var sql = require('mssql');

var sqlConnection = {};
var preConnectBuffer = [];
var isConnected = false;
var tableName = '';

function insertRow(data) {
    if (!isConnected) {
        preConnectBuffer.push(data);
        return;
    }

    var request = new sql.Request(sqlConnection);
    if (data.time) {
        data.time = data.time.getUTCFullYear() + '-' +
            ('00' + (data.time.getUTCMonth() + 1)).slice(-2) + '-' +
            ('00' + data.time.getUTCDate()).slice(-2) + ' ' +
            ('00' + data.time.getUTCHours()).slice(-2) + ':' +
            ('00' + data.time.getUTCMinutes()).slice(-2) + ':' +
            ('00' + data.time.getUTCSeconds()).slice(-2) + ':' +
            ('00' + data.time.getUTCMilliseconds()).slice(-3);   
    }

    var fields = 'time';
    var values = '@time';
    request.input('time', data.time);

    for (var key in data)
        if ((!(key === 'msg')) && (!(key === 'v')) && (!(key === 'time'))) {
            if (typeof data[key] === 'object') {
                var _value = JSON.stringify(data[key]);
            } else {
                var _value = data[key];
            }

            fields += ',' + key;
            values += ',@' + key;

            request.input(key, _value);
        }

    var query = 'INSERT INTO ' + tableName + ' (' + fields + ') VALUES (' + values + ')';
    request.query(query, function(err, recordset) {        
        if (err) {
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
            data.levelID = data.level;
            data.level = this.getLoggingLevelString(data.level);
            insertRow(data);
        }
    }
};


util.inherits(consoleStream, Stream);

var createStream = function(config) {
    sqlConnection = new sql.Connection(config, function(err) {

        tableName = config.table;

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