export default {
  relativeHumidity: {
    target: 100,
    useFanToLower: false
  },
    schedules: [
      {time: '0 0 * * *', runTimeSeconds: 60, outlet: 'EXHAUST_FAN_OUTLET'},
      {time: '0 8 * * *' , runTimeSeconds: 60, outlet: 'EXHAUST_FAN_OUTLET'},
      {time: '0 16 * * *', runTimeSeconds: 60, outlet: 'EXHAUST_FAN_OUTLET'}
    ],
  temp: 24
}