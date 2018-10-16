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

    this.init = this.init.bind(this);

    this.ctr = new Controller({
      k_p: 0.25,
      k_i: 0.05,
      k_d: 0.05
    });

    this.ctr.setTarget(growProfile.temp);
  }

  async init() {
    let cycleTime;
    while (true) {
      let output = parseFloat(this.sensorData.getTemp());
      if (!isNaN(this.sensorData.getTemp())) {
        let input = this.ctr.update(output);
        cycleTime = Math.abs(parseInt(input) * 1000) + 20000;
        if (input > 0) {
          logger.info(`Cycle heat ON cycle for ${cycleTime / 1000} seconds`);
          await this.outlets.turn(outletNames.heater, true)
        } else {
          logger.info(`Cycle heat OFF for ${cycleTime / 1000} seconds`);
          await this.outlets.turn(outletNames.heater, false)
        }
      }
      await timeout(cycleTime || 20000)
    }
  }
}