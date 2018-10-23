import Controller from 'node-pid-controller';
import { outletNames } from './const';
import Logger from './Logger';

const logger = new Logger();
const timeout = ms => new Promise(res => setTimeout(res, ms))

export default class HeatLoop {
  constructor(sensorData, growProfile, outlets) {
    this.sensorData = sensorData;
    this.growProfile = growProfile;
    this.outlets = outlets;
    this.cycleTime;

    this.init = this.init.bind(this);

    this.getTimeLeftOnCycleInSeconds = this.getTimeLeftOnCycleInSeconds.bind(this);
    this.getCycleTime = this.getCycleTime.bind(this);
    this.setCycleTime = this.setCycleTime.bind(this);

    this.ctr = new Controller({
      k_p: 0.25,
      k_i: 0.05,
      k_d: 0.05
    });

    this.ctr.setTarget(growProfile.temp);
  }

  setCycleTime(time) {
    this.cycleTime = time;
    this.cycleTimeSetAt = new Date().getTime();
  }

  getCycleTime() {
    return this.cycleTime;
  }

  getCycleTimeInSeconds () {
    return parseInt(this.cycleTime / 1000)
  }

  getTimeLeftOnCycleInSeconds() {
    let diff = new Date().getTime() - this.cycleTimeSetAt;
    return parseInt((this.cycleTime - diff) / 1000)
  }

  async init() {
    while (true) {
      let output = parseFloat(this.sensorData.getTemp());
      if (!isNaN(this.sensorData.getTemp())) {
        let input = this.ctr.update(output);
        this.setCycleTime(Math.abs(parseInt(input) * 1000) + 120000);
        if (input > 0) {
          logger.info(`Cycle heat ON cycle for ${this.getCycleTimeInSeconds()} seconds`);
          await this.outlets.turn(outletNames.heater, true)
        } else {
          logger.info(`Cycle heat OFF for ${this.getCycleTimeInSeconds()} seconds`);
          await this.outlets.turn(outletNames.heater, false)
        }
      }
      await timeout(this.getCycleTime() || 10000)

    }
  }
}