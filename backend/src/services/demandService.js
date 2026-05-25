const { Demand } = require('../models');
const { Op } = require('sequelize');

const createDemand = async (userId, serviceType, game, date, startTime, endTime, duration, budget, remark = '', offlineLocation = '') => {
  const demand = await Demand.create({
    user_id: userId,
    service_type: serviceType,
    game_name: game,
    date,
    start_time: startTime,
    end_time: endTime,
    duration,
    budget,
    remark,
    offline_location: offlineLocation,
    status: 'active',
    create_time: Math.floor(Date.now() / 1000),
    update_time: Math.floor(Date.now() / 1000)
  });
  
  return {
    demandId: demand.id,
    userId: demand.user_id,
    serviceType: demand.service_type,
    game: demand.game_name,
    date: demand.date,
    startTime: demand.start_time,
    endTime: demand.end_time,
    duration: demand.duration,
    budget: demand.budget,
    remark: demand.remark,
    offlineLocation: demand.offline_location,
    status: demand.status,
    createTime: demand.create_time
  };
};

const getDemandList = async (userId, page, pageSize) => {
  const offset = (page - 1) * pageSize;
  
  const { rows: demands, count: total } = await Demand.findAndCountAll({
    where: { user_id: userId },
    order: [['create_time', 'DESC']],
    limit: pageSize,
    offset
  });
  
  return {
    list: demands.map(d => ({
      demandId: d.id,
      userId: d.user_id,
      serviceType: d.service_type,
      game: d.game_name,
      date: d.date,
      startTime: d.start_time,
      endTime: d.end_time,
      duration: d.duration,
      budget: d.budget,
      remark: d.remark,
      offlineLocation: d.offline_location,
      status: d.status,
      createTime: d.create_time
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

const getDemandDetail = async (demandId) => {
  const demand = await Demand.findByPk(demandId);
  
  if (!demand) {
    throw new Error('需求不存在');
  }
  
  return {
    demandId: demand.id,
    userId: demand.user_id,
    serviceType: demand.service_type,
    gameId: demand.game_id,
    game: demand.game_name,
    date: demand.date,
    startTime: demand.start_time,
    endTime: demand.end_time,
    duration: demand.duration,
    budget: demand.budget,
    remark: demand.remark,
    offlineLocation: demand.offline_location,
    gender: demand.gender,
    ageStart: demand.age_start,
    ageEnd: demand.age_end,
    tags: demand.tags ? JSON.parse(demand.tags) : [],
    status: demand.status,
    createTime: demand.create_time,
    updateTime: demand.update_time
  };
};

const cancelDemand = async (userId, demandId) => {
  const demand = await Demand.findOne({
    where: {
      id: demandId,
      user_id: userId
    }
  });
  
  if (!demand) {
    throw new Error('需求不存在或无权操作');
  }
  
  if (demand.status !== 'active') {
    throw new Error('该需求状态不允许取消');
  }
  
  await demand.update({
    status: 'cancelled',
    update_time: Math.floor(Date.now() / 1000)
  });
  
  return {
    demandId: demand.id,
    status: 'cancelled'
  };
};

module.exports = {
  createDemand,
  getDemandList,
  getDemandDetail,
  cancelDemand
};
