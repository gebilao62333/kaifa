const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');

// 日志脱敏：138****8000
const maskMobile = (mobile) => String(mobile || '').replace(/^(\d{3})\d+(\d{4})$/, '$1****$2');

const SMS_COOLDOWN = 60;
const SMS_EXPIRE = 300;

// 短信模板号必须显式配置。历史实现在缺失时回落到 '123456' / '123457' 这类假模板号，
// 结果是腾讯云返回"模板不存在"，排查困难。这里改为快速失败并给出可操作的提示。
const requireSmsTemplate = (templateId, envKey, scene) => {
  if (!templateId) {
    throw new Error('短信服务未配置完整：缺少 ' + envKey + '（' + scene + '模板）');
  }
  return templateId;
};

// Redis 命令超时兜底：Redis 卡顿/断连时最多等待 2 秒，绝不挂死业务
const withRedisTimeout = (promise, ms = 2000) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

const sendSMS = async (mobile, templateId = 1) => {
  const redis = getRedisClient();
  
  if (!redis) {
    throw new Error('短信服务不可用');
  }
  
  const cooldownKey = `sms:cooldown:${mobile}`;
  const exists = await withRedisTimeout(redis.get(cooldownKey));
  
  if (exists) {
    throw new Error('发送过于频繁，请稍后再试');
  }
  
  // 验证码必须用密码学安全随机数：Math.random 可被预测/枚举
  const code = String(crypto.randomInt(100000, 1000000));
  const codeKey = `sms:code:${mobile}`;
  
  await withRedisTimeout(redis.setEx(codeKey, SMS_EXPIRE, code));
  await withRedisTimeout(redis.setEx(cooldownKey, SMS_COOLDOWN, '1'));
  
  // 验证码不得写入日志（日志会被采集/展示给运维）；非生产环境也只打印掩码
  logger.info(`[SMS] 验证码已发送至 ${maskMobile(mobile)}`);
  
  if (config.nodeEnv === 'production' && config.sms.appId) {
    return await sendViaTencentCloud(mobile, code, templateId);
  }
  
  if (config.nodeEnv === 'production') {
    // 生产环境未配置短信通道时，绝不把验证码回传给调用方
    throw new Error('短信服务未配置，请联系管理员');
  }
  
  return { success: true, code };
};

const sendViaTencentCloud = async (mobile, code, templateId) => {
  const tencentCloud = require('tencentcloud-sdk-nodejs');
  const SmsClient = tencentCloud.sms.v20210111.Client;
  
  const client = new SmsClient({
    credential: {
      secretId: config.sms.secretId,
      secretKey: config.sms.secretKey
    },
    region: 'ap-guangzhou',
    profile: {
      httpProfile: {
        endpoint: 'sms.tencentcloudapi.com'
      }
    }
  });
  
  const params = {
    PhoneNumberSet: [`+86${mobile}`],
    SmsSdkAppId: config.sms.appId,
    SignName: config.sms.sign,
    TemplateId: requireSmsTemplate(config.sms.templateId, 'SMS_TEMPLATE_ID', '验证码'),
    TemplateParamSet: [code, '5']
  };
  
  try {
    const result = await client.SendSms(params);
    if (result.SendStatusSet && result.SendStatusSet[0].Code === 'Ok') {
      return { success: true, message: '短信发送成功' };
    } else {
      throw new Error(result.SendStatusSet[0].Message || '短信发送失败');
    }
  } catch (error) {
    logger.error('[SMS] 腾讯云短信发送失败:', error);
    throw new Error('短信发送失败，请稍后重试');
  }
};

const verifyCode = async (mobile, code) => {
  const redis = getRedisClient();
  
  if (!redis) {
    throw new Error('短信服务不可用');
  }
  
  const codeKey = `sms:code:${mobile}`;
  const storedCode = await withRedisTimeout(redis.get(codeKey));
  
  if (!storedCode) {
    throw new Error('验证码已过期');
  }
  
  if (storedCode !== code) {
    throw new Error('验证码错误');
  }
  
  await withRedisTimeout(redis.del(codeKey));
  
  return true;
};

const sendNotification = async (mobile, message) => {
  const redis = getRedisClient();
  
  if (!redis) {
    throw new Error('短信服务不可用');
  }
  
  if (config.nodeEnv === 'production' && config.sms.appId) {
    return await sendNotificationViaTencentCloud(mobile, message);
  }
  
  logger.info(`[SMS] 通知已发送至 ${mobile}: ${message}`);
  return { success: true };
};

const sendNotificationViaTencentCloud = async (mobile, message) => {
  const tencentCloud = require('tencentcloud-sdk-nodejs');
  const SmsClient = tencentCloud.sms.v20210111.Client;
  
  const client = new SmsClient({
    credential: {
      secretId: config.sms.secretId,
      secretKey: config.sms.secretKey
    },
    region: 'ap-guangzhou',
    profile: {
      httpProfile: {
        endpoint: 'sms.tencentcloudapi.com'
      }
    }
  });
  
  const params = {
    PhoneNumberSet: [`+86${mobile}`],
    SmsSdkAppId: config.sms.appId,
    SignName: config.sms.sign,
    TemplateId: requireSmsTemplate(config.sms.notifyTemplateId, 'SMS_NOTIFY_TEMPLATE_ID', '通知'),
    TemplateParamSet: [message]
  };
  
  try {
    const result = await client.SendSms(params);
    if (result.SendStatusSet && result.SendStatusSet[0].Code === 'Ok') {
      return { success: true, message: '通知发送成功' };
    } else {
      throw new Error(result.SendStatusSet[0].Message || '通知发送失败');
    }
  } catch (error) {
    logger.error('[SMS] 腾讯云通知发送失败:', error);
    throw new Error('通知发送失败，请稍后重试');
  }
};

module.exports = {
  sendSMS,
  verifyCode,
  sendNotification
};