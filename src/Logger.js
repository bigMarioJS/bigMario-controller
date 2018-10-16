import bunyan from 'bunyan';
import moment from 'moment'

export default class Logger {
  constructor () {
    this.logger = bunyan.createLogger({name: "cultivate-controller"});
  }

  info (msg) {
    console.log(`[${moment().format('HH:MM:SS')}] INFO ${msg}`)
  }

  error (error) {
    console.log(`[${moment().format('HH:MM:SS')}] ERROR ${error}`)
  }


}
