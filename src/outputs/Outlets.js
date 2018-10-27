import TuyaDevice from 'tuyapi';
import {
  outletNames
} from '../const';
import Logger from '../utils/Logger'



const logger = new Logger();
const timeout = ms => new Promise(res => setTimeout(res, ms))

export default class WifiOutLets {
  constructor(config) {

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
    this.getOutletNameByDps = this.getOutletNameByDps.bind(this);
    this.getOutletByDps = this.getOutletByDps.bind(this);
    this.updateState = this.updateState.bind(this)
  }

  async init() {

    try {
      this.tuya = await this.initOutlets()
    } catch (ex) {
      logger.error('BAD Tuya configuration', ex)
      return false;
    }

    try {
      await this.tuya.set({
        set: 0,
        dps: this.outletMap[outletNames.all]
      })
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

  async initOutlets() {
    return new TuyaDevice({
      id: this.config.tuyaLocalId,
      key: this.config.tuyaLocalKey,
      ip: this.config.tuyaLocalIpAddress
    });
  }

  async initSelfRepairLoop() {
    logger.info('Starting outlet self repair loop')
    let checks = 1;

    while (true) {

      let badStates = await this.checkForBadStates();
      checks++;

      if (checks > 10) {
        logger.info(`Self repair has checked for bad states ${checks} times since last report`);
        checks = 1;
      }


      for (let key in badStates) {
        logger.warn(`Bad outlet state found. Expected ${key} to be ${badStates[key] ? 'ON' : 'OFF'}`);
        try {
          await this.turn(key, badStates[key], true);
        } catch (ex) {
          logger.error(`Unable to recover ${key} from bad state`);
        }
      }
      await timeout(10000);
    }
  }

  getStatus() {
    let results = {};
    Object.keys(this.state).forEach(key => {
      results[key] = this.state[key].state
    })
    return results;
  }

  makeReverseOutLetMap() {
    let map = {};
    Object.keys(this.outletMap).map(key => {
      map[this.outletMap[key]] = key;
    });
    return map;
  }

  async updateState() {
    let newState = Object.assign({}, this.initState);

    try {
      let status = await this.tuya.get({
        schema: true
      });

      if (!status.devId) {
        logger.error('Received bad data from tuyu', ex)
      }

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

    this.state = newState;
    return newState;
  }

  async checkForBadStates() {
    let status;
    let statusIsOK
    let tries = 1;

    while (!statusIsOK) {

      if (status === false) {
        logger.error(`Attemting to check for bad states try ${tries} `);
      }

      tries++;

      try {
        status = await this.tuya.get({schema: true});

        if (status && status.devId && status.dps) {
          statusIsOK = true;
        } else {
          statusIsOK = fase;
          logger.error(`Got bad data when tried to fetch tuya's states`)
        }

      } catch (ex) {
        statusIsOK = false;
        logger.error(`Unable get tuya's states`, ex)
      }

      await timeout(2000)
    }

    logger.silly(`Check for bad states sucessful`)

  let results = {};

  Object.keys(status.dps).forEach(dps => {
    if (this.reverseOutletMap[dps]) {
      if (this.getOutletByDps(dps).state != status.dps[dps] && !this.getOutletByDps(dps).requestingChange) {
        results[this.getOutletNameByDps(dps)] = this.state[this.getOutletNameByDps(dps)].state
      }
    }
  })
  return results;
}

getOutletNameByDps(dps) {
  return this.reverseOutletMap[dps];
}

getOutletByDps(dps) {
  return this.state[this.getOutletNameByDps(dps)];
}

async allOff() {
  let results;
  logger.info(`Turning ALL outlets OFF`)
  try {
    results = await this.tuya.set({
      set: 0,
      dps: this.outletMap[outletNames.all]
    })
  } catch (ex) {
    logger.error('Unable to turn all devices off', ex)
  }
  return results;
}

async turn(id, state, override) {
  let tries = 1;
  let response;

  if ((this.state[id].state !== state && !this.state[id].requestingChange) || override) {

    logger.info(`${override ? 'Self Repair: ' : ''}Turning ${id} ${state ? 'ON' : 'OFF'}`)
    this.state[id].requestingChange = true;

    try {
      response = await this.toggleOutlet(id, state);
    } catch (ex) {
      logger.warn(`Failed to turn ${id} to ${state ? 'ON' : 'OFF'}`)
      response = false;
    }

    while (response !== true) {
      logger.warn(`Previous attempt (${tries}) to turn ${id} ${state ? 'ON' : 'OFF'} failed. Will retry.`)
      await timeout(5000);
      response = await this.toggleOutlet(id, state);
      tries++
    }

    // if (tries > 5) {
    //   logger.error(`Previous ${tries} attempts to turn ${id} ${state ? 'ON' : 'OFF'} failed.`)
    // }

    if (response === true) {
      this.state[id].state = state;
      this.state[id].requestingChange = false;
      logger.info(`Turning ${id} ${state ? 'ON' : 'OFF'} was a success`)
    }

    // this.updateState();

    return response;
  }
}

async toggleOutlet(id, state) {
  try {
    let response = await this.tuya.set({
      set: state,
      dps: this.outletMap[id]
    });
    return response;
  } catch (ex) {
    logger.error(`Unable to turn ${id} ${state ? 'ON' : 'OFF'}`, ex)
    return !state;
  }
}

}