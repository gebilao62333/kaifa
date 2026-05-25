const STORAGE_KEY = 'notification_list'

const NOTIFICATION_TYPES = {
  ORDER: 'order',
  GIFT: 'gift',
  SYSTEM: 'system',
  ACTIVITY: 'activity',
  RESERVE: 'reserve',
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment'
}

const notificationListeners = new Set()

let notificationList = []
let unreadCount = 0

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      notificationList = JSON.parse(data)
      unreadCount = notificationList.filter(n => !n.isRead).length
    }
  } catch {
    notificationList = []
    unreadCount = 0
  }
}

const saveToStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notificationList))
}

const notifyListeners = () => {
  notificationListeners.forEach(cb => cb({
    list: [...notificationList],
    unreadCount
  }))
}

export const notificationService = {
  init() {
    loadFromStorage()
    return this
  },

  getList() {
    return [...notificationList]
  },

  getUnreadCount() {
    return unreadCount
  },

  add(notification) {
    const newNotice = {
      id: Date.now(),
      type: notification.type || NOTIFICATION_TYPES.SYSTEM,
      title: notification.title || '',
      content: notification.content || '',
      createTime: Date.now(),
      isRead: false,
      ...notification
    }
    notificationList.unshift(newNotice)
    unreadCount++
    saveToStorage()
    notifyListeners()
    return newNotice
  },

  addOrderNotice(orderInfo) {
    return this.add({
      type: NOTIFICATION_TYPES.ORDER,
      title: '订单完成提醒',
      content: `您有一笔订单已完成，请及时评价`,
      orderId: orderInfo.orderId
    })
  },

  addGiftNotice(giftInfo) {
    return this.add({
      type: NOTIFICATION_TYPES.GIFT,
      title: '收到礼物',
      content: `${giftInfo.fromName || '好友'}送给您${giftInfo.count || 1}个${giftInfo.name || '礼物'}`,
      giftId: giftInfo.giftId
    })
  },

  addReserveNotice(reserveInfo) {
    const statusText = {
      confirmed: '已确认',
      rejected: '已拒绝',
      cancelled: '已取消',
      completed: '已完成'
    }
    return this.add({
      type: NOTIFICATION_TYPES.RESERVE,
      title: '预约通知',
      content: `${reserveInfo.companionName || '陪玩师'}的预约${statusText[reserveInfo.status] || '已更新'}`,
      reserveId: reserveInfo.reserveId
    })
  },

  addSystemNotice(title, content) {
    return this.add({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: title || '系统通知',
      content: content || ''
    })
  },

  addActivityNotice(activityInfo) {
    return this.add({
      type: NOTIFICATION_TYPES.ACTIVITY,
      title: '活动提醒',
      content: activityInfo.content || '新的活动已上线，快来参与吧',
      activityId: activityInfo.activityId
    })
  },

  addFollowNotice(followInfo) {
    return this.add({
      type: NOTIFICATION_TYPES.FOLLOW,
      title: '新粉丝',
      content: `${followInfo.fromName || '用户'}关注了您`
    })
  },

  addLikeNotice(likeInfo) {
    return this.add({
      type: NOTIFICATION_TYPES.LIKE,
      title: '收到赞',
      content: `${likeInfo.fromName || '用户'}赞了您的${likeInfo.target || '动态'}`
    })
  },

  addCommentNotice(commentInfo) {
    return this.add({
      type: NOTIFICATION_TYPES.COMMENT,
      title: '收到评论',
      content: `${commentInfo.fromName || '用户'}评论了您的${commentInfo.target || '动态'}：${commentInfo.content || ''}`
    })
  },

  markAsRead(noticeId) {
    const notice = notificationList.find(n => n.id === noticeId)
    if (notice && !notice.isRead) {
      notice.isRead = true
      unreadCount = Math.max(0, unreadCount - 1)
      saveToStorage()
      notifyListeners()
    }
  },

  markAllAsRead() {
    notificationList.forEach(n => { n.isRead = true })
    unreadCount = 0
    saveToStorage()
    notifyListeners()
  },

  remove(noticeId) {
    const index = notificationList.findIndex(n => n.id === noticeId)
    if (index > -1) {
      if (!notificationList[index].isRead) {
        unreadCount = Math.max(0, unreadCount - 1)
      }
      notificationList.splice(index, 1)
      saveToStorage()
      notifyListeners()
    }
  },

  clearAll() {
    notificationList = []
    unreadCount = 0
    localStorage.removeItem(STORAGE_KEY)
    notifyListeners()
  },

  subscribe(callback) {
    notificationListeners.add(callback)
    callback({ list: [...notificationList], unreadCount })
    return () => notificationListeners.delete(callback)
  },

  generateDemoData() {
    const demos = [
      {
        type: NOTIFICATION_TYPES.ORDER,
        title: '订单完成提醒',
        content: '您有一笔线上陪玩订单已完成，请及时评价',
        createTime: Date.now() - 1800000
      },
      {
        type: NOTIFICATION_TYPES.GIFT,
        title: '收到礼物',
        content: '小雪送给您一个爱心礼物',
        createTime: Date.now() - 3600000
      },
      {
        type: NOTIFICATION_TYPES.RESERVE,
        title: '预约已确认',
        content: '您预约的阿杰已确认，请按时上线',
        createTime: Date.now() - 7200000
      },
      {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'VIP升级通知',
        content: '恭喜您升级为VIP会员，享受更多特权',
        createTime: Date.now() - 86400000
      },
      {
        type: NOTIFICATION_TYPES.ACTIVITY,
        title: '周末活动',
        content: '周末开黑活动即将开始，组队参与赢取限定皮肤',
        createTime: Date.now() - 172800000
      }
    ]

    demos.forEach((demo, i) => {
      const exists = notificationList.some(n => n.title === demo.title && n.content === demo.content)
      if (!exists) {
        notificationList.push({
          id: Date.now() - i * 1000,
          ...demo,
          isRead: false
        })
        unreadCount++
      }
    })

    notificationList.sort((a, b) => b.createTime - a.createTime)
    saveToStorage()
    notifyListeners()
    return { list: [...notificationList], unreadCount }
  }
}
