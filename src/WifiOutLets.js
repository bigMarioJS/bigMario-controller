import TuyaDevice from 'tuyapi';
import { outletNames } from './const';
import Logger from './Logger'

const logger = new Logger();
const timeout = ms => new Promise(res => setTimeout(res, ms))

export default class WifiOutLets {
  constructor (config) {

    // TODO: move to config
    this.outletMap = {
      [outletNames.humidifier]: 2,
      [outletNames.exhaustFan]: 1,
      [outletNames.humidifierFan]: 3,
      [outletNames.heater]: 4,
      [outletNames.all]: 6
    }

    this.initState = {
      [outletNames.humidifier]: {},
      [outletNames.exhaustFan]: {},
      [outletNames.humidifierFan]: {},
      [outletNames.heater]: {},
      [outletNames.all]: {}
    };

    this.state = this.initState;
    this.reverseOutletMap = this.makeReverseOutLetMap();

    this.getStatus = this.getStatus.bind(this);
    // this.checkState = this.checkState.bind(this)

    try {
      this.tuya = new TuyaDevice({
        id: config.tuyaLocalId,
        key: config.tuyaLocalKey,
        ip: config.tuyaLocalIpAddress
      });
    } catch (ex) {
      logger.error('BAD Tuya configuration', ex)
    }

    this.updateState();
  }

  getStatus() {
    let results = {};
    Object.keys(this.state).forEach(key => {
      results[key] = this.state[key].state
    })
    return results;
  }

  makeReverseOutLetMap () {
    let map = {};
    Object.keys(this.outletMap).map(key => {
      map[this.outletMap[key]] = key;
    });
    return map;
  }

  async updateState () {
    let newState = this.initState;

    let status = await this.tuya.get({schema: true});

    try {
      Object.keys(status.dps).forEach(dps => {
        if (this.reverseOutletMap[dps]) {
          newState[this.reverseOutletMap[dps]].state = status.dps[dps];
          newState[this.reverseOutletMap[dps]].requestingChange = false;
        }
      })
      logger.silly(`Updated state: ${JSON.stringify(newState)}`)
      this.state = newState;
    } catch (ex) {
      logger.error('Unable to update outlet status', ex)
    }
  }

  // async checkState () {
  //   let status = await this.tuya.get({schema: true});
  //   let misMatches = []

  //   Object.keys(status.dps).forEach(dps => {
  //     if (this.reverseOutletMap[dps]) {
  //       if (this.state[this.reverseOutletMap[dps]].state != status.dps[dps]) {
  //         console.log('mismatch expect',this.reverseOutletMap[dps],  this.reverseOutletMap[dps].state, status.dps[dps])
  //       }
  //     }
  //   })
  // }

  async allOff () {
    let results;
    logger.info(`Turning ALL OFF`)
    try {
      results = await this.tuya.set({set: 0, dps: this.outletMap[outletNames.all]})
    } catch (ex) {
      logger.error('Unable to turn all devices off', ex)
    }
    return results;
  }

  async turn (id, state) {
    let tries = 1;

    if (this.state[id].state !== state && !this.state[id].requestingChange) {

      logger.info(`Turning ${id} ${state ? 'ON' : 'OFF'}`)
      this.state[id].requestingChange = true;

      let response = await this.toggleOutlet(id, state);
      console.log('response',response)

      while (response != true && tries < 5) {
        logger.warn(`Previous attempt (${tries}) to turn ${id} ${state ? 'ON' : 'OFF'} failed. Will retry.`)
        await timeout(7000);
        response = await this.toggleOutlet(id, state);
        tries++
      }

      if (tries > 5) {
        logger.ERROR(`Previous ${tries} attempts to turn ${id} ${state ? 'ON' : 'OFF'} failed.`)
        //TODO Alert
      }

      if (response === true) {
        this.state[id].state = state;
        this.state[id].requestingChange = false;
      }

      this.updateState();

      return response;
    }
  }

  async toggleOutlet (id, state) {
    try {
      let response = await this.tuya.set({set: state, dps: this.outletMap[id]});
      return response;
    } catch (ex) {
      logger.error(`Unable to turn ${id} ${state ? 'ON' : 'OFF'}`, ex)
      return !state;
    }
  }

}