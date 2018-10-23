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
import SendDataLoop from "./SendDataLoop";

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


logger.info("Starting app")

const app = express();
app.get('/sensorData', (req, res) => res.send(sensorData.getLastReading()))
app.get('/initialized', (req, res) => res.send({initialized}))
app.listen(config.statusPort.port, () => console.log(`MyceliumJS listening on port ${config.statusPort}!`))



const initBoard = () => {
  let board = new five.Board({
    repl: false,
    debug: false,
  });

  board.on("ready", function() {
    initialized = true;

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

// const sendDataLoop = () => {

//   let data = Object.assign(
//     {},
//     {...sensorData.getData()},
//     {outletStatus: outlets.getStatus()},
//     {initialized},
//     {environmentId: config.growEnvironmentId}
//   )

//   //logger.silly(`Sending Data: ${JSON.stringify(data, null, 2)}`)

//   axios.post(config.myceliumApiUri, data, {headers: { 'x-api-key': config.myceliumApiSecret}})
//     .catch((error) => console.log("Error contacting endpoint", error))
//     .finally(()=>{
//      sensorData.clearData();
//     });
//   }

  const initLoops = () => {
    loops.heatLoop.init();
    loops.humidityLoop.init();
    loops.statusLoop.startLoop();
  }


  initBoard();
  loops.sendDataLoop.init()
  //setInterval(sendDataLoop, config.myceliumApiUpdateSeconds);


