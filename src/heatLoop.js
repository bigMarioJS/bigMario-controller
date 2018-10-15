
import Controller from 'node-pid-controller';
import { outletNames } from './const';
import Logger from './Logger';

const logger = new Logger();



export default class HeatLoop {
  constructor (sensorData, growProfile, outlets) {
    this.sensorData = sensorData;
    this.growProfile = growProfile;
    this.outlets = outlets;
    this.heatingInProgress = false;

    this.setHeatingInProgress = this.setHeatingInProgress.bind(this)
    this.turnHeaterOff = this.turnHeaterOff.bind(this)

    this.doLoop = this.doLoop.bind(this)

    this.ctr = new Controller({
      k_p: 0.25,
      k_i: 0.05,
      k_d: 0.05,
    });

    this.ctr.setTarget(growProfile.temp);

  }

  setHeatingInProgress (value) {
    console.log('setting heading in progress', value)
    this.heatingInProgress = value;
  }

  doLoop () {
    let output = this.sensorData.getTemp();
    logger.info(`Heat at ${output}, Target is ${this.growProfile.temp}`);
    console.log('this.heatingInProgress', this.heatingInProgress)

    if ( !this.heatingInProgress ) {
      let input = this.ctr.update(output);
      console.log('output:', output)
      console.log('input', input)
      this.heatForXSeconds(input);
    }
  }

  heatForXSeconds (seconds) {
    seconds = parseInt(seconds)
    if (seconds > 0) {
      this.setHeatingInProgress(true)
      let time = seconds * 1000;

      console.log('going to heat for', time)
      this.outlets.turn(outletNames.heater, true)
      setTimeout(this.turnHeaterOff, time)

      // setTimeout(() => {this.outlets.turn(outletNames.heater, false)}, time)
      // setTimeout(() => {this.setHeatingInProgress(false)}, time)
    }
  }

  turnHeaterOff () {
    console.log('heater turn off called -------->')
    this.outlets.turn(outletNames.heater, false);
    this.setHeatingInProgress(false)
  }

};


