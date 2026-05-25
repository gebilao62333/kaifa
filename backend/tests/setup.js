jest.setTimeout(30000);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

beforeAll(() => {
  console.log('Running tests...');
});

afterAll(() => {
  console.log('Tests completed.');
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
