
import schedule from 'node-schedule';
import Logger from '../utils/Logger';

const logger = new Logger();
const timeout = ms => new Promise(res => setTimeout(res, ms))


//TODO all of this, need fresh air

export default class Scheduler {
  constructor (growProfile, outlets) {
    this.growProfile = growProfile;
    this.outlets = outlets;
  }

  async cycleOutlet(outlet, seconds) {
    logger.info(`Sheduled ${outlet} to be ON for ${seconds} seconds`);
    await this.outlets.turn(outlet, true);
    await timeout(seconds * 1000);
    await this.outlets.turn(outlet, false);
  }

  init () {
    this.growProfile.schedules.forEach((s)=> {
      let job = schedule.scheduleJob(s.cron, () => {this.cycleOutlet(s.outlet, s.runTimeSeconds)})
      let nextTime = job.nextInvocation()._date.toString()
      logger.info(`Job scheduled ${nextTime} to run ${s.outlet} for ${s.runTimeSeconds}` )
    })
  }
}