# Bunyan MS SQL Stream

Bunyan MSSQL Stream provides a logging stream direct to a MS SQL table.

Minimum required fields in your table are
* time (DateTime, will log in UTC)
* name (string)
* hostname (string)
* pid (int)
* level (string)
* levelID (int)
* src (string, only required if you plan to enable src)

Any objects passed to the logger will be inserted into fields of the same name. All values converted to parameters to prevent injection.

## Installation
```npm install bunyan-mssql-stream```

### Sample Usage
```js
var bunyan = require('bunyan');
var mssqlStream = require('bunyan-mssql-stream');

var log_config = {
    user: 'db username',
    password: 'db password',
    database: 'default database',
    table: 'log table name',
    server: 'db server host/ip',
    requestTimeout: 30000 // Milliseconds before timing out a query
};

var logger = bunyan.createLogger({
    name: 'logger name',
    streams: [
    {
        level: 'info',
        type: 'raw',
        stream: mssqlStream.createStream(log_config)
    }]
});

logger.info( { message: 'hello world', detail: "Additional details" } );
```
The above example will log all INFO messages to the SQL table defined in log_config.table. 
Along with the default fields, "**hello world**" will be inserted into a field named **message**, and "**Additional Details**" into a field named **detail**. Any fields used must already exist on your table. Do not use a field named **msg**!

If you pass in an object, it will be automatically stringified and written as JSON text.
For example
```js
logger.info( { message: {MyVar1: 'Value 1', MyVar2: 'Value 2'} } );
```
and
```js
var myObject = {
    MyVar1: 'Value 1',
    MyVar2: 'Value 2'
};

logger.info({ message: myObject });
```
will both log the text ```{ MyVar1: 'Value 1', MyVar2: 'Value 2' }``` to the **message** field.

## Notes
* SQL data types will be mapped per https://www.npmjs.com/package/mssql#input
    * If the destination field is of INT type, it is recommended to pass that value as Number(YourVariable) to ensure propper mapping
* Log entries sent before the DB connection has been made are automatically queued and comitted after the connection is up.
* Due to the asynchronous nature, records may not be inserted in the same order they were logged. However if sorted by the **time** field, they can be retrieved in correct chronological order.

### Next Version
* Allow omitting any "required" fields via config
* Add a method for specifying type mapping via config
