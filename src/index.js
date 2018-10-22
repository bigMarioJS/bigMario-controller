import "@babel/polyfill";

import five from 'johnny-five';
import axios from 'axios';
import config from './config';
import SensorData from './sensorData';
import express from 'express';
import WifiOutLets from './WifiOutLets';
import { outletNames } from './const';
import Logger from './Logger';
import growProfile from './growProfile'
import HeatLoop from './heatLoop';
import StatusLoop from './StatusLoop';
import HumidityLoop from './HumidityLoop'
import Scheduler from './Scheduler'

const logger = new Logger();


let initialized = false;
let sensorData = new SensorData();

let outlets = new WifiOutLets(config)
outlets.allOff().then().catch()


const heatLoop = new HeatLoop(sensorData, growProfile, outlets);
const statusLoop = new StatusLoop(sensorData, growProfile, outlets);
const humidityLoop = new HumidityLoop(sensorData, growProfile, outlets);


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

const sendDataLoop = () => {

  let data = Object.assign(
    {},
    {...sensorData.getData()},
    {outletStatus: outlets.getStatus()},
    {initialized},
    {environmentId: config.growEnvironmentId}
  )

  logger.info(`Sending Data: ${JSON.stringify(data, null, 2)}`)

  axios.post(config.myceliumApiUri, data, {headers: { 'x-api-key': config.myceliumApiSecret}})
    .catch((error) => console.log("Error contacting endpoint", error))
    .finally(()=>{
     sensorData.clearData();
    });
  }

  const initLoops = () => {
    heatLoop.init();
    statusLoop.startLoop();
    humidityLoop.init();
  }


  initBoard();
  setInterval(sendDataLoop, config.myceliumApiUpdateSeconds);


