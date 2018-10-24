import TuyaDevice, {
  mockTuyaDevice
} from 'tuyapi';
import Outlets from './Outlets';
// jest.mock('tuyapi')

const tuyaConfig = {
  tuyaLocalId: 'id',
  tuyaLocalKey: 'key',
  tuyaLocalIpAddress: 'ip'
}

let tuyaStatus = {
  dps: {
    '1': false,
    '2': false,
    '3': false,
    '4': false,
    '5': false,
    '6': 0
  }
}

let outlets;

describe('Outlets:', () => {

  beforeEach(() => {
    jest.restoreAllMocks()
    mockTuyaDevice.get.mockReturnValue(Promise.resolve(tuyaStatus))
  });

  it('should construct', async () => {

    outlets = new Outlets(tuyaConfig);

    // expect(TuyaDevice).toHaveBeenCalled();

    expect(outlets.state).toEqual({
      "ALL_OUTLETS": {},
      "EXHAUST_FAN_OUTLET": {},
      "HEATER_OUTLET": {},
      "HUMIDIFER_FAN_OUTLET": {},
      "HUMIDIFER_OUTLET": {},
    })

    expect(outlets.outletMap).toEqual({
      "ALL_OUTLETS": 6,
      "EXHAUST_FAN_OUTLET": 1,
      "HEATER_OUTLET": 4,
      "HUMIDIFER_FAN_OUTLET": 3,
      "HUMIDIFER_OUTLET": 2,
    })
  })

  it('should init', async () => {
    outlets = new Outlets(tuyaConfig);
    let results = await outlets.init();

    expect(results).toBe(true)
    expect(outlets.state).toEqual({
      "ALL_OUTLETS": {"requestingChange": false, "state": 0},
      "EXHAUST_FAN_OUTLET": {"requestingChange": false, "state": false},
      "HEATER_OUTLET": {"requestingChange": false, "state": false},
      "HUMIDIFER_FAN_OUTLET": {"requestingChange": false, "state": false},
      "HUMIDIFER_OUTLET": {"requestingChange": false, "state": false},
    })
  })

  it('should check state', async () => {
    outlets = new Outlets(tuyaConfig);
    await outlets.init();
    outlets.state['HUMIDIFER_OUTLET'].state = true;
    outlets.state['HEATER_OUTLET'].state = true;

    let results = await outlets.checkForBadStates();
    expect(results).toEqual({"HEATER_OUTLET": true, "HUMIDIFER_OUTLET": true, "badStateCount": 2})
  })

})