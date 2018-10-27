const SerialPort = require('serialport')
const Delimiter = require('@serialport/parser-delimiter')
const Ready = require('@serialport/parser-ready')

import Logger from '../utils/Logger';
const timeout = ms => new Promise(res => setTimeout(res, ms))

const logger = new Logger();

export default class Board {
  constructor(sensorData) {
    this.board = null;
    this.sensorData = sensorData;
    this.sensorReady = null;

    this.init = this.init.bind(this)
    this.listener = this.listener.bind(this)
  }

  async init() {
    logger.info('Intializing Arduino board...')

    while (!this.board) {

      let allSerialPorts;

      try {
        allSerialPorts = await SerialPort.list()
      } catch (ex) {
        logger.error('Cannot get system serial ports, board init failed')
      }

      let arduinoPort = allSerialPorts.filter(port => {
        if (port.manufacturer) {
         return port.manufacturer.toLowerCase().includes('arduino')
        }
      })

      if (arduinoPort.length === 0) {
        logger.error('Arduino board not connected')
        await timeout(1000)
      } else {
        logger.info('Board found waiting for sensor data')
        let port = arduinoPort[0]
        this.board = new SerialPort(port.comName);
      }
    }

    this.listener();

    console.log(this.board)

    while (!this.sensorReady) {
      await timeout(1000)
    }

    return true

  }

  listener() {
    const reader = this.board.pipe(new Delimiter({
      delimiter: '\r\n'
    }))

    reader.on('close', () => {
        console.log('closed')
      })

      reader.on('error', () => {
        console.log('error')
      })

    reader.on('data', (data) => {
      let parsedJson

      try {
        parsedJson = JSON.parse(data)
      } catch {
        console.log('bad data')
        parsedJson = null;
      }

      if (parsedJson) {
        console.log('-------', parsedJson)
        this.sensorReady = true;
        this.sensorData.setData({
          relativeHumidityOne: parsedJson.readings.relativeHumidity,
          tempatureCelsiusOne: parsedJson.readings.celsius
        })
      }
    })
  }
}



// let serialPort;


// let findPort = function () {
//   SerialPort.list().then(ports => {
//     return arduinoPort = ports.map(port => {
//       if (port.manufacturer === 'Arduino LLC') {
//         console.log('prot found', port)
//       }
//     })
//   })
// }

// findPort();


// const reader = port.pipe(new Delimiter({ delimiter: '\r\n' }))
// reader.on('data', (data) => {
//   // check for good json
//   console.log(data.toString())
// })

// reader.on('close', () => {
//   console.log('closed')
// })