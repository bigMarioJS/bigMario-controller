import Controller from 'node-pid-controller';
import { outletNames } from './const';
import Logger from './Logger';

const logger = new Logger();

const timeout = ms => new Promise(res => setTimeout(res, ms))

export default class HumdityLoop {
  constructor(sensorData, growProfile, outlets) {
    this.sensorData = sensorData;
    this.growProfile = growProfile;
    this.outlets = outlets;
    this.cycleTime = '';
    this.cycleTimeSetAt = '';

    this.init = this.init.bind(this);

    this.getTimeLeftOnCycleInSeconds = this.getTimeLeftOnCycleInSeconds.bind(this);
    this.getCycleTime = this.getCycleTime.bind(this);
    this.setCycleTime = this.setCycleTime.bind(this);

    this.ctr = new Controller({
      k_p: 0.25,
      k_i: 0.05,
      k_d: 0.05,
    });

    this.ctr.setTarget(growProfile.relativeHumidity.target);
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
      let output = parseFloat(this.sensorData.getHumidity());

      if (!isNaN(this.sensorData.getHumidity())) {
        let input = this.ctr.update(output);
        this.setCycleTime(Math.abs(parseInt(input) * 1000));

        if (input > 0) {
          logger.info(`Humidity ${output} too low. Cycle Humidifer ON cycle for ${this.getCycleTimeInSeconds()} seconds`);
          await this.outlets.turn(outletNames.humidifierFan, true)
          // await timeout(60000) // atempt to reduce water in pipes
          await this.outlets.turn(outletNames.humidifier, true)
        }

        if (input < 0 && growProfile.useFanToLower) {
          logger.info(`Humidity too high. Cycle Humidity Fan ON for ${this.getCycleTimeInSeconds()} seconds`);
          await this.outlets.turn(outletNames.humidifier, false)
          await this.outlets.turn(outletNames.humidifierFan, true)
        }
      }

      await timeout(this.getCycleTime()|| 5000)
      await this.outlets.turn(outletNames.humidifier, false)
      await this.outlets.turn(outletNames.humidifierFan, false)
      await timeout(1200000)
    }
  }
}