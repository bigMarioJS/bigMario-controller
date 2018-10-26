import "@babel/polyfill";

import five from 'johnny-five';
import axios from 'axios';
import express from 'express';

import config from './utils/config';

import Logger from './utils/Logger';
import growProfile from './growProfile'

import SensorData from './inputs/sensorData';
import Outlets from './outputs/Outlets';
import Board from './inputs/Board'

import HeatLoop from './loops/HeatLoop';
import StatusLoop from './loops/StatusLoop';
import HumidityLoop from './loops/HumidityLoop'
import SendDataLoop from './loops/SendDataLoop';

import Scheduler from './loops/Scheduler'

const logger = new Logger();

let initialized;

const sensorData = new SensorData();
const board = new Board(sensorData);
const outlets = new Outlets(config);


let loops = {
  heatLoop: new HeatLoop(sensorData, growProfile, outlets),
  humidityLoop: new HumidityLoop(sensorData, growProfile, outlets),
  sendDataLoop: new SendDataLoop(sensorData, growProfile, outlets, initialized)
}

loops.statusLoop = new StatusLoop(sensorData, growProfile, outlets, loops)

const scheduler = new Scheduler(growProfile, outlets);

logger.info("Starting app")

const app = express();
app.get('/sensorData', (req, res) => res.send(sensorData.getLastReading()))
app.get('/initialized', (req, res) => res.send({initialized}))
app.listen(config.statusPort.port, () => console.log(`MyceliumJS listening on port ${config.statusPort}!`))


// TODO move to own file
// const initBoard = () => {
//   let board = new five.Board({
//     repl: false,
//     debug: false,
//   });

//   board.on("ready", function() {
//     initialized.board = true;
//     logger.info('Board Ready')
//     initLoops()

//     var sensor = new five.Multi({
//       controller: "HTU21D"
//     });

//     sensor.on("change", function() {
//       initialized.sensor = true;
//       sensorData.setData({
//         relativeHumidityOne: this.hygrometer.relativeHumidity,
//         tempatureCelsiusOne: this.thermometer.celsius
//       })
//     })
//   });
// }



  const initLoops = () => {
    loops.heatLoop.init();
    loops.humidityLoop.init();
    loops.statusLoop.startLoop();
  }

  //then(()=> outlets.startLoop())

  //scheduler.init()
  //initBoard();
  //loops.sendDataLoop.init()


const init = async () => {

    // TODOD get config then pass in to other constructors

    try {
      logger.info('Intializing arduino board...')
      await board.init(); // returns promise when get first sensor data back

      logger.info('Intializing outlets...')
      await outlets.init()

    } catch (ex) {
      logger.error('Unable to intialize', ex)
    }

    logger.info('Intializing schedules...')
    scheduler.init()

    logger.info('Intializing data sender...')
    loops.sendDataLoop.init()

    logger.info('Intializing loops...')
    initLoops();

    initialized = true;
    logger.info('Initialization complete')


    // while(!initialized.board && !initialized.sensor && !intialized.outlets) {
      // console.log('inputs and out puts inited')

      //init all loops

      //start outlet self repair loop


      // init send data loop

    // }
  }
  //setInterval(sendDataLoop, config.myceliumApiUpdateSeconds);


init().catch(()=> {})