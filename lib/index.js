"use strict";

var _johnnyFive = _interopRequireDefault(require("johnny-five"));

var _axios = _interopRequireDefault(require("axios"));

var _config = _interopRequireDefault(require("./config"));

var _sensorData = _interopRequireDefault(require("./sensorData"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialized = false;
var sensorData = new _sensorData.default();

var initBoard = function initBoard() {
  var board = new _johnnyFive.default.Board();
  board.on("ready", function () {
    initialized = true;
    var sensor = new _johnnyFive.default.Multi({
      controller: "HTU21D"
    });
    sensor.on("change", function () {
      sensorData.setData({
        relativeHumidityOne: this.hygrometer.relativeHumidity,
        tempatureCelsiusOne: this.thermometer.celsius
      });
    });
  });
};

var sendData = function sendData() {
  var data = Object.assign({}, sensorData.getData(), {
    initialized: initialized
  }, {
    environmentId: _config.default.environmentId
  });
  console.log(data);

  _axios.default.post(_config.default.uri, data, {
    headers: {
      'x-api-key': _config.default.apiKey
    }
  }).catch(function (error) {
    return console.log("Error contacting endpoint");
  }).finally(function () {
    sensorData.clearData();
  });
};

var loop = function loop() {
  sendData();
  setTimeout(loop, _config.default.updateSeconds);
};

initBoard();
loop();