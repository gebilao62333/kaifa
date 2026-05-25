const { giftService } = require('../services');
const response = require('../utils/response');

const getGiftList = async (req, res) => {
  try {
    const { type } = req.query;
    const result = await giftService.getGiftList(type !== undefined ? parseInt(type) : null);
    response.success(res, result);
  } catch (error) {
    console.error('获取礼物列表错误:', error);
    response.error(res, error.message);
  }
};

const sendGift = async (req, res) => {
  try {
    const { receiverId, giftId, roomId } = req.body;
    
    if (!receiverId || !giftId) {
      return response.badRequest(res, '接收者和礼物ID不能为空');
    }
    
    const result = await giftService.sendGift(
      req.userId,
      parseInt(receiverId),
      parseInt(giftId),
      roomId ? parseInt(roomId) : 0
    );
    response.success(res, result, '赠送成功');
  } catch (error) {
    console.error('赠送礼物错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getGiftBag = async (req, res) => {
  try {
    const result = await giftService.getGiftBag(req.userId);
    response.success(res, result);
  } catch (error) {
    console.error('获取背包错误:', error);
    response.error(res, error.message);
  }
};

const withdraw = async (req, res) => {
  try {
    const { money, type, bankInfo } = req.body;

    if (!money || money <= 0) {
      return response.badRequest(res, '提现金额必须大于0');
    }

    const result = await giftService.withdraw(req.userId, parseFloat(money), parseInt(type) || 1, bankInfo);
    response.success(res, result, '提现申请已提交');
  } catch (error) {
    console.error('提现错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getWithdrawList = async (req, res) => {
  try {
    const { isCheck, page, pageSize } = req.query;
    
    const mockWithdraws = [
      {
        id: 1,
        user_id: 1001,
        nickname: '张三',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1001',
        amount: 100,
        type: 1,
        account: 'zhangsan@alipay.com',
        real_name: '张三',
        status: 0,
        is_check: 0,
        create_time: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        user_id: 1002,
        nickname: '李四',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1002',
        amount: 200,
        type: 2,
        account: 'lisi@wechat.com',
        real_name: '李四',
        status: 1,
        is_check: 1,
        create_time: '2024-01-01 11:00:00'
      },
      {
        id: 3,
        user_id: 1003,
        nickname: '王五',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1003',
        amount: 150,
        type: 3,
        account: '****1234',
        real_name: '王五',
        status: 2,
        is_check: 2,
        create_time: '2024-01-01 12:00:00'
      },
      {
        id: 4,
        user_id: 1004,
        nickname: '赵六',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1004',
        amount: 300,
        type: 1,
        account: 'zhaoliu@alipay.com',
        real_name: '赵六',
        status: 0,
        is_check: 0,
        create_time: '2024-01-01 13:00:00'
      },
      {
        id: 5,
        user_id: 1005,
        nickname: '孙七',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1005',
        amount: 500,
        type: 2,
        account: 'sunqi@wechat.com',
        real_name: '孙七',
        status: 1,
        is_check: 1,
        create_time: '2024-01-01 14:00:00'
      }
    ];
    
    let filtered = [...mockWithdraws];
    
    if (isCheck !== undefined) {
      filtered = filtered.filter(w => w.is_check === parseInt(isCheck));
    }
    
    const total = filtered.length;
    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 20;
    const start = (pageNum - 1) * size;
    const end = start + size;
    const list = filtered.slice(start, end);
    
    response.success(res, {
      list,
      pagination: {
        page: pageNum,
        pageSize: size,
        total,
        totalPages: Math.ceil(total / size)
      }
    });
  } catch (error) {
    console.error('获取提现列表错误:', error);
    response.error(res, error.message);
  }
};

const approveWithdraw = async (req, res) => {
  try {
    const { withdrawId, transferBatchNo } = req.body;

    if (!withdrawId) {
      return response.badRequest(res, '提现记录ID不能为空');
    }

    const result = await giftService.approveWithdraw(parseInt(withdrawId), req.userId, transferBatchNo);
    response.success(res, result, '提现审核通过');
  } catch (error) {
    console.error('审核提现错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const rejectWithdraw = async (req, res) => {
  try {
    const { withdrawId, reason } = req.body;

    if (!withdrawId) {
      return response.badRequest(res, '提现记录ID不能为空');
    }

    const result = await giftService.rejectWithdraw(parseInt(withdrawId), req.userId, reason);
    response.success(res, result, '提现申请已拒绝');
  } catch (error) {
    console.error('拒绝提现错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const sendRedPacket = async (req, res) => {
  try {
    const { type = 0, totalAmount, totalNum, roomId } = req.body;
    
    if (!totalAmount || !totalNum) {
      return response.badRequest(res, '红包金额和个数不能为空');
    }
    
    const result = await giftService.sendRedPacket(
      req.userId,
      parseInt(type),
      parseFloat(totalAmount),
      parseInt(totalNum),
      roomId ? parseInt(roomId) : 0
    );
    response.success(res, result, '红包已发送');
  } catch (error) {
    console.error('发送红包错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const receiveRedPacket = async (req, res) => {
  try {
    const { packetNo } = req.body;
    
    if (!packetNo) {
      return response.badRequest(res, '红包编号不能为空');
    }
    
    const result = await giftService.receiveRedPacket(req.userId, packetNo);
    response.success(res, result, '领取成功');
  } catch (error) {
    console.error('领取红包错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getRedPacketHistory = async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    const result = await giftService.getRedPacketHistory(req.userId, type);
    response.success(res, result);
  } catch (error) {
    console.error('获取红包记录错误:', error);
    response.error(res, error.message);
  }
};

module.exports = {
  getGiftList,
  sendGift,
  getGiftBag,
  withdraw,
  getWithdrawList,
  approveWithdraw,
  rejectWithdraw,
  sendRedPacket,
  receiveRedPacket,
  getRedPacketHistory
};
