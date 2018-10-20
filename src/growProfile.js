export default {
  relativeHumidity: {
    target: 100,
    useFanToLower: false
  },
  freshAirExchange: {
    schedules: [
      {time: '0 0 * * *', runTimeSeconds: 60},
      {time: '0 8 * * *' , runTimeSeconds: 60},
      {time: '0 16 * * *', runTimeSeconds: 60}
    ]
  },
  temp: 24
}