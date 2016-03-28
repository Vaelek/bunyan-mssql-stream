# Bunyan MS SQL Stream

Bunyan MSSQL Stream provides a logging stream direct to a MS SQL table.

Minimum required fields in your table are
* time (DateTime)
* name (string)
* hostname (string)
* pid (int)
* level (string)

Any objects passed to the logger will be inserted into fields of the same name.

## Installation
```npm install bunyan-mssql-stream```

### Sample Usage
```
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

logger.info( { message: 'hello world', source: "MySampleFunction" } );
```
The above example will log all INFO messages to the SQL table defined in log_config.table. 
Along with the default fields, "**hello world**" will be inserted into a field named **message**, and "**MySampleFunction**" into a field named **source**. Any fields used must already exist on your table. Do not use a field named **msg**!

If you pass in an object, it will be automatically stringified and written as JSON text.
For example
```
logger.info( { message: {MyVar1: 'Value 1', MyVar2: 'Value 2'} } );
```
and
```
var myObject = {
    MyVar1: 'Value 1',
    MyVar2: 'Value 2'
};

logger.info({ message: myObject });
```
will both log the text ```{ MyVar1: 'Value 1', MyVar2: 'Value 2' }``` to the **message** field.
