import Controller from 'node-pid-controller';
import { outletNames } from '../const'
import Logger from '../utils/Logger';
import * as utils from '../utils/utils.js'

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


    // https://www.machinedesign.com/sensors/introduction-pid-control
    this.ctr = new Controller({
      k_p: 0.05,
      k_i: 0.1,
      k_d: 0.0
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
    let cyclesWithNoResults = 0;

    while (true) {
      let expect;
      let temp = parseFloat(this.sensorData.getTemp());
      if (!isNaN(temp)) {
        let input = this.ctr.update(temp);
        logger.info(`PID input is ${input}`);
        this.setCycleTime(Math.abs(parseInt(input) * 1000) + 120000);

        if (input > 0) {
          logger.info(`Cycle heat ON cycle for ${this.getCycleTimeInSeconds()} seconds`);
          await this.outlets.turn(outletNames.heater, true)
          expect = 'GREATER';
        } else {
          logger.info(`Cycle heat OFF for ${this.getCycleTimeInSeconds()} seconds`);
          await this.outlets.turn(outletNames.heater, false)
          expect = 'LESS';
        }

        if (utils.checkResults(this.sensorData.getTemp(), expect, temp)) {
          logger.warn(`Last Heat cycle for ${this.getCycleTimeInSeconds()} seconds did not produce results`);
          cyclesWithNoResults++;
        } else {
          cyclesWithNoResults = 0;
        }

        if (cyclesWithNoResults > 3) {
          logger.error(`Last ${cyclesWithNoResults} heat cycles did not produce results`)
          utils.exitApp('Too heat many cycles without results')
        }

      }
      await timeout(this.getCycleTime() || 10000)
    }
  }
}