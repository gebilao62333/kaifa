const { getRedisClient } = require('../config/redis');
const config = require('../config');

const SMS_COOLDOWN = 60;
const SMS_EXPIRE = 300;

const sendSMS = async (mobile, templateId = 1) => {
  const redis = getRedisClient();
  
  if (!redis) {
    throw new Error('短信服务不可用');
  }
  
  const cooldownKey = `sms:cooldown:${mobile}`;
  const exists = await redis.get(cooldownKey);
  
  if (exists) {
    throw new Error('发送过于频繁，请稍后再试');
  }
  
  const code = Math.random().toString().substr(2, 6);
  const codeKey = `sms:code:${mobile}`;
  
  await redis.setEx(codeKey, SMS_EXPIRE, code);
  await redis.setEx(cooldownKey, SMS_COOLDOWN, '1');
  
  console.log(`[SMS] 验证码已发送至 ${mobile}: ${code}`);
  
  if (config.nodeEnv === 'production' && config.sms.appId) {
    return await sendViaTencentCloud(mobile, code, templateId);
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
    TemplateId: config.sms.templateId || '123456',
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
    console.error('[SMS] 腾讯云短信发送失败:', error);
    throw new Error('短信发送失败，请稍后重试');
  }
};

const verifyCode = async (mobile, code) => {
  const redis = getRedisClient();
  
  if (!redis) {
    throw new Error('短信服务不可用');
  }
  
  const codeKey = `sms:code:${mobile}`;
  const storedCode = await redis.get(codeKey);
  
  if (!storedCode) {
    throw new Error('验证码已过期');
  }
  
  if (storedCode !== code) {
    throw new Error('验证码错误');
  }
  
  await redis.del(codeKey);
  
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
  
  console.log(`[SMS] 通知已发送至 ${mobile}: ${message}`);
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
    TemplateId: config.sms.notifyTemplateId || '123457',
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
    console.error('[SMS] 腾讯云通知发送失败:', error);
    throw new Error('通知发送失败，请稍后重试');
  }
};

module.exports = {
  sendSMS,
  verifyCode,
  sendNotification
};