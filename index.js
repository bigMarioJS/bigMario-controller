
var five = require("johnny-five");
var board = new five.Board();
const axios = require('axios');

const apiUri = 'http://10.0.1.14:3000/api/datahook'

let initialized;
let sensorData = {}

board.on("ready", function() {
 initialized = true

  const thermometer = new five.Thermometer({
    controller: "DS18B20",
    pin: 2
  });

  thermometer.on("change", function() {
    sensorData.temp = this.celsius
  });
});


function sendData () {
   // if (initialized) {
        console.log(sensorData)
        axios.post(apiUri, sensorData)
        .then((res)=> {
        })
        .catch(console.log)
    //} else {
   //     console.log('initializing')
   // }
}



setInterval(sendData, 1500);

