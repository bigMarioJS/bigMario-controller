

import schedule from 'node-schedule';

export default class Scheduler {
  constructor (growProfile, outlets) {
    this.growProfile = growProfile;
    this.outlets = outlets;
  }

  init () {
    this.growProfile.schedule.forEach(()=> {

    })
  }


}