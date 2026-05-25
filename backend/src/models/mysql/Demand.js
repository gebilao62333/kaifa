const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Demand = sequelize.define('xn_demand', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false, comment: '发布用户ID' },
    service_type: { type: DataTypes.STRING(20), allowNull: false, comment: '服务类型 online/offline' },
    game_id: { type: DataTypes.INTEGER, allowNull: false, comment: '游戏ID' },
    game_name: { type: DataTypes.STRING(50), allowNull: false, comment: '游戏名称' },
    date: { type: DataTypes.DATEONLY, allowNull: false, comment: '预约日期' },
    start_time: { type: DataTypes.TIME, allowNull: false, comment: '开始时间' },
    end_time: { type: DataTypes.TIME, allowNull: false, comment: '结束时间' },
    duration: { type: DataTypes.INTEGER, defaultValue: 0, comment: '服务时长(小时)' },
    budget: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, comment: '预算金额（金币）' },
    remark: { type: DataTypes.STRING(200), allowNull: true, comment: '备注说明' },
    offline_location: { type: DataTypes.STRING(100), allowNull: true, comment: '线下地点' },
    gender: { type: DataTypes.STRING(10), allowNull: true, comment: '陪玩师性别偏好' },
    age_start: { type: DataTypes.INTEGER, allowNull: true, comment: '年龄下限' },
    age_end: { type: DataTypes.INTEGER, allowNull: true, comment: '年龄上限' },
    tags: { type: DataTypes.TEXT, allowNull: true, comment: '标签JSON数组' },
    status: { type: DataTypes.STRING(20), defaultValue: 'active', comment: '状态 active/matched/completed/cancelled' },
    create_time: { type: DataTypes.INTEGER(10), defaultValue: () => Math.floor(Date.now() / 1000), comment: '创建时间' },
    update_time: { type: DataTypes.INTEGER(10), defaultValue: () => Math.floor(Date.now() / 1000), comment: '更新时间' }
  }, {
    tableName: 'xn_demand',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['create_time'] },
      { fields: ['game_id'] }
    ]
  });

  return Demand;
};
