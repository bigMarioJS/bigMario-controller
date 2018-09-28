export default class SensorData {
  constructor() {
    this.data = {};
    this.lastReading = {};
  }

  getData () {
    return this.data;
  }

  setData (data) {
    this.lastReading = this.data;
    this.data = data;
  }

  getLastReading () {
    return this.lastReading;
  }

  clearData () {
    this.data = {};
  }
}