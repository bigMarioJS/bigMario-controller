import "@babel/polyfill";

import five from 'johnny-five';
import axios from 'axios';
import express from 'express';

import config from './utils/config';

import Logger from './utils/Logger';
import growProfile from './growProfile'

import SensorData from './inputs/sensorData';
import Outlets from './outputs/Outlets';

import HeatLoop from './loops/HeatLoop';
import StatusLoop from '.loops/StatusLoop';
import HumidityLoop from './loops/HumidityLoop'
import SendDataLoop from './loops/SendDataLoop';

import Scheduler from './loops/Scheduler'

const logger = new Logger();

let initialized = false;

let sensorData = new SensorData()     ;
let outlets = new Outlets(config)

//clean up
outlets.init().then(()=> outlets.allOff()).then(()=> outlets.startLoop())

// Clean up
// outlets.allOff().then().catch()


const heatLoop = new HeatLoop(sensorData, growProfile, outlets);
const humidityLoop = new HumidityLoop(sensorData, growProfile, outlets);
const sendDataLoop = new SendDataLoop(sensorData, growProfile, outlets, initialized);

let loops = {
  heatLoop,
  humidityLoop,
  sendDataLoop,
}

loops.statusLoop = new StatusLoop(sensorData, growProfile, outlets, loops)
let scheduler = new Scheduler(growProfile, outlets);


logger.info("Starting app")

const app = express();
app.get('/sensorData', (req, res) => res.send(sensorData.getLastReading()))
app.get('/initialized', (req, res) => res.send({initialized}))
app.listen(config.statusPort.port, () => console.log(`MyceliumJS listening on port ${config.statusPort}!`))


// TODO move to own file
const initBoard = () => {
  let board = new five.Board({
    repl: false,
    debug: false,
  });

  board.on("ready", function() {
    initialized = true;
    logger.info('Board Ready')
    initLoops()

    var sensor = new five.Multi({
      controller: "HTU21D"
    });

    sensor.on("change", function() {
      sensorData.setData({
        relativeHumidityOne: this.hygrometer.relativeHumidity,
        tempatureCelsiusOne: this.thermometer.celsius
      })
    })
  });
}

  const initLoops = () => {
    loops.heatLoop.init();
    loops.humidityLoop.init();
    loops.statusLoop.startLoop();
  }

  scheduler.init()
  initBoard();
  loops.sendDataLoop.init()
  //setInterval(sendDataLoop, config.myceliumApiUpdateSeconds);


