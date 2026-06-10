/**
 * LocalSequelize — 本地数据源引擎
 * 
 * 替代 Sequelize + MySQL，提供完全兼容的 API 接口。
 * 数据存储在内存中，持久化到 JSON 文件。
 * 支持：define, findAll, findOne, findByPk, create, update, destroy, 
 *        findAndCountAll, findOrCreate, count, bulkCreate, belongsTo, hasMany
 */

const path = require('path');
const fs = require('fs');

// 数据持久化目录
const DATA_DIR = path.resolve(__dirname, '../data');
const TABLES_FILE = path.join(DATA_DIR, '_tables.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// UUID 生成器
let _nextId = Date.now();
function nextId() {
  return ++_nextId;
}

// 深度克隆
function clone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(clone);
  const c = {};
  for (const k of Object.keys(obj)) c[k] = clone(obj[k]);
  return c;
}

// === WHERE 条件匹配 ===
// 获取 Sequelize Op 常量（延迟加载避免循环依赖）
function getSequelizeOp() {
  try {
    return require('sequelize').Op;
  } catch (e) {
    return {};
  }
}

function matchWhere(record, where) {
  if (!where) return true;

  // 处理 Op.or / Op.and / Op.not 等 Symbol 键（Reflect.ownKeys 包含 Symbol）
  const allKeys = Reflect.ownKeys(where);
  if (allKeys.length === 0 && typeof where === 'object' && where !== null) {
    // 空对象 where: {} 匹配所有
    return true;
  }

  for (const key of allKeys) {
    // 跳过 null/undefined 键
    if (key == null) continue;

    // 处理 Symbol 键（Op.or / Op.and）
    if (typeof key === 'symbol') {
      const Op = getSequelizeOp();
      const cond = where[key];

      if (key === Op.or && Array.isArray(cond)) {
        // OR: 任意一个子条件匹配即通过
        if (!cond.some(sub => matchWhere(record, sub))) return false;
      } else if (key === Op.and && Array.isArray(cond)) {
        // AND: 所有子条件都匹配才通过
        if (!cond.every(sub => matchWhere(record, sub))) return false;
      } else if (key === Op.not) {
        // NOT: 取反
        if (matchWhere(record, cond)) return false;
      }
      continue;
    }

    // 处理字符串键
    const cond = where[key];
    const val = record[key];

    // 如果 cond 是对象且不是数组、不是 null、不是 Date
    if (cond && typeof cond === 'object' && !Array.isArray(cond) && !(cond instanceof Date)) {
      const Op = getSequelizeOp();
      const subKeys = Reflect.ownKeys(cond);

      for (const subKey of subKeys) {
        const subVal = cond[subKey];

        // 处理操作符 Symbol
        if (typeof subKey === 'symbol') {
          if (subKey === Op.eq || subKey === Symbol.for('eq')) {
            if (val != subVal) return false;
          } else if (subKey === Op.ne) {
            if (val == subVal) return false;
          } else if (subKey === Op.gt) {
            if (!(val > subVal)) return false;
          } else if (subKey === Op.gte) {
            if (!(val >= subVal)) return false;
          } else if (subKey === Op.lt) {
            if (!(val < subVal)) return false;
          } else if (subKey === Op.lte) {
            if (!(val <= subVal)) return false;
          } else if (subKey === Op.like || subKey === Op.substring) {
            const likeStr = String(subVal).replace(/%/g, '.*').replace(/_/g, '.');
            if (!new RegExp(likeStr, 'i').test(String(val || ''))) return false;
          } else if (subKey === Op.in) {
            if (!Array.isArray(subVal) || !subVal.includes(val)) return false;
          } else if (subKey === Op.notIn) {
            if (Array.isArray(subVal) && subVal.includes(val)) return false;
          } else if (subKey === Op.between) {
            if (!(val >= subVal[0] && val <= subVal[1])) return false;
          } else if (subKey === Op.is || subKey === Op.not) {
            if (subVal === null && val !== null) return false;
            if (subVal !== null && val !== subVal) return false;
          } else {
            // 未知 Symbol 操作符，跳过（宽松匹配）
          }
        } else if (typeof subKey === 'string') {
          // 普通对象键：精确匹配
          if (val != subVal) return false;
        }
      }
    } else if (Array.isArray(cond)) {
      // 数组值：val 必须在数组中
      if (!cond.includes(val)) return false;
    } else {
      // 直接值比较
      if (val != cond) return false;
    }
  }
  return true;
}

// === 排序 ===
function sortRecords(records, order) {
  if (!order || order.length === 0) return records;
  return [...records].sort((a, b) => {
    for (const item of order) {
      if (Array.isArray(item)) {
        const [col, dir] = item;
        const va = a[col] != null ? a[col] : 0;
        const vb = b[col] != null ? b[col] : 0;
        if (va < vb) return dir === 'DESC' ? 1 : -1;
        if (va > vb) return dir === 'DESC' ? -1 : 1;
      }
    }
    return 0;
  });
}

// === 属性投影 ===
function projectRecord(record, attributes) {
  if (!attributes || attributes.length === 0) return clone(record);
  const result = {};
  for (const attr of attributes) {
    if (Array.isArray(attr)) {
      // [field, alias] 格式
      result[attr[1]] = record[attr[0]];
    } else if (typeof attr === 'string') {
      result[attr] = record[attr];
    }
  }
  return result;
}

// === 操作符常量 ===
const Op = {
  eq: 'Op.eq',
  ne: 'Op.ne',
  gt: 'Op.gt',
  gte: 'Op.gte',
  lt: 'Op.lt',
  lte: 'Op.lte',
  like: 'Op.like',
  in: 'Op.in',
  notIn: 'Op.notIn',
  between: 'Op.between',
  is: 'Op.is',
  and: 'Op.and',
  or: 'Op.or'
};

/**
 * 单个"表"的数据管理类
 */
class LocalModel {
  constructor(name, attributes, options, store) {
    this.name = name;
    this.tableName = options.tableName || name;
    this.attributes = attributes; // { fieldName: { type, allowNull, defaultValue, primaryKey, unique, autoIncrement } }
    this.primaryKey = null;
    this.autoIncrementField = null;
    this.store = store; // DataStore 引用
    this._belongsTo = [];
    this._hasMany = [];

    // 解析主键和自增字段
    for (const [key, def] of Object.entries(attributes)) {
      if (def.primaryKey) this.primaryKey = key;
      if (def.autoIncrement) this.autoIncrementField = key;
    }
    if (!this.primaryKey) this.primaryKey = 'id';
    if (!this.autoIncrementField) this.autoIncrementField = 'id';

    // 加载持久化数据
    this._records = this.store.loadTable(this.tableName);
    this._nextAutoId = this._computeNextAutoId();
  }

  _computeNextAutoId() {
    // 用户表 ID 约束：起始 20001，5 位数上限 99999
    let minAutoId = 1;
    if (this.tableName === 'xn_user') {
      minAutoId = 20001;
    } else if (this.tableName === 'xn_virtual_user') {
      minAutoId = 20001;
    }

    if (this._records.length === 0) return minAutoId;
    const pkField = this.autoIncrementField || this.primaryKey;
    const maxId = Math.max(...this._records.map(r => r[pkField] || 0));
    // 确保新建记录的 ID 不小于最低允许值
    return Math.max(maxId + 1, minAutoId);
  }

  // 从 DataTypes 对象提取类型名称
  _getTypeName(typeDef) {
    if (!typeDef) return '';
    // Sequelize DataTypes 对象有 key 属性 (e.g., 'STRING', 'INTEGER')
    if (typeDef.key) return String(typeDef.key).toUpperCase();
    // 可能是构造函数本身
    if (typeof typeDef === 'function') {
      return String(typeDef.name || typeDef.constructor?.name || '').toUpperCase();
    }
    // 字符串兜底
    return String(typeDef).toUpperCase();
  }

  // 填充默认值
  _applyDefaults(data, isUpdate = false) {
    const record = {};
    for (const [key, def] of Object.entries(this.attributes)) {
      if (data[key] !== undefined) {
        record[key] = data[key];
      } else if (!isUpdate) {
        // 只有新建时才应用 defaultValue
        if (def.defaultValue !== undefined) {
          record[key] = typeof def.defaultValue === 'function' ? def.defaultValue() : def.defaultValue;
        } else if (def.allowNull === false && def.primaryKey !== true) {
          // 根据类型给默认值
          const t = this._getTypeName(def.type);
          if (t.includes('INT') || t.includes('BIGINT') || t.includes('TINYINT')) record[key] = 0;
          else if (t.includes('DECIMAL') || t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('REAL')) record[key] = 0;
          else if (t.includes('BOOLEAN')) record[key] = false;
          else if (t.includes('TEXT') || t.includes('BLOB')) record[key] = '';
          else record[key] = '';
        }
      }
    }
    return record;
  }

  // === CRUD 操作 ===

  // 给单条记录添加实例方法（模拟 Sequelize model instance）
  _decorateRecord(record) {
    if (!record || typeof record !== 'object') return record;
    const model = this;
    const pk = model.primaryKey;
    const id = record[pk];

    // dataValues 别名
    Object.defineProperty(record, 'dataValues', {
      get() { return this; },
      enumerable: false
    });

    // 实例方法
    record.update = async (data) => {
      await model.update(data, { where: { [pk]: id } });
      // 重新读取更新后的数据
      const updated = await model.findByPk(id);
      if (updated) Object.assign(record, updated);
      return record;
    };

    record.save = async () => {
      if (id) {
        await model.update(record, { where: { [pk]: id } });
      }
      return record;
    };

    record.destroy = async () => {
      if (id) {
        await model.destroy({ where: { [pk]: id } });
      }
    };

    record.reload = async () => {
      const fresh = await model.findByPk(id);
      if (fresh) {
        // 清空并重新赋值
        Object.keys(record).forEach(k => {
          if (k !== 'update' && k !== 'save' && k !== 'destroy' && k !== 'reload' && k !== 'toJSON' && k !== 'dataValues') {
            delete record[k];
          }
        });
        Object.assign(record, fresh);
      }
      return record;
    };

    record.toJSON = () => {
      const result = {};
      for (const k of Object.keys(record)) {
        if (typeof record[k] !== 'function') {
          result[k] = record[k];
        }
      }
      return result;
    };

    return record;
  }

  async findAll(options = {}) {
    let records = clone(this._records);

    // WHERE
    if (options.where) {
      records = records.filter(r => matchWhere(r, options.where));
    }

    // ORDER
    if (options.order) {
      records = sortRecords(records, options.order);
    }

    // OFFSET
    if (options.offset) {
      records = records.slice(options.offset);
    }

    // LIMIT
    if (options.limit) {
      records = records.slice(0, options.limit);
    }

    // ATTRIBUTES / raw
    if (options.raw) {
      records = records.map(r => clone(r));
    }

    // INCLUDE (简单关联)
    if (options.include && options.include.length > 0) {
      records = await this._resolveIncludes(records, options.include);
    }

    // 装饰每条记录，添加实例方法
    records = records.map(r => this._decorateRecord(r));

    return records;
  }

  async findOne(options = {}) {
    options.limit = 1;
    const results = await this.findAll(options);
    return results[0] || null;
  }

  async findByPk(id, options = {}) {
    const pk = this.primaryKey;
    const where = { [pk]: id, ...(options.where || {}) };
    const record = await this.findOne({ where, include: options.include });
    return record;
  }

  async findAndCountAll(options = {}) {
    let records = clone(this._records);

    // WHERE
    if (options.where) {
      records = records.filter(r => matchWhere(r, options.where));
    }

    const count = records.length;

    // ORDER
    if (options.order) {
      records = sortRecords(records, options.order);
    }

    // OFFSET
    if (options.offset) {
      records = records.slice(options.offset);
    }

    // LIMIT
    if (options.limit) {
      records = records.slice(0, options.limit);
    }

    // DISTINCT
    if (options.distinct && options.col) {
      const seen = new Set();
      records = records.filter(r => {
        const k = r[options.col];
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }

    // INCLUDE
    if (options.include && options.include.length > 0) {
      records = await this._resolveIncludes(records, options.include);
    }

    // 装饰记录
    records = records.map(r => this._decorateRecord(r));

    return { count, rows: records };
  }

  async count(options = {}) {
    let records = clone(this._records);
    if (options.where) {
      records = records.filter(r => matchWhere(r, options.where));
    }
    if (options.distinct && options.col) {
      const seen = new Set();
      records.forEach(r => seen.add(r[options.col]));
      return seen.size;
    }
    return records.length;
  }

  async create(data, options = {}) {
    const record = this._applyDefaults(data);

    // 处理自增主键
    if (this.autoIncrementField && !record[this.autoIncrementField]) {
      record[this.autoIncrementField] = this._nextAutoId++;
    } else if (this.autoIncrementField) {
      // 显式指定 ID 时，确保 _nextAutoId 不落后于已有记录（如种子数据写入时）
      const explicitId = record[this.autoIncrementField];
      if (explicitId >= this._nextAutoId) {
        this._nextAutoId = explicitId + 1;
      }
    }

    // 设置创建时间
    if (this.attributes.create_time && record.create_time === undefined) {
      record.create_time = Math.floor(Date.now() / 1000);
    }
    if (this.attributes.update_time && record.update_time === undefined) {
      record.update_time = Math.floor(Date.now() / 1000);
    }

    this._records.push(record);
    this.store.saveTable(this.tableName, this._records);
    return this._decorateRecord(clone(record));
  }

  async bulkCreate(dataArray, options = {}) {
    const results = [];
    for (const data of dataArray) {
      // 简单去重：如果有 unique 字段且已存在则跳过
      if (options.ignoreDuplicates) {
        let isDuplicate = false;
        for (const [key, def] of Object.entries(this.attributes)) {
          if (def.unique && data[key] !== undefined) {
            const exists = this._records.find(r => r[key] === data[key]);
            if (exists) { isDuplicate = true; break; }
          }
        }
        if (isDuplicate) continue;
      }
      const record = await this.create(data);
      results.push(record);
    }
    return results;
  }

  async update(data, options = {}) {
    if (!options.where) throw new Error('update requires where clause');

    let updated = 0;
    // 更新时间
    if (this.attributes.update_time) {
      data.update_time = Math.floor(Date.now() / 1000);
    }

    this._records = this._records.map(r => {
      if (matchWhere(r, options.where)) {
        updated++;
        return { ...r, ...data };
      }
      return r;
    });

    if (updated > 0) {
      this.store.saveTable(this.tableName, this._records);
    }

    return [updated];
  }

  async destroy(options = {}) {
    if (!options.where) throw new Error('destroy requires where clause');

    let deleted = 0;
    const newRecords = [];
    for (const r of this._records) {
      if (matchWhere(r, options.where)) {
        deleted++;
      } else {
        newRecords.push(r);
      }
    }
    this._records = newRecords;
    this.store.saveTable(this.tableName, this._records);
    return deleted;
  }

  async findOrCreate(options = {}) {
    const { where, defaults = {} } = options;
    const existing = await this.findOne({ where });
    if (existing) {
      return [existing, false];
    }
    const created = await this.create({ ...defaults, ...where });
    return [created, true];
  }

  // 原子增减
  async increment(field, options = {}) {
    if (!options.where) throw new Error('increment requires where clause');
    const amount = options.by || 1;
    let updated = 0;
    this._records = this._records.map(r => {
      if (matchWhere(r, options.where)) {
        updated++;
        return { ...r, [field]: (r[field] || 0) + amount };
      }
      return r;
    });
    if (updated > 0) this.store.saveTable(this.tableName, this._records);
    return [[], updated];
  }

  async decrement(field, options = {}) {
    if (!options.where) throw new Error('decrement requires where clause');
    const amount = options.by || 1;
    let updated = 0;
    this._records = this._records.map(r => {
      if (matchWhere(r, options.where)) {
        updated++;
        return { ...r, [field]: Math.max(0, (r[field] || 0) - amount) };
      }
      return r;
    });
    if (updated > 0) this.store.saveTable(this.tableName, this._records);
    return [[], updated];
  }

  // 聚合函数
  async sum(field, options = {}) {
    let records = clone(this._records);
    if (options.where) records = records.filter(r => matchWhere(r, options.where));
    return records.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
  }

  async max(field, options = {}) {
    let records = clone(this._records);
    if (options.where) records = records.filter(r => matchWhere(r, options.where));
    if (records.length === 0) return null;
    return Math.max(...records.map(r => Number(r[field]) || 0));
  }

  async min(field, options = {}) {
    let records = clone(this._records);
    if (options.where) records = records.filter(r => matchWhere(r, options.where));
    if (records.length === 0) return null;
    return Math.min(...records.map(r => Number(r[field]) || 0));
  }

  // 更新单条记录
  async _updateById(id, data) {
    const pk = this.primaryKey;
    return this.update(data, { where: { [pk]: id } });
  }

  // === 关联查询 ===

  // 根据 include 对象查找已注册的关联
  _findAssociation(include) {
    // 先从 belongsTo 中查找
    for (const assoc of this._belongsTo) {
      if (assoc.model === include.model || assoc.as === include.as) {
        return { ...assoc, _type: 'belongsTo' };
      }
    }
    // 再从 hasMany 中查找
    for (const assoc of this._hasMany) {
      if (assoc.model === include.model || assoc.as === include.as) {
        return { ...assoc, _type: 'hasMany' };
      }
    }
    // 未注册关联：使用默认推断
    return null;
  }

  async _resolveIncludes(records, includes) {
    if (!records || records.length === 0) return records;

    const result = records.map(r => {
      const newR = clone(r);
      newR.dataValues = newR;
      return newR;
    });

    for (const include of includes) {
      if (!include.model) continue;

      // 查找已注册的关联
      const assoc = this._findAssociation(include);

      let foreignKey, targetKey, as, model;
      if (assoc) {
        foreignKey = assoc.foreignKey;
        targetKey = assoc.targetKey;
        as = assoc.as;
        model = assoc.model;
      } else {
        // 未注册关联：根据字段名推断
        model = include.model;
        as = include.as || 'related';
        foreignKey = model.name ? (model.name.toLowerCase() + '_id') : (this.name.toLowerCase() + '_id');
        targetKey = 'id';
      }

      const fk = foreignKey;
      const tk = targetKey || 'id';

      if (assoc && assoc._type === 'belongsTo') {
        // belongsTo: 当前表的 fk 指向目标表的 tk
        const targetIds = [...new Set(result.map(r => r[fk]).filter(Boolean))];
        if (targetIds.length === 0) continue;

        const targetModel = include.model;
        const relatedRecords = clone(targetModel._records || targetModel.getAll ? targetModel.getAll() : targetModel._records).filter(tr => targetIds.includes(tr[tk]));
        const relatedMap = {};
        for (const tr of relatedRecords) {
          relatedMap[tr[tk]] = relatedMap[tr[tk]] || tr;
        }

        for (const r of result) {
          const rel = relatedMap[r[fk]] || null;
          if (rel) {
            const relClone = clone(rel);
            relClone.dataValues = relClone;
            r[as] = relClone;
          } else {
            r[as] = null;
          }
        }
      } else {
        // hasMany 或未关联: 目标表的 fk 指向当前表的主键
        const pkVals = [...new Set(result.map(r => r[this.primaryKey]).filter(Boolean))];
        if (pkVals.length === 0) continue;

        const targetModel = include.model;
        const targetRecords = targetModel._records || (targetModel.getAll ? targetModel.getAll() : []);
        const relatedRecords = clone(Array.isArray(targetRecords) ? targetRecords : []).filter(tr => pkVals.includes(tr[fk]));
        for (const r of result) {
          r[as] = relatedRecords.filter(tr => tr[fk] === r[this.primaryKey]).map(tr => {
            const trClone = clone(tr);
            trClone.dataValues = trClone;
            return trClone;
          });
        }
      }
    }

    return result;
  }

  belongsTo(targetModel, options = {}) {
    const targetName = targetModel.tableName || targetModel.name || 'unknown';
    const foreignKey = options.foreignKey || (targetName.toLowerCase().replace('xn_', '') + '_id');
    this._belongsTo.push({
      model: targetModel,
      foreignKey,
      targetKey: options.targetKey || 'id',
      as: options.as || targetModel.name || 'related',
      _type: 'belongsTo'
    });
  }

  hasMany(targetModel, options = {}) {
    const selfName = this.tableName || this.name || 'unknown';
    const foreignKey = options.foreignKey || (selfName.toLowerCase().replace('xn_', '') + '_id');
    this._hasMany.push({
      model: targetModel,
      foreignKey,
      targetKey: options.targetKey || 'id',
      as: options.as || (targetModel.name ? targetModel.name + 's' : 'items'),
      _type: 'hasMany'
    });
  }

  // Sequelize 兼容方法
  sync() { return Promise.resolve(); }
  describe() { return this.attributes; }
  getTableName() { return this.tableName; }

  // 数据操作方法
  raw() { return clone(this._records); }
  getAll() { return clone(this._records); }
  _setAll(records) { this._records = records; this._nextAutoId = this._computeNextAutoId(); }
}

/**
 * 数据存储管理器
 */
class DataStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.tables = {}; // tableName -> data array
  }

  loadTable(tableName) {
    const filePath = path.join(this.dataDir, `${tableName}.json`);
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(`[LocalDB] 加载 ${tableName}.json 失败: ${e.message}`);
    }
    return [];
  }

  saveTable(tableName, data) {
    const filePath = path.join(this.dataDir, `${tableName}.json`);
    try {
      // 写入临时文件再重命名，保证原子性
      const tmpPath = filePath + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmpPath, filePath);
    } catch (e) {
      console.error(`[LocalDB] 保存 ${tableName}.json 失败: ${e.message}`);
    }
  }
}

/**
 * LocalSequelize — Sequelize 兼容类
 */
class LocalSequelize {
  constructor() {
    this.models = {};
    this.store = new DataStore(DATA_DIR);
  }

  define(modelName, attributes, options = {}) {
    const model = new LocalModel(modelName, attributes, options, this.store);
    this.models[modelName] = model;

    // 返回的模型对象也需要同步保存
    const syncable = {
      ...model,
      // 暴露关键属性供关联查询使用
      name: model.name,
      tableName: model.tableName,
      primaryKey: model.primaryKey,
      _records: model._records,
      getAll: model.getAll.bind(model),
      _belongsTo: model._belongsTo,
      _hasMany: model._hasMany,
      // Sequelize 兼容方法
      sync: async () => {},
      belongsTo: (target, opts) => model.belongsTo(target, opts),
      hasMany: (target, opts) => model.hasMany(target, opts),
      // 暴露 findAll 等方法
      findAll: (...args) => model.findAll(...args),
      findOne: (...args) => model.findOne(...args),
      findByPk: (...args) => model.findByPk(...args),
      findAndCountAll: (...args) => model.findAndCountAll(...args),
      findOrCreate: (...args) => model.findOrCreate(...args),
      create: (...args) => model.create(...args),
      bulkCreate: (...args) => model.bulkCreate(...args),
      update: (...args) => model.update(...args),
      destroy: (...args) => model.destroy(...args),
      count: (...args) => model.count(...args),
      increment: (...args) => model.increment(...args),
      decrement: (...args) => model.decrement(...args),
      sum: (...args) => model.sum(...args),
      max: (...args) => model.max(...args),
      min: (...args) => model.min(...args),
    };

    this.models[modelName] = syncable;
    return syncable;
  }

  async authenticate() {
    console.log('✅ 本地数据源已就绪');
    return Promise.resolve();
  }

  async sync() {
    console.log('✅ 本地数据源同步完成');
    return Promise.resolve();
  }

  authenticateWithRetry() {
    return this.authenticate();
  }
}

module.exports = { LocalSequelize, Op };
