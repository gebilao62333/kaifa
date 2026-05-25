const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const field of schema.required || []) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        errors.push(`${field}是必填字段`);
      }
    }
    
    for (const [field, rules] of Object.entries(schema.fields || {})) {
      const value = req.body[field];
      
      if (value !== undefined && value !== null && value !== '') {
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`${field}必须是字符串`);
        } else if (rules.type === 'number' && typeof value !== 'number') {
          errors.push(`${field}必须是数字`);
        } else if (rules.type === 'integer' && !Number.isInteger(value)) {
          errors.push(`${field}必须是整数`);
        } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${field}必须是布尔值`);
        }
        
        if (rules.minLength !== undefined && typeof value === 'string' && value.length < rules.minLength) {
          errors.push(`${field}长度不能少于${rules.minLength}个字符`);
        }
        
        if (rules.maxLength !== undefined && typeof value === 'string' && value.length > rules.maxLength) {
          errors.push(`${field}长度不能超过${rules.maxLength}个字符`);
        }
        
        if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
          errors.push(`${field}不能小于${rules.min}`);
        }
        
        if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
          errors.push(`${field}不能大于${rules.max}`);
        }
        
        if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
          errors.push(`${field}格式不正确`);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        code: 400,
        message: errors.join('；')
      });
    }
    
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema.fields || {})) {
      const value = req.query[field];
      
      if (value !== undefined && value !== null) {
        if (rules.type === 'number' || rules.type === 'integer') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors.push(`${field}必须是有效的数字`);
          } else if (rules.type === 'integer' && !Number.isInteger(numValue)) {
            errors.push(`${field}必须是整数`);
          } else {
            req.query[field] = numValue;
          }
        }
        
        if (rules.min !== undefined && Number(value) < rules.min) {
          errors.push(`${field}不能小于${rules.min}`);
        }
        
        if (rules.max !== undefined && Number(value) > rules.max) {
          errors.push(`${field}不能大于${rules.max}`);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        code: 400,
        message: errors.join('；')
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  validateQuery
};
