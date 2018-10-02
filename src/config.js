export default {
  updateSeconds: (process.env.UPDATE_SECONDS ? process.env.UPDATE_SECONDS : 5) * 1000,
  uri: process.env.URI || 'http://localhost:3000/v1/sensorData',
  apiKey: process.env.API_KEY || '123',
  environmentId: process.env.ENVIRONMENT_ID || 'dev',
  port: process.env.port || '3030',
  tuyaLocalIpAddress: process.env.TUYA_LOCAL_IP_ADDRESS || '10.0.1.17',
  tuyaLocalId: process.env.TUYA_LOCAL_ID || '07200359bcddc282c71e',
  tuyaLocalKey: process.env.TUYA_LOCAL_KEY || '84cf43272494795d',
}