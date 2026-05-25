const regionsData = require('../data/regions.json');

class RegionService {
  constructor() {
    this.provinces = regionsData.provinces || [];
    this.cities = regionsData.cities || [];
  }

  async getAllProvinces() {
    return this.provinces;
  }

  async getCitiesByProvince(provinceCode) {
    return this.cities.filter(city => city.provinceCode === provinceCode);
  }

  async getDistrictsByCity(cityCode) {
    const districtData = regionsData.districts || {};
    return districtData[cityCode] || [];
  }

  async getTownshipsByDistrict(districtCode) {
    const townshipData = regionsData.townships || {};
    return townshipData[districtCode] || [];
  }

  async searchRegions(keyword) {
    const results = { provinces: [], cities: [], districts: [] };
    const kw = keyword.toLowerCase();

    this.provinces.forEach(p => {
      if (p.name.includes(keyword) || p.pinyin.includes(kw)) {
        results.provinces.push(p);
      }
    });

    this.cities.forEach(c => {
      if (c.name.includes(keyword) || c.pinyin.includes(kw)) {
        results.cities.push(c);
      }
    });

    return results;
  }

  async getRegionPath(code) {
    let path = { province: null, city: null, district: null, township: null };
    
    const province = this.provinces.find(p => p.code === code);
    if (province) {
      path.province = province;
      return path;
    }

    const city = this.cities.find(c => c.code === code);
    if (city) {
      path.province = this.provinces.find(p => p.code === city.provinceCode);
      path.city = city;
      return path;
    }

    return path;
  }

  getCityByCode(code) {
    return this.cities.find(c => c.code === code);
  }

  getProvinceByCode(code) {
    return this.provinces.find(p => p.code === code);
  }
}

module.exports = new RegionService();
