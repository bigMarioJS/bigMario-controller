import "@babel/polyfill";

import five from 'johnny-five';
import axios from 'axios';
import config from './config';
import SensorData from './sensorData';
import express from 'express';
import WifiOutLets from './WifiOutLets';
import { outletNames } from './const';
import Logger from './Logger'

const logger = new Logger();

logger.info("Starting app")
const app = express();

let initialized = false;
let sensorData = new SensorData();

let outlets = new WifiOutLets(config)
outlets.allOff().then().catch()

const growProfile = {
  relativeHumidity: {
    high: 90,
    low: 80
  },
  freshAirExchange: {
    runTimeSeconds: 60,
    times: [
      '0 0 * * *',
      '0 8 * * *',
      '0 16 * * *'
    ]
  },
  temp: 23
}

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
    sensorData.data,
    {outletStatus: outlets.status},
    {initialized},
    {environmentId: config.growEnvironmentId}
  )

  logger.info(`Sending Data: ${JSON.stringify(data)}`)

  axios.post(config.myceliumApiUri, data, {headers: { 'x-api-key': config.myceliumApiSecret}})
    .catch((error) => console.log("Error contacting endpoint"))
    .finally(()=>{
     sensorData.clearData();
    });
  }

  const humditiyLoop = async () => {
    let humditiy = sensorData.data.relativeHumidityOne

    if (humditiy < growProfile.relativeHumidity.low) {
      logger.info(`Humidity at ${humditiy} below threashold of ${growProfile.relativeHumidity.low}`);
      let humidifierStatus = await outlets.turn(outletNames.humidifier, true);
      let humidifierFanStatus = await outlets.turn(outletNames.humidifierFan, true);
    }

    if (humditiy > growProfile.relativeHumidity.high) {
      logger.info(`Humidity at ${humditiy} above threashold of ${growProfile.relativeHumidity.high}`);
      let humidifierStatus = await outlets.turn(outletNames.humidifier, false);
      let humidifierFanStatus = await outlets.turn(outletNames.humidifierFan, false);
    }
  }

  initBoard();
  setInterval(sendDataLoop, config.myceliumApiUpdateSeconds)
  setInterval(humditiyLoop, config.myceliumHumidityUpdateSeconds)

