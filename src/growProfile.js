//TODO this needs to live on the API and be fetched

export default {
  relativeHumidity: {
    target: 95,
    useFanToLower: false
  },
    schedules: [
      {cron: '0 0 * * *', runTimeSeconds: 60, outlet: 'EXHAUST_FAN_OUTLET'},
      {cron: '0 8 * * *' , runTimeSeconds: 60, outlet: 'EXHAUST_FAN_OUTLET'},
      {cron: '0 16 * * *', runTimeSeconds: 60, outlet: 'EXHAUST_FAN_OUTLET'}
    ],
  temp: 24
}