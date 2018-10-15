export default class SensorData {
  constructor() {
    this.sensorData = {};
    this.lastReading = {};
  }

  getData () {
    return this.sensorData;
  }

  setData (data) {
    this.lastReading = this.sensorData;
    this.sensorData = data;
    this.sensorData.recordedAt = new Date();
  }

  getLastReading () {
    return this.lastReading;
  }

  getTemp () {
    return this.lastReading.tempatureCelsiusOne;
  }

  clearData () {
    this.sensorData = {};
  }
}