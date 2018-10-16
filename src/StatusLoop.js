import Table from 'cli-table';
import { outletNames } from './const';
import Logger from './Logger';

const logger = new Logger();
const timeout = ms => new Promise(res => setTimeout(res, ms))

export default class HeatLoop {
  constructor(sensorData, growProfile, outlets) {
    this.sensorData = sensorData;
    this.growProfile = growProfile;
    this.outlets = outlets;

    this.buildChart = this.buildChart.bind(this)
    this.outletStatus = this.outletStatus.bind(this)
  }

  outletStatus(outlet) {
    let outlets = this.outlets.getStatus();
    return outlets[outlet] ? 'ON' : 'OFF';
  }

  buildChart() {
    const table = new Table({
      head: ['Element', 'Reading', 'Target', 'Outlet'],
      colWidths: [20, 10, 10, 20]
    });

    let outletStatus = this.outlets.getStatus();

    table.push([
      'Temp',
      `${this.sensorData.getTemp()}`,
      this.growProfile.temp,
      `${this.outletStatus(outletNames.heater)}`,
    ])


    table.push([
      'Humidity',
      `${this.sensorData.getHumidity()}`,
      `${this.growProfile.relativeHumidity.target}`,
      `H ${this.outletStatus(outletNames.humidifier)} F ${this.outletStatus(outletNames.humidifierFan)}`
    ])

    table.push([
      'Air',
      '',
      '',
      `${this.outletStatus(outletNames.exhaustFan)}`,
    ])
   logger.info(`Current Status:\n${table.toString()}`);
    //console.log(table.toString())
  }

  async startLoop() {
    while (true) {
      this.buildChart()
      await timeout(25000)
    }
  }
}