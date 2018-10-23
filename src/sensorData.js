export default class SensorData {
  constructor() {
    this.sensorData = {};
    this.lastReading = {};
    this.getData = this.getData.bind(this);
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

  getHumidity () {
    return this.lastReading.relativeHumidityOne;
  }

  clearData () {
    this.sensorData = {};
  }
}