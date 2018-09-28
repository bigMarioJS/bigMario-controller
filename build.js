"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  updateSeconds: (process.env.UPDATE_SECONDS ? process.env.UPDATE_SECONDS : 60) * 1000,
  uri: process.env.URI || 'http://localhost:3000/v1/sensorData',
  apiKey: process.env.API_KEY || '123',
  environmentId: process.env.ENVIRONMENT_ID || 'dev'
};
exports.default = _default;
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
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var SensorData =
/*#__PURE__*/
function () {
  function SensorData() {
    _classCallCheck(this, SensorData);

    this.data = {};
  }

  _createClass(SensorData, [{
    key: "getData",
    value: function getData() {
      return this.data;
    }
  }, {
    key: "setData",
    value: function setData(data) {
      this.data = data;
    }
  }, {
    key: "clearData",
    value: function clearData() {
      this.data = {};
    }
  }]);

  return SensorData;
}();

exports.default = SensorData;
