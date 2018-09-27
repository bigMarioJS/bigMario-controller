import five from 'johnny-five';
import axios from 'axios';
import config from './config';
import SensorData from './sensorData';

let initialized = false;
let sensorData = new SensorData();

const initBoard = () => {
  let board = new five.Board();

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

const sendData = () => {
  let data = Object.assign(
    {},
    sensorData.getData(),
    {initialized},
    {environmentId: config.environmentId}
  )

  console.log(data)

  axios.post(config.uri, data, {headers: { 'x-api-key': config.apiKey}})
    .catch((error) => console.log("Error contacting endpoint"))
    .finally(()=>{
     sensorData.clearData();
    });
  }

const loop = () => {
  sendData();
  setTimeout(loop, config.updateSeconds);
}

initBoard();
loop();
