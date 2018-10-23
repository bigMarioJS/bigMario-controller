//import bunyan from 'bunyan';
import moment from 'moment'

const getTimeStamp = () => moment().format('HH:MM:SS');

export default class Logger {
  constructor () {
    //this.logger = bunyan.createLogger({name: "cultivate-controller"});
  }

  silly (msg) {
    //console.log(`[${getTimeStamp()}] SILLY ${msg}`)
  }

  info (msg) {
    console.log(`[${getTimeStamp()}] INFO ${msg}`)
  }

  warn (msg) {
    console.log(`[${getTimeStamp()}] WARN ${msg}`)
  }

  error (message, error) {
    console.log(`[${getTimeStamp()}] ERROR ${message} Stack: ${error}`)
  }
}
