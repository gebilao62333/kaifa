// 数据访问层（Repository）：封装下载项的存储细节。
// 当前使用内存数组实现，便于开箱即跑；接入 MySQL/MongoDB 时只需替换此文件，
// 上层 service / controller 无需改动（依赖倒置，低耦合）。

const PLATFORMS = { ios: '苹果', android: '安卓', harmony: '鸿蒙' };

class DownloadRepository {
  constructor() {
    const now = Date.now();
    // 预置三个平台占位项，url 由后台配置
    this.items = [
      this._seed(1, 'ios', 1, now),
      this._seed(2, 'android', 2, now),
      this._seed(3, 'harmony', 3, now),
    ];
    this.nextId = 4;
  }

  _seed(id, platform, sort, time) {
    return {
      id,
      platform,
      version: '1.0.0',
      url: '',
      size: '',
      sort,
      status: 1,
      createTime: time,
      updateTime: time,
    };
  }

  list(filter = {}) {
    let result = [...this.items];
    if (filter.platform) result = result.filter((d) => d.platform === filter.platform);
    if (filter.status !== undefined && filter.status !== '') {
      result = result.filter((d) => d.status === Number(filter.status));
    }
    if (filter.keyword) {
      result = result.filter(
        (d) => (d.version || '').includes(filter.keyword) || (d.url || '').includes(filter.keyword),
      );
    }
    result.sort((a, b) => a.sort - b.sort);
    return result;
  }

  findById(id) {
    return this.items.find((d) => d.id === Number(id)) || null;
  }

  findByPlatform(platform) {
    return this.items.find((d) => d.platform === platform) || null;
  }

  create(data) {
    const item = {
      id: this.nextId++,
      platform: data.platform,
      version: data.version || '',
      url: data.url || '',
      size: data.size || '',
      sort: Number(data.sort ?? 99),
      status: Number(data.status ?? 1),
      createTime: Date.now(),
      updateTime: Date.now(),
    };
    this.items.push(item);
    return item;
  }

  update(id, patch) {
    const item = this.findById(id);
    if (!item) return null;
    Object.assign(item, patch, { updateTime: Date.now() });
    return item;
  }

  remove(id) {
    const idx = this.items.findIndex((d) => d.id === Number(id));
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }
}

DownloadRepository.PLATFORMS = PLATFORMS;
module.exports = DownloadRepository;
