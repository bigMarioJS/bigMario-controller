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

    this.init = this.init.bind(this);

    this.ctr = new Controller({
      k_p: 0.25,
      k_i: 0.05,
      k_d: 0.05,
    });

    this.ctr.setTarget(growProfile.relativeHumidity.target);
  }

  async init() {
    let cycleTime;
    while (true) {
      let output = parseFloat(this.sensorData.getHumidity());
      console.log('hum lop', output)
      if (!isNaN(this.sensorData.getHumidity())) {

        let input = this.ctr.update(output);
        cycleTime = Math.abs(parseInt(input) * 1000) + 5000;
          console.log('hum input', input)
        if (input > 0) {
          logger.info(`Humidity too low. Cycle Humidifer ON cycle for ${cycleTime / 1000} seconds`);
          await this.outlets.turn(outletNames.humidifier, true)
          await this.outlets.turn(outletNames.humidifierFan, true)
        }

        if (input < 0) {
          logger.info(`Humidity too high. Cycle Humidity Fan ON for ${cycleTime / 1000} seconds`);
          await this.outlets.turn(outletNames.humidifier, false)
          await this.outlets.turn(outletNames.humidifierFan, true)
        }
      }

      await timeout(cycleTime || 5000)
      await this.outlets.turn(outletNames.humidifier, false)
      await this.outlets.turn(outletNames.humidifierFan, false)
      await timeout(120000)
    }
  }
}