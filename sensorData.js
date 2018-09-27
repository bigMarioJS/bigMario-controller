export default class SensorData {
  constructor() {
    this.data = {};
  }

  getData () {
    return this.data;
  }

  setData (data) {
    this.data = data;
  }

  clearData () {
    this.data = {};
  }
}