const regionController = require('../../../src/controllers/region');

jest.mock('../../../src/services/regionService', () => ({
  getAllProvinces: jest.fn(),
  getCitiesByProvince: jest.fn(),
  getDistrictsByCity: jest.fn(),
  getTownshipsByDistrict: jest.fn(),
  searchRegions: jest.fn()
}));

const regionService = require('../../../src/services/regionService');

const mockReq = (overrides = {}) => ({ body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Region', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getProvinces returns list', async () => {
    regionService.getAllProvinces.mockResolvedValue([{ code: '11', name: '北京' }]);
    const res = mockRes();
    await regionController.getProvinces(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getProvinces maps error to 500', async () => {
    regionService.getAllProvinces.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await regionController.getProvinces(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getCities rejects missing provinceCode', async () => {
    const res = mockRes();
    await regionController.getCities(mockReq({ params: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getCities returns list', async () => {
    regionService.getCitiesByProvince.mockResolvedValue([{ code: '1101' }]);
    const res = mockRes();
    await regionController.getCities(mockReq({ params: { provinceCode: '11' } }), res);
    expect(regionService.getCitiesByProvince).toHaveBeenCalledWith('11');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getCities maps error to 500', async () => {
    regionService.getCitiesByProvince.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await regionController.getCities(mockReq({ params: { provinceCode: '11' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getDistricts rejects missing cityCode', async () => {
    const res = mockRes();
    await regionController.getDistricts(mockReq({ params: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getDistricts returns list', async () => {
    regionService.getDistrictsByCity.mockResolvedValue([{ code: '110101' }]);
    const res = mockRes();
    await regionController.getDistricts(mockReq({ params: { cityCode: '1101' } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getDistricts maps error to 500', async () => {
    regionService.getDistrictsByCity.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await regionController.getDistricts(mockReq({ params: { cityCode: '1101' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getTownships rejects missing districtCode', async () => {
    const res = mockRes();
    await regionController.getTownships(mockReq({ params: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getTownships returns list', async () => {
    regionService.getTownshipsByDistrict.mockResolvedValue([{ code: '110101001' }]);
    const res = mockRes();
    await regionController.getTownships(mockReq({ params: { districtCode: '110101' } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getTownships maps error to 500', async () => {
    regionService.getTownshipsByDistrict.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await regionController.getTownships(mockReq({ params: { districtCode: '110101' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('searchRegions rejects short keyword', async () => {
    const res = mockRes();
    await regionController.searchRegions(mockReq({ query: { q: 'a' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('searchRegions returns results', async () => {
    regionService.searchRegions.mockResolvedValue([{ name: '北京' }]);
    const res = mockRes();
    await regionController.searchRegions(mockReq({ query: { q: '北京' } }), res);
    expect(regionService.searchRegions).toHaveBeenCalledWith('北京');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('searchRegions maps error to 500', async () => {
    regionService.searchRegions.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await regionController.searchRegions(mockReq({ query: { q: '北京' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
