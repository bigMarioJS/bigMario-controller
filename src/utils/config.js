export default {

  myceliumApiUpdateSeconds: (process.env.MYCELIUM_API_UPDATE_SECONDS || 10) * 1000,
  myceliumHumidityUpdateSeconds: (process.env.MYCELIUM_HUMIDITY_UPDATE_SECONDS || 10) * 1000,
  myceliumApiUri: process.env.MYCELIUM_API_URI || 'http://localhost:3000/v1/sensorData',
  myceliumApiSecret: process.env.MYCELIUM_API_KEY_SECRET || '123',

  growEnvironmentId: process.env.GROW_ENVIRONMENT_ID || 'dev',
  statusPort: process.env.STATUS_PORT || '3030',

  tuyaLocalIpAddress: process.env.TUYA_LOCAL_IP_IP || '10.0.1.17',
  tuyaLocalId: process.env.TUYA_LOCAL_ID || '07200359bcddc282c71e',
  tuyaLocalKey: process.env.TUYA_LOCAL_KEY || '84cf43272494795d',
}