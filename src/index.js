import "@babel/polyfill";

import five from 'johnny-five';
import axios from 'axios';
import express from 'express';

import config from './config';

import Logger from './Logger';
import growProfile from './growProfile'

import SensorData from './sensorData';
import WifiOutLets from './WifiOutLets';

import HeatLoop from './HeatLoop';
import StatusLoop from './StatusLoop';
import HumidityLoop from './HumidityLoop'
import SendDataLoop from './SendDataLoop';
import Scheduler from './Scheduler'

const logger = new Logger();

let initialized = false;

let sensorData = new SensorData();
let outlets = new WifiOutLets(config)

outlets.allOff().then().catch()

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

  console.log(board)

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
    console.log('initing loops')
    loops.heatLoop.init();
    loops.humidityLoop.init();
    loops.statusLoop.startLoop();

  }

  scheduler.init()
  initBoard();
  loops.sendDataLoop.init()
  //setInterval(sendDataLoop, config.myceliumApiUpdateSeconds);


