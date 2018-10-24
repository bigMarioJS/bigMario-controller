

// Import this named export into your test file:
export const mockTuyaDevice = {
  get: jest.fn()
}

const mock = jest.fn().mockImplementation(() => {
  return mockTuyaDevice;
});

export default mock;