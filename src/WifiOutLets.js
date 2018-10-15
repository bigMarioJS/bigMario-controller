import TuyaDevice from 'tuyapi';
import { outletNames } from './const';
import Logger from './Logger'

const logger = new Logger();

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

    try {
      this.tuya = new TuyaDevice({
        id: config.tuyaLocalId,
        key: config.tuyaLocalKey,
        ip: config.tuyaLocalIpAddress
      });
    } catch (e) {
      console.log('BAD Tuya configuration', e)
    }

    this.updateState();
  }

  get status() {
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
      logger.info(`Updated state: ${JSON.stringify(newState)}`)
      this.state = newState;
    } catch (e) {
      logger.error()
    }
  }

  async allOff () {
    let results;
    logger.info(`Turning ALL OFF`)
    try {
      results = this.tuya.set({set: 0, dps: this.outletMap[outletNames.all]})
    } catch (e) {
      console.log('cant update device', e)
    }
    return results;
  }

  async turn (id, state) {
    let results;

    if (this.state[id].state !== state && !this.state[id].requestingChange) {
      logger.info(`Turning ${id} ${state ? 'ON' : 'OFF'}`)

      try {
        results = this.tuya.set({set: state, dps: this.outletMap[id]})
        this.state[id].requestingChange = true;
        this.state[id].state = state;
      } catch (e) {
        console.log('cant update device', e)
      }
      this.updateState();
      return results;
    }
  }

}