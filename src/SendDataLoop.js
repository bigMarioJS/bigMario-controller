

import Logger from './Logger';
import config from './config';
import axios from 'axios';
const logger = new Logger();

const timeout = ms => new Promise(res => setTimeout(res, ms))

export default class SendData {

  constructor(sensorData, growProfile, outlets, initialized) {
    this.sensorData = sensorData;
    this.growProfile = growProfile;
    this.outlets = outlets;
    this.initialized = initialized;

    this.init = this.init.bind(this);
    this.getData = this.getData.bind(this)
  }

 async sendData(data) {
  return axios.post(config.myceliumApiUri, data, {headers: { 'x-api-key': config.myceliumApiSecret}})
}

getData () {
  let sensorData = this.sensorData.getData();

  return  Object.assign(
    {},
    {...sensorData},
    {outletStatus: this.outlets.getStatus()},
    {initialized: this.initialized},
    {environmentId: config.growEnvironmentId}
  );
}

  async init() {
    while (true) {
      let data = this.getData()
      try {
        await this.sendData(data);
        logger.silly(`Data sent: ${JSON.stringify(data, null, 2)}`)
      } catch (ex) {
        logger.error('Data send failed', ex)
      }

      await timeout(config.myceliumApiUpdateSeconds)
      // TODO: send data loop clearing data, smells
      this.sensorData.clearData();
    }
  }
}