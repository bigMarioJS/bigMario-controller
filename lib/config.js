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