const express = require('express')
const router = express.Router()
const { getPublicPlatforms, redirectDownload } = require('../controllers/download')

// 公开下载信息（供官网/落地页读取），需放在 /:platform 之前以优先匹配
router.get('/platforms', getPublicPlatforms)

// 按平台跳转下载：/api/download/ios | /api/download/android | /api/download/harmony
router.get('/:platform', redirectDownload)

module.exports = router
