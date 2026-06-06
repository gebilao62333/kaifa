const https = require('https');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

const MAP_API_HOST = 'apis.map.qq.com';

/**
 * 腾讯地图 WebService API 封装
 * 支持：地理编码、逆地理编码、地点搜索、距离计算、IP定位
 */

const requestMapApi = (path, params = {}) => {
  return new Promise((resolve, reject) => {
    const key = config.map.tencentKey;
    if (!key) {
      // 开发环境降级：返回Mock数据
      if (config.nodeEnv === 'development') {
        return resolve(mockResponse(path, params));
      }
      return reject(new Error('腾讯地图KEY未配置'));
    }

    const query = Object.entries({ ...params, key, output: 'json' })
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const fullPath = `${path}?${query}`;

    const options = {
      hostname: MAP_API_HOST,
      port: 443,
      path: fullPath,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 0) {
            resolve(result);
          } else {
            reject(new Error(result.message || '地图API请求失败'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', e => reject(e));
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('地图API请求超时')); });
    req.end();
  });
};

// 开发环境Mock数据
const mockResponse = (path, params) => {
  if (path.includes('/geocoder/v1') && !path.includes('location')) {
    // 逆地理编码 Mock
    if (params.location) {
      const [lat, lng] = params.location.split(',').map(Number);
      return {
        status: 0,
        result: {
          address: `开发Mock地址 (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          address_reference: { town: 'MockTown', street: 'MockStreet' },
          ad_info: { nation: '中国', province: '广东省', city: '深圳市', district: '南山区', adcode: '440305' },
          pois: [{ id: 'mock_1', title: 'Mock地点', address: 'Mock地址', category: '其他', location: { lat, lng } }]
        }
      };
    }
    // 地理编码 Mock
    return {
      status: 0,
      result: {
        title: params.address || 'Mock地址',
        location: { lat: 22.5431, lng: 113.929 },
        ad_info: { province: '广东省', city: '深圳市', district: '南山区', adcode: '440305' },
        address_components: { province: '广东省', city: '深圳市', district: '南山区', street: '科技园路' },
        reliability: 7
      }
    };
  }

  if (path.includes('/place/v1/search')) {
    return {
      status: 0,
      count: 5,
      data: [
        { id: 'm1', title: `${params.keyword}Mock-1`, address: '深圳市南山区科技园', category: '美食', location: { lat: 22.543, lng: 113.929 }, tel: '' },
        { id: 'm2', title: `${params.keyword}Mock-2`, address: '深圳市南山区海岸城', category: '美食', location: { lat: 22.518, lng: 113.937 }, tel: '' },
      ]
    };
  }

  if (path.includes('/place/v1/suggestion')) {
    return {
      status: 0,
      count: 3,
      data: [
        { id: 's1', title: `${params.keyword}建议1`, address: 'Mock地址1', category: '其他', location: { lat: 22.543, lng: 113.929 } },
        { id: 's2', title: `${params.keyword}建议2`, address: 'Mock地址2', category: '其他', location: { lat: 22.518, lng: 113.937 } },
      ]
    };
  }

  if (path.includes('/distance')) {
    return {
      status: 0,
      result: { elements: [{ distance: 12500, duration: 1800 }] }
    };
  }

  if (path.includes('/location/v1/ip')) {
    return {
      status: 0,
      result: { ip: '127.0.0.1', location: { lat: 22.5431, lng: 113.929 }, ad_info: { nation: '中国', province: '广东省', city: '深圳市', district: '南山区', adcode: '440305' } }
    };
  }

  if (path.includes('/coord/v1/translate')) {
    const locs = (params.locations || '').split(';').map(l => {
      const [lat, lng] = l.split(',').map(Number);
      return { lat: lat + 0.001, lng: lng + 0.001 };
    });
    return { status: 0, locations: locs };
  }

  return { status: 0, result: { message: 'Mock数据' } };
};

/**
 * 地理编码：地址 → 坐标
 */
const geocoder = async (address) => {
  const result = await requestMapApi('/ws/geocoder/v1', { address });
  return {
    title: result.result.title,
    location: result.result.location,
    adInfo: result.result.ad_info,
    addressComponents: result.result.address_components,
    reliability: result.result.reliability
  };
};

/**
 * 逆地理编码：坐标 → 地址
 */
const reverseGeocoder = async (lat, lng) => {
  const result = await requestMapApi('/ws/geocoder/v1', {
    location: `${lat},${lng}`,
    get_poi: 1,
    poi_options: 'radius=1000'
  });
  return {
    address: result.result.address,
    adInfo: result.result.ad_info,
    addressReference: result.result.address_reference,
    pois: result.result.pois || []
  };
};

/**
 * 地点搜索
 */
const placeSearch = async (keyword, options = {}) => {
  const { lat, lng, pageIndex = 1, pageSize = 20, radius } = options;
  const params = {
    keyword,
    page_index: pageIndex,
    page_size: Math.min(pageSize, 20)
  };
  if (lat && lng) {
    params.boundary = `nearby(${lat},${lng},${radius || 1000})`;
  } else if (options.region) {
    params.boundary = `region(${options.region},0)`;
  }
  const result = await requestMapApi('/ws/place/v1/search', params);
  return {
    count: result.count,
    data: (result.data || []).map(p => ({
      id: p.id,
      title: p.title,
      address: p.address,
      category: p.category,
      location: p.location,
      tel: p.tel
    }))
  };
};

/**
 * 距离计算：支持驾车/步行/骑行
 */
const distance = async (from, to, mode = 'driving') => {
  let fromStr, toStr;
  if (typeof from === 'object') fromStr = `${from.lat},${from.lng}`;
  else fromStr = from;
  if (typeof to === 'object') toStr = `${to.lat},${to.lng}`;
  else toStr = to;

  const result = await requestMapApi('/ws/distance/v1/', {
    mode,
    from: fromStr,
    to: toStr
  });
  return {
    elements: (result.result.elements || []).map(e => ({
      distance: e.distance,  // 米
      duration: e.duration   // 秒
    }))
  };
};

/**
 * IP定位
 */
const ipLocation = async (ip) => {
  const result = await requestMapApi('/ws/location/v1/ip', ip ? { ip } : {});
  return {
    ip: result.result.ip,
    location: result.result.location,
    adInfo: result.result.ad_info
  };
};

/**
 * 坐标转换（GPS/WGS84 → 腾讯/GCJ02）
 */
const translateCoord = async (locations, type = 1) => {
  // type: 1-GPS转腾讯, 3-腾讯转GPS
  const locStr = Array.isArray(locations)
    ? locations.map(l => `${l.lat},${l.lng}`).join(';')
    : locations;
  const result = await requestMapApi('/ws/coord/v1/translate', {
    locations: locStr,
    type
  });
  return {
    locations: (result.locations || []).map(l => ({
      lat: l.lat,
      lng: l.lng
    }))
  };
};

/**
 * 建议/输入提示（用于搜索自动补全）
 */
const suggestion = async (keyword, region) => {
  const params = { keyword };
  if (region) params.region = region;
  const result = await requestMapApi('/ws/place/v1/suggestion', params);
  return {
    count: result.count,
    data: (result.data || []).map(s => ({
      id: s.id,
      title: s.title,
      address: s.address,
      category: s.category,
      location: s.location
    }))
  };
};

module.exports = {
  geocoder,
  reverseGeocoder,
  placeSearch,
  distance,
  ipLocation,
  translateCoord,
  suggestion
};
