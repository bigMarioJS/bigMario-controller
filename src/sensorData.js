export default class SensorData {
  constructor() {
    this.sensorData = {};
    this.lastReading = {};
  }

  get data () {
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

  clearData () {
    this.sensorData = {};
  }
}