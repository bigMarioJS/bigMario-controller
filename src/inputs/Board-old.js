import five from 'johnny-five';
import Logger from '../utils/Logger';
const timeout = ms => new Promise(res => setTimeout(res, ms))

const logger = new Logger();


export default class Board {
  constructor (sensorData) {
    this.board = null;
    this.sensorData = sensorData;

    this.init = this.init.bind(this)
  }

  async init () {
    let sensorData = this.sensorData

    let boardInited, sensorInited;

    this.board = new five.Board({
      repl: false,
      debug: false,
    });

    this.board.on("ready", function() {
      boardInited = true;
      logger.info('Board ready waiting for sensor data')

      let sensor = new five.Multi({
        controller: "HTU21D"
      });

      sensor.on("change", function() {
        sensorData.setData({
          relativeHumidityOne: this.hygrometer.relativeHumidity,
          tempatureCelsiusOne: this.thermometer.celsius
        })
      })
    });

    while (!boardInited & !this.sensorData) {
      await timeout(2000);
      if (boardInited & sensorInited) {
        logger.info('Board fully intializing.')
        return true;
      }
    }
  }
}