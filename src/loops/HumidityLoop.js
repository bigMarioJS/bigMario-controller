import Controller from 'node-pid-controller';
import { outletNames } from '../const';
import Logger from '../utils/Logger';

const logger = new Logger();

const timeout = ms => new Promise(res => setTimeout(res, ms))

export default class HumdityLoop {
  constructor(sensorData, growProfile, outlets) {
    this.sensorData = sensorData;
    this.growProfile = growProfile;
    this.outlets = outlets;

    this.init = this.init.bind(this);

    this.getTimeLeftOnCycleInSeconds = this.getTimeLeftOnCycleInSeconds.bind(this);
    this.getCycleTime = this.getCycleTime.bind(this);
    this.setCycleTime = this.setCycleTime.bind(this);


    this.ctr = new Controller({
      k_p: 0.50,
      k_i: 0.10,
      k_d: 0.01,
    });

    this.ctr.setTarget(this.growProfile.relativeHumidity.target);
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
      let temp = parseFloat(this.sensorData.getHumidity());

      if (!isNaN(this.sensorData.getHumidity())) {
        let pidInput = this.ctr.update(temp);

        let inputTime = Math.abs(parseInt(pidInput) * 20000);


        if (pidInput > 0) {
          let waitBetweenCalls = 5000;

          this.setCycleTime(inputTime + waitBetweenCalls + waitBetweenCalls);

          logger.info(`Humidity ${temp} too low. Cycle Humidifer ON for ${this.getCycleTimeInSeconds()}`);

          await this.outlets.turn(outletNames.humidifierFan, true);
          await timeout(waitBetweenCalls);
          await this.outlets.turn(outletNames.humidifier, true);
          await timeout(inputTime);
          await this.outlets.turn(outletNames.humidifier, false);
          await timeout(waitBetweenCalls);
          await this.outlets.turn(outletNames.humidifierFan, false);

          this.setCycleTime(60000);
          logger.info(`Humidity cycle hold for ${this.getCycleTimeInSeconds()} seconds`);
          await timeout(this.getCycleTime());
        }

        if (pidInput <= 0 && !this.growProfile.useFanToLower) {
          this.setCycleTime(120000);
          logger.info(`Humidity too high, hold for ${this.getCycleTimeInSeconds()} seconds`);
          await timeout(this.getCycleTime());
        }

        if (pidInput < 0 && this.growProfile.useFanToLower) {
          this.setCycleTime(120000);
          logger.info(`Humidity too high. Cycle Humidity Fan ON for ${this.getCycleTimeInSeconds()} seconds`);
          await this.outlets.turn(outletNames.humidifier, false)
          await this.outlets.turn(outletNames.humidifierFan, true)
          await timeout(this.getCycleTime());

          this.setCycleTime(60000);
          logger.info(`Humidity cycle hold for ${this.getCycleTimeInSeconds()} seconds`);
          await timeout(this.getCycleTime());
        }
      } else {
        await timeout(10000)
      }
    }
  }
}