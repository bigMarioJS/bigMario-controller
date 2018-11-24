import moment from 'moment'
const stripAnsi = require('strip-ansi');


var winston = require('winston');

//var logzioWinstonTransport = require('winston-logzio');
const LogzioWinstonTransport = require('winston-logzio');

const logzioWinstonTransport = new LogzioWinstonTransport({
  level: 'info',
  name: 'winston_logzio',
  token: 'NmnKlRdaLLJBMsIicXCeugjYnlYvhNrA',
});

const logger = winston.createLogger({
  transports: [logzioWinstonTransport]
});

// var loggerOptions = {
//     token: 'NmnKlRdaLLJBMsIicXCeugjYnlYvhNrA',
//     host: 'listener.logz.io',
//     type: 'YourLogType'     // OPTIONAL (If none is set, it will be 'nodejs')
// };

//winston.add(logzioWinstonTransport, loggerOptions);

//TODO get real logger

const getTimeStamp = () => moment().format('HH:MM:SS');

export default class Logger {
  constructor () {
    //this.logger = bunyan.createLogger({name: "cultivate-controller"});
  }

  silly (message) {
    console.log(`[${getTimeStamp()}] SILLY ${message}`)
    logger.log('silly', stripAnsi(message));

  }

  info (message) {
    console.log(`[${getTimeStamp()}] INFO ${message}`)
    logger.log('info', stripAnsi(message));

  }

  warn (message) {
    console.log(`[${getTimeStamp()}] WARN ${message}`)
    logger.log('warn', message);
  }

  error (message, error) {
    //TODO log to api
    console.log(`[${getTimeStamp()}] ERROR ${message} Stack: ${error}`)
    logger.log('warn', message, error);
  }
}
