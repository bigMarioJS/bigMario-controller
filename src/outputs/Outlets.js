import TuyaDevice from 'tuyapi';
import { outletNames } from '../const';
import Logger from '../utils/Logger'



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

    this.config = config;
    this.state = this.initState;
    this.reverseOutletMap = this.makeReverseOutLetMap();
    this.checkForBadStates = this.checkForBadStates.bind(this);
    this.initSelfRepairLoop = this.initSelfRepairLoop.bind(this);
    this.getStatus = this.getStatus.bind(this);
    this.init = this.init.bind(this);
  }

  async init () {

    try {
      this.tuya = await this.initOutlets()
    } catch (ex) {
      logger.error('BAD Tuya configuration', ex)
      return false;
    }

    try {
      await this.tuya.set({set: 0, dps: this.outletMap[outletNames.all]})
    } catch (ex) {
      logger.error('Unable to set all outlets to OFF', ex)
      return false;
    }

    try {
      this.state = await this.updateState()
    } catch (ex) {
      logger.error('Cannot update initial state', ex)
      return false;
    }

    this.initSelfRepairLoop();

    return true;

  }

  async initOutlets () {
    return new TuyaDevice({
      id: this.config.tuyaLocalId,
      key: this.config.tuyaLocalKey,
      ip: this.config.tuyaLocalIpAddress
    });
  }

 async initSelfRepairLoop () {
   while (true) {
    let badStates = await this.checkForBadStates()
      for (let key in badStates ) {
        logger.warn(`Bad outlet state found. Expected ${key} to be ${badStates[key] ? 'ON' : 'OFF'}`)
        try {
          await this.turn(key, badStates[key], true)
          await timeout(50000)
        } catch (ex) {
          logger.error(`Unable to recover ${key} from bad state`)
        }
    }
    await timeout(10000)
  }
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
    let newState = Object.assign({}, this.initState);

    try {
      let status = await this.tuya.get({schema: true});

      Object.keys(status.dps).forEach(dps => {
        if (this.reverseOutletMap[dps]) {
          newState[this.reverseOutletMap[dps]].state = status.dps[dps];
          newState[this.reverseOutletMap[dps]].requestingChange = false;
        }
      })
      logger.silly(`New state: ${JSON.stringify(newState)}`)
    } catch (ex) {
      logger.error('Unable to get states from Tuya', ex)
    }
    return newState;
  }

  async checkForBadStates () {
    let status = await this.tuya.get({schema: true});

    let results = {};

    Object.keys(status.dps).forEach(dps => {
      if (this.reverseOutletMap[dps]) {
        if (this.state[this.reverseOutletMap[dps]].state != status.dps[dps]) {
          results[this.reverseOutletMap[dps]] = this.state[this.reverseOutletMap[dps]].state
        }
      }
    })
    return results;
  }

  async allOff () {
    let results;
    logger.info(`Turning ALL outlets OFF`)
    try {
      results = await this.tuya.set({set: 0, dps: this.outletMap[outletNames.all]})
    } catch (ex) {
      logger.error('Unable to turn all devices off', ex)
    }
    return results;
  }

  async turn (id, state, override) {
    let tries = 1;

    if ((this.state[id].state !== state && !this.state[id].requestingChange) || override) {

      logger.info(`${override ? 'Self Repair: ' : ''}Turning ${id} ${state ? 'ON' : 'OFF'}`)
      this.state[id].requestingChange = true;

      let response = await this.toggleOutlet(id, state);

      while (response !== true && tries < 6) {
        logger.warn(`Previous attempt (${tries}) to turn ${id} ${state ? 'ON' : 'OFF'} failed. Will retry.`)
        await timeout(5000);
        response = await this.toggleOutlet(id, state);
        tries++
      }

      if (tries > 5) {
        logger.ERROR(`Previous ${tries} attempts to turn ${id} ${state ? 'ON' : 'OFF'} failed.`)
      }

      if (response === true) {
        this.state[id].state = state;
        this.state[id].requestingChange = false;
        logger.info(`Turning ${id} ${state ? 'ON' : 'OFF'} was a success`)
      }

      // this.updateState();

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