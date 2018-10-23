

import schedule from 'node-schedule';

//TODO all of this, need fresh air

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