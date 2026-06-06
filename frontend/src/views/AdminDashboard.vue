<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>管理后台</h2>
      </div>
      <nav class="menu">
        <a href="/admin/dashboard" :class="['menu-item', { active: currentPage === 'dashboard' }]">
          <span class="menu-icon">📊</span> 控制台
        </a>
        <a href="/admin/users" :class="['menu-item', { active: currentPage === 'users' }]">
          <span class="menu-icon">👥</span> 用户管理
        </a>
        <a href="/admin/recommend" :class="['menu-item', { active: currentPage === 'recommend' }]">
          <span class="menu-icon">🌟</span> 热门推荐
        </a>
        <a href="/admin/orders" :class="['menu-item', { active: currentPage === 'orders' }]">
          <span class="menu-icon">📦</span> 订单管理
        </a>
        <a href="/admin/withdraws" :class="['menu-item', { active: currentPage === 'withdraws' }]">
          <span class="menu-icon">💰</span> 提现管理
        </a>
        <a href="/admin/posts" :class="['menu-item', { active: currentPage === 'posts' }]">
          <span class="menu-icon">📝</span> 帖子管理
        </a>
        <a href="/admin/reports" :class="['menu-item', { active: currentPage === 'reports' }]">
          <span class="menu-icon">⚠️</span> 举报管理
        </a>
        <a href="/admin/banners" :class="['menu-item', { active: currentPage === 'banners' }]">
          <span class="menu-icon">🎪</span> Banner管理
        </a>
        <a href="/admin/vip-packages" :class="['menu-item', { active: currentPage === 'vip-packages' }]">
          <span class="menu-icon">⭐</span> VIP套餐管理
        </a>
        <a href="/admin/gift-management" :class="['menu-item', { active: currentPage === 'gift-management' }]">
          <span class="menu-icon">🎁</span> 礼物管理
        </a>
        <a href="/admin/gifts" :class="['menu-item', { active: currentPage === 'gifts' }]">
          <span class="menu-icon">📜</span> 礼物记录
        </a>
        <a href="/admin/recharges" :class="['menu-item', { active: currentPage === 'recharges' }]">
          <span class="menu-icon">💳</span> 充值记录
        </a>
        <a href="/admin/games" :class="['menu-item', { active: currentPage === 'games' }]">
          <span class="menu-icon">🎮</span> 服务分类
        </a>
        <a href="/admin/companion-applications" :class="['menu-item', { active: currentPage === 'companion-applications' }]">
          <span class="menu-icon">📋</span> 服务申请管理
        </a>
        <a href="/admin/virtual-users" :class="['menu-item', { active: currentPage === 'virtual-users' }]">
          <span class="menu-icon">🤖</span> 虚拟机器人管理
        </a>
        <a href="/admin/admins" :class="['menu-item', { active: currentPage === 'admins' }]">
          <span class="menu-icon">👨‍💼</span> 管理员管理
        </a>
        <a href="/admin/roles" :class="['menu-item', { active: currentPage === 'roles' }]">
          <span class="menu-icon">🔑</span> 角色管理
        </a>
        <a href="/admin/api" :class="['menu-item', { active: currentPage === 'api' }]">
          <span class="menu-icon">🔌</span> 接口管理
        </a>
        <a href="/admin/settings" :class="['menu-item', { active: currentPage === 'settings' }]">
          <span class="menu-icon">⚙️</span> 系统设置
        </a>
      </nav>
    </aside>

    <main class="main-content">
      <div class="top-bar">
        <div class="title">
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="user-info">
          <button @click="handleLogout" class="logout-btn">退出登录</button>
        </div>
      </div>

      <div class="content">
        <!-- 控制台 -->
        <div v-if="currentPage === 'dashboard'" class="dashboard">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <div class="stat-value">1,234</div>
                <div class="stat-label">注册用户</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📦</div>
              <div class="stat-info">
                <div class="stat-value">567</div>
                <div class="stat-label">今日订单</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <div class="stat-info">
                <div class="stat-value">89,012 金币</div>
                <div class="stat-label">今日收入</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💬</div>
              <div class="stat-info">
                <div class="stat-value">2,345</div>
                <div class="stat-label">今日消息</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⚠️</div>
              <div class="stat-info">
                <div class="stat-value">89</div>
                <div class="stat-label">待处理举报</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 用户管理 -->
        <div v-if="currentPage === 'users'" class="user-list">
          <div class="page-header">
            <h2>用户管理</h2>
            <button @click="openCreateUserAccountModal" class="add-btn">添加用户</button>
          </div>
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索用户昵称或手机号" class="search-input" />
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="0">正常</option>
              <option value="1">禁用</option>
            </select>
            <button @click="loadUsers" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>头像</th>
                <th>昵称</th>
                <th>手机号</th>
                <th>邮箱</th>
                <th>性别</th>
                <th>等级</th>
                <th>VIP等级</th>
                <th>金币</th>
                <th>城市</th>
                <th>状态</th>
                <th>注册时间</th>
                <th>最后登录</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in userList" :key="user.userId">
                <td>{{ user.userId }}</td>
                <td>
                  <img v-if="user.avatar" :src="user.avatar" class="user-avatar" />
                  <span v-else class="avatar-placeholder">👤</span>
                </td>
                <td>{{ user.nickname }}</td>
                <td>{{ user.phone || '-' }}</td>
                <td>{{ user.email || '-' }}</td>
                <td>{{ user.sex === 1 ? '男' : user.sex === 2 ? '女' : '未知' }}</td>
                <td>Lv.{{ user.lv || 1 }}</td>
                <td>{{ user.vip ? 'VIP'+user.vipLv : '-' }}</td>
                <td>{{ user.money || 0 }} 金币</td>
                <td>{{ user.city || '-' }}</td>
                <td>
                  <span :class="['status-badge', user.status === 0 ? 'active' : 'disabled']">
                    {{ user.status === 0 ? '正常' : '禁用' }}
                  </span>
                </td>
                <td>{{ formatTime(user.createTime) }}</td>
                <td>{{ user.lastLoginTime ? formatTime(user.lastLoginTime) : '-' }}</td>
                <td>
                  <button @click="viewUser(user)" class="action-btn">查看</button>
                  <button @click="editUserAccount(user)" class="action-btn">编辑</button>
                  <button @click="toggleUserStatus(user)" class="action-btn">
                    {{ user.status === 0 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteUserAccount(user)" class="action-btn delete-btn">删除</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 热门推荐 -->
        <div v-if="currentPage === 'recommend'" class="recommend-page">
          <div class="page-header">
            <h2>热门推荐</h2>
            <button @click="syncRecommendToApi" class="add-btn">保存到服务器</button>
          </div>

          <div class="recommend-tabs">
            <div :class="['recommend-tab', { active: recommendTab === 'system' }]" @click="recommendTab = 'system'">系统推荐</div>
            <div :class="['recommend-tab', { active: recommendTab === 'manual' }]" @click="recommendTab = 'manual'">手动管理</div>
            <div :class="['recommend-tab', { active: recommendTab === 'preview' }]" @click="recommendTab = 'preview'">推荐预览</div>
          </div>

          <!-- 系统推荐 -->
          <div v-if="recommendTab === 'system'" class="recommend-section">
            <h3 class="section-title">系统推荐用户</h3>
            <p class="section-desc">根据用户活跃度、点赞数和关注度自动推荐，点击"推荐"一键加入手动推荐列表</p>
            <table class="data-table">
              <thead>
                <tr>
                  <th>排序</th>
                  <th>ID</th>
                  <th>头像</th>
                  <th>昵称</th>
                  <th>综合评分</th>
                  <th>点赞数</th>
                  <th>粉丝数</th>
                  <th>活跃度</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, idx) in recommendList" :key="user.userId">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ user.userId }}</td>
                  <td>
                    <img v-if="user.avatar" :src="user.avatar" class="user-avatar" />
                    <span v-else class="avatar-placeholder">👤</span>
                  </td>
                  <td>{{ user.nickname }}</td>
                  <td>
                    <span class="score-badge">{{ getRecommendScore(user) }}</span>
                  </td>
                  <td>{{ user.likeCount || user.likes || 0 }}</td>
                  <td>{{ user.followerCount || user.followers || 0 }}</td>
                  <td>{{ user.activityScore || user.score || '-' }}</td>
                  <td>
                    <span :class="['status-badge', user.vip ? 'approved' : '']">
                      {{ user.vip ? 'VIP' : '-' }}
                    </span>
                  </td>
                  <td>
                    <button @click="addToManualRecommend(user)" class="action-btn" :disabled="isAlreadyRecommended(user.userId)" :title="isAlreadyRecommended(user.userId) ? '已添加' : '加入推荐'">
                      {{ isAlreadyRecommended(user.userId) ? '已添加' : '推荐' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="recommendList.length === 0" class="empty-hint">
              <p>暂无系统推荐用户数据</p>
            </div>
          </div>

          <!-- 手动管理 -->
          <div v-if="recommendTab === 'manual'" class="recommend-section">
            <h3 class="section-title">手动设置推荐</h3>
            <p class="section-desc">通过用户ID手动添加推荐用户，可拖拽排序</p>
            <div class="add-recommend-form">
              <input v-model="newRecommendUserId" type="number" placeholder="请输入要推荐的用户ID" class="form-input" />
              <button @click="addManualRecommendUser" class="add-btn" :disabled="!newRecommendUserId">添加推荐</button>
              <span class="form-hint">输入已注册的用户ID，系统自动获取昵称和头像</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:50px">排序</th>
                  <th style="width:50px">置顶</th>
                  <th>头像</th>
                  <th>昵称</th>
                  <th>用户ID</th>
                  <th>添加时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, idx) in manualRecommendList" :key="user.userId || idx">
                  <td>
                    <div class="sort-controls">
                      <button @click="moveRecommendUp(idx)" :disabled="idx === 0" class="sort-btn" title="上移">↑</button>
                      <span class="sort-num">{{ idx + 1 }}</span>
                      <button @click="moveRecommendDown(idx)" :disabled="idx === manualRecommendList.length - 1" class="sort-btn" title="下移">↓</button>
                    </div>
                  </td>
                  <td>
                    <button @click="toggleRecommendTop(user)" :class="['top-btn', { active: user.isTop }]" :title="user.isTop ? '取消置顶' : '置顶'">
                      {{ user.isTop ? '📌' : '📍' }}
                    </button>
                  </td>
                  <td>
                    <img v-if="user.avatar" :src="user.avatar" class="user-avatar" />
                    <span v-else class="avatar-placeholder">👤</span>
                  </td>
                  <td>{{ user.nickname || '用户' + user.userId }}</td>
                  <td>{{ user.userId }}</td>
                  <td>{{ formatTime(user.createTime) }}</td>
                  <td>
                    <button @click="removeManualRecommend(user, idx)" class="action-btn delete-btn">移除</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="manualRecommendList.length === 0" class="empty-hint">
              <p>暂无手动设置的推荐用户，请在"系统推荐"中一键添加或使用"添加推荐"输入用户ID</p>
            </div>
          </div>

          <!-- 推荐预览 -->
          <div v-if="recommendTab === 'preview'" class="recommend-section">
            <h3 class="section-title">推荐预览</h3>
            <p class="section-desc">已在推荐列表中的用户，将在首页推荐位展示</p>
            <div class="preview-list">
              <div v-for="(user, idx) in mergedRecommendList" :key="user.userId" class="preview-card">
                <div class="preview-rank">{{ idx + 1 }}</div>
                <img :src="user.avatar" class="preview-avatar" />
                <div class="preview-info">
                  <div class="preview-name">
                    {{ user.nickname }}
                    <span v-if="user.isTop" class="top-badge">置顶</span>
                  </div>
                  <div class="preview-meta">ID: {{ user.userId }}</div>
                </div>
                <span v-if="idx < 3" class="hot-badge">🔥 热门</span>
              </div>
            </div>
            <div v-if="mergedRecommendList.length === 0" class="empty-hint">
              <p>暂无推荐用户，请先在"系统推荐"或"手动管理"中添加</p>
            </div>
          </div>
        </div>

        <!-- 订单管理 -->
        <div v-if="currentPage === 'orders'" class="order-list">
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索订单号" class="search-input" />
            <button @click="loadOrders" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>订单内容</th>
                <th>服务类型</th>
                <th>买家</th>
                <th>陪玩师</th>
                <th>金币</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orderList" :key="order.orderId">
                <td class="order-no-cell">{{ order.orderNo }}</td>
                <td>{{ order.gameName }}</td>
                <td><span :class="['service-type-tag', 'service-type-' + (order.type || 0)]">{{ order.typeText || '线上服务' }}</span></td>
                <td>{{ order.buyerName || '用户' + order.userId }}</td>
                <td>{{ order.sellerName || '用户' + order.targetId }}</td>
                <td>{{ order.totalPrice }} 金币</td>
                <td>
                  <span :class="['order-status-badge', orderStatusClass(order.status)]">{{ orderStatusText(order.status) }}</span>
                </td>
                <td>{{ formatUnixTime(order.createTime) }}</td>
                <td>
                  <button @click="viewOrderDetail(order)" class="action-btn">详情</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 提现管理 -->
        <div v-if="currentPage === 'withdraws'" class="withdraw-list">
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索提现记录" class="search-input" />
            <button @click="loadWithdraws" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>提现ID</th>
                <th>用户</th>
                <th>金额</th>
                <th>方式</th>
                <th>状态</th>
                <th>申请时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="withdraw in withdrawList" :key="withdraw.id">
                <td>{{ withdraw.id }}</td>
                <td>{{ withdraw.userId }}</td>
                <td>{{ withdraw.amount }} 金币</td>
                <td>{{ withdraw.method }}</td>
                <td>
                  <span :class="['status-badge', withdraw.status === 0 ? 'pending' : withdraw.status === 1 ? 'approved' : 'rejected']">
                    {{ withdraw.status === 0 ? '待审核' : withdraw.status === 1 ? '已通过' : '已拒绝' }}
                  </span>
                </td>
                <td>{{ formatTime(withdraw.createTime) }}</td>
                <td>
                  <button @click="viewWithdraw(withdraw)" class="action-btn">查看</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 虚拟机器人管理 -->
        <div v-if="currentPage === 'virtual-users'" class="virtual-user-list">
          <div class="page-header">
            <h2>虚拟机器人管理</h2>
            <button @click="openCreateModal" class="add-btn">添加机器人</button>
            <button @click="openBatchModal" class="add-btn batch-btn">📦 批量添加</button>
          </div>

          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索昵称" class="search-input" />
            <button @click="loadVirtualUsers" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>头像</th>
                <th>昵称</th>
                <th>角色</th>
                <th>对话风格</th>
                <th>状态</th>
                <th>在线状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in virtualUserList" :key="user.id">
                <td>{{ user.id }}</td>
                <td>
                  <img v-if="user.avatar" :src="user.avatar" class="user-avatar-small" />
                  <span v-else>🤖</span>
                </td>
                <td>{{ user.nickname }}</td>
                <td>{{ getRoleName(user.role) }}</td>
                <td>{{ getStyleName(user.dialogueStyle) }}</td>
                <td>
                  <span :class="['status-badge', user.status === 1 ? 'active' : 'disabled']">
                    {{ user.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>
                  <span :class="['status-badge', user.isOnline === 1 ? 'active' : 'disabled']">
                    {{ user.isOnline === 1 ? '在线' : '离线' }}
                  </span>
                </td>
                <td>{{ formatTime(user.createTime) }}</td>
                <td>
                  <button @click="editUser(user)" class="action-btn">编辑</button>
                  <button @click="toggleStatus(user)" class="action-btn">
                    {{ user.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteUser(user)" class="action-btn delete-btn">删除</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 礼物管理 -->
        <div v-if="currentPage === 'gift-management'" class="gift-list">
          <div class="page-header">
            <h2>礼物管理</h2>
            <button @click="openCreateGiftModal" class="add-btn">添加礼物</button>
          </div>

          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索礼物名称" class="search-input" />
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="1">启用</option>
              <option value="0">禁用</option>
            </select>
            <button @click="loadGifts" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>图片</th>
                <th>礼物名称</th>
                <th>价格</th>
                <th>类型</th>
                <th>VIP专属</th>
                <th>排序</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="gift in giftList" :key="gift.id">
                <td>{{ gift.id }}</td>
                <td>
                  <img v-if="gift.image" :src="gift.image" class="gift-avatar" />
                  <span v-else>🎁</span>
                </td>
                <td>{{ gift.title }}</td>
                <td>{{ gift.money }} 金币</td>
                <td>{{ gift.type === 1 ? '特殊' : '普通' }}</td>
                <td>{{ gift.is_vip === 1 ? '是' : '否' }}</td>
                <td>{{ gift.sort }}</td>
                <td>
                  <span :class="['status-badge', gift.status === 1 ? 'active' : 'disabled']">
                    {{ gift.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>
                  <button @click="editGift(gift)" class="action-btn">编辑</button>
                  <button @click="toggleGiftStatus(gift)" class="action-btn">
                    {{ gift.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteGift(gift)" class="action-btn delete-btn">删除</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 礼物记录 -->
        <div v-if="currentPage === 'gifts'" class="gift-log-list">
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索用户或礼物" class="search-input" />
            <button @click="loadGiftLogs" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>赠送用户</th>
                <th>接收用户</th>
                <th>礼物</th>
                <th>数量</th>
                <th>总金额</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in giftLogList" :key="log.id">
                <td>{{ log.id }}</td>
                <td>{{ log.fromNickname || '用户' + log.fromUserId }}</td>
                <td>{{ log.toNickname || '用户' + log.toUserId }}</td>
                <td>{{ log.giftName }}</td>
                <td>{{ log.count }}</td>
                <td>{{ log.amount }} 金币</td>
                <td>{{ formatTime(log.createTime) }}</td>
                <td>
                  <button @click="viewGiftLog(log)" class="action-btn">查看</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 帖子管理 -->
        <div v-if="currentPage === 'posts'" class="post-list">
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索帖子内容" class="search-input" />
            <button @click="loadPosts" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户</th>
                <th>内容</th>
                <th>点赞数</th>
                <th>评论数</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in postList" :key="post.id">
                <td>{{ post.id }}</td>
                <td>{{ post.userId }}</td>
                <td>{{ post.content?.substring(0, 50) }}...</td>
                <td>{{ post.likeCount || 0 }}</td>
                <td>{{ post.commentCount || 0 }}</td>
                <td>{{ formatTime(post.createTime) }}</td>
                <td>
                  <button @click="viewPost(post)" class="action-btn">查看</button>
                  <button @click="deletePost(post)" class="action-btn delete-btn">删除</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 举报管理 -->
        <div v-if="currentPage === 'reports'" class="report-list">
          <div class="search-bar">
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="resolved">已处理</option>
              <option value="rejected">已驳回</option>
            </select>
            <button @click="loadReports" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>举报人</th>
                <th>举报类型</th>
                <th>举报内容</th>
                <th>原因</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in reportList" :key="report.id">
                <td>{{ report.id }}</td>
                <td>{{ report.reporterName || '用户' + report.reporterId }}</td>
                <td>{{ report.targetType === 'post' ? '帖子' : report.targetType === 'user' ? '用户' : '评论' }}</td>
                <td>{{ report.targetContent?.substring(0, 30) }}...</td>
                <td>{{ report.reason }}</td>
                <td>
                  <span :class="['status-badge', 
                    report.status === 'pending' ? 'pending' : 
                    report.status === 'resolved' ? 'approved' : 'rejected']">
                    {{ report.status === 'pending' ? '待处理' : 
                       report.status === 'resolved' ? '已处理' : '已驳回' }}
                  </span>
                </td>
                <td>{{ formatTime(report.createTime) }}</td>
                <td>
                  <button @click="viewReport(report)" class="action-btn">查看</button>
                  <button @click="handleReport(report, 'resolved')" class="action-btn">处理</button>
                  <button @click="handleReport(report, 'rejected')" class="action-btn delete-btn">驳回</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- Banner管理 -->
        <div v-if="currentPage === 'banners'" class="banner-list">
          <div class="page-header">
            <h2>Banner管理</h2>
            <button @click="openCreateBannerModal" class="add-btn">添加Banner</button>
          </div>

          <div class="search-bar">
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="1">启用</option>
              <option value="0">禁用</option>
            </select>
            <button @click="loadBanners" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>图片</th>
                <th>标题</th>
                <th>链接</th>
                <th>排序</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="banner in bannerList" :key="banner.id">
                <td>{{ banner.id }}</td>
                <td>
                  <img v-if="banner.image" :src="banner.image" class="user-avatar-small" style="width: 100px; height: 50px; object-fit: cover;" />
                  <span v-else>-</span>
                </td>
                <td>{{ banner.title }}</td>
                <td>{{ banner.link || '-' }}</td>
                <td>{{ banner.sort }}</td>
                <td>
                  <span :class="['status-badge', banner.status === 1 ? 'active' : 'disabled']">
                    {{ banner.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>{{ formatTime(banner.createTime) }}</td>
                <td>
                  <button @click="editBanner(banner)" class="action-btn">编辑</button>
                  <button @click="toggleBannerStatus(banner)" class="action-btn">
                    {{ banner.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteBanner(banner)" class="action-btn delete-btn">删除</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- VIP套餐管理 -->
        <div v-if="currentPage === 'vip-packages'" class="vip-package-list">
          <div class="page-header">
            <h2>VIP套餐管理</h2>
            <button @click="openCreateVipModal" class="add-btn">添加套餐</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>套餐名称</th>
                <th>价格</th>
                <th>原价</th>
                <th>时长(天)</th>
                <th>等级</th>
                <th>热门</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pkg in vipPackageList" :key="pkg.id">
                <td>{{ pkg.id }}</td>
                <td>{{ pkg.name }}</td>
                <td>{{ pkg.price }} 金币</td>
                <td>{{ pkg.originalPrice ? pkg.originalPrice + ' 金币' : '-' }}</td>
                <td>{{ pkg.duration }}</td>
                <td>LV{{ pkg.level }}</td>
                <td>{{ pkg.hot === 1 ? '是' : '否' }}</td>
                <td>
                  <span :class="['status-badge', pkg.status === 1 ? 'active' : 'disabled']">
                    {{ pkg.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>
                  <button @click="editVipPackage(pkg)" class="action-btn">编辑</button>
                  <button @click="toggleVipPackageStatus(pkg)" class="action-btn">
                    {{ pkg.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteVipPackage(pkg)" class="action-btn delete-btn">删除</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 充值记录 -->
        <div v-if="currentPage === 'recharges'" class="recharge-list">
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索用户ID" class="search-input" />
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="completed">已完成</option>
              <option value="pending">处理中</option>
              <option value="failed">失败</option>
            </select>
            <button @click="loadRecharges" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>订单号</th>
                <th>用户</th>
                <th>金额</th>
                <th>支付方式</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in rechargeList" :key="record.id">
                <td>{{ record.id }}</td>
                <td>{{ record.orderNo }}</td>
                <td>{{ record.userId }}</td>
                <td>{{ record.amount }} 金币</td>
                <td>{{ record.paymentMethod === 'wechat' ? '微信' : record.paymentMethod === 'alipay' ? '支付宝' : '银行卡' }}</td>
                <td>
                  <span :class="['status-badge', 
                    record.status === 'completed' ? 'approved' : 
                    record.status === 'pending' ? 'pending' : 'rejected']">
                    {{ record.status === 'completed' ? '已完成' : 
                       record.status === 'pending' ? '处理中' : '失败' }}
                  </span>
                </td>
                <td>{{ formatTime(record.createTime) }}</td>
                <td>
                  <button @click="viewRecharge(record)" class="action-btn">查看</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 服务分类 -->
        <div v-if="currentPage === 'games'" class="game-list">
          <div class="page-header">
            <h2>服务分类管理</h2>
            <button @click="openCreateGameModal" class="add-btn">添加分类</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>图标</th>
                <th>名称</th>
                <th>描述</th>
                <th>排序</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="game in gameList" :key="game.id">
                <td>{{ game.id }}</td>
                <td>
                  <img v-if="game.icon" :src="game.icon" class="user-avatar-small" />
                  <span v-else>🎮</span>
                </td>
                <td>{{ game.name }}</td>
                <td>{{ game.description }}</td>
                <td>{{ game.sort }}</td>
                <td>
                  <span :class="['status-badge', game.status === 1 ? 'active' : 'disabled']">
                    {{ game.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>{{ formatTime(game.createTime) }}</td>
                <td>
                  <button @click="editGame(game)" class="action-btn">编辑</button>
                  <button @click="toggleGameStatus(game)" class="action-btn">
                    {{ game.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteGame(game)" class="action-btn delete-btn">删除</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 服务申请管理 -->
        <div v-if="currentPage === 'companion-applications'" class="application-list">
          <div class="search-bar">
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
            <button @click="loadApplications" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户</th>
                <th>服务类型</th>
                <th>申请时间</th>
                <th>状态</th>
                <th>处理时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="app in applicationList" :key="app.id">
                <td>{{ app.id }}</td>
                <td>{{ app.userId }}</td>
                <td>{{ app.gameName || '游戏陪玩' }}</td>
                <td>{{ formatTime(app.createTime) }}</td>
                <td>
                  <span :class="['status-badge', 
                    app.status === 'approved' ? 'approved' : 
                    app.status === 'pending' ? 'pending' : 'rejected']">
                    {{ app.status === 'approved' ? '已通过' : 
                       app.status === 'pending' ? '待审核' : '已拒绝' }}
                  </span>
                </td>
                <td>{{ app.handleTime ? formatTime(app.handleTime) : '-' }}</td>
                <td>
                  <button @click="viewApplication(app)" class="action-btn">查看</button>
                  <button @click="approveApplication(app)" class="action-btn" :disabled="app.status !== 'pending'">通过</button>
                  <button @click="rejectApplication(app)" class="action-btn delete-btn" :disabled="app.status !== 'pending'">拒绝</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 管理员管理 -->
        <div v-if="currentPage === 'admins'" class="admin-list">
          <div class="page-header">
            <h2>管理员列表</h2>
            <button @click="openCreateAdminModal" class="add-btn">添加管理员</button>
          </div>

          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索用户名/昵称" class="search-input" />
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="1">正常</option>
              <option value="0">禁用</option>
            </select>
            <button @click="loadAdmins" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>昵称</th>
                <th>邮箱</th>
                <th>手机</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="admin in adminList" :key="admin.id">
                <td>{{ admin.id }}</td>
                <td>{{ admin.username }}</td>
                <td>{{ admin.nickname }}</td>
                <td>{{ admin.email || '-' }}</td>
                <td>{{ admin.phone || '-' }}</td>
                <td>
                  <span :class="['status-badge', admin.status === 1 ? 'active' : 'disabled']">
                    {{ admin.status === 1 ? '正常' : '禁用' }}
                  </span>
                </td>
                <td>{{ formatTime(admin.create_time) }}</td>
                <td>
                  <button @click="editAdmin(admin)" class="action-btn">编辑</button>
                  <button @click="openPasswordModal(admin)" class="action-btn">修改密码</button>
                  <button v-if="admin.id !== 1" @click="deleteAdmin(admin)" class="action-btn delete-btn">删除</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 角色管理 -->
        <div v-if="currentPage === 'roles'" class="role-list">
          <div class="page-header">
            <h2>角色列表</h2>
            <button @click="openCreateRoleModal" class="add-btn">添加角色</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>角色名称</th>
                <th>描述</th>
                <th>状态</th>
                <th>排序</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in roleList" :key="role.id">
                <td>{{ role.id }}</td>
                <td>
                  <span v-if="role.is_super" style="color: #e74c3c; font-weight: bold;">
                    {{ role.name }} (超级管理员)
                  </span>
                  <span v-else>{{ role.name }}</span>
                </td>
                <td>{{ role.description || '-' }}</td>
                <td>
                  <span :class="['status-badge', role.status === 1 ? 'active' : 'disabled']">
                    {{ role.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>{{ role.sort || 0 }}</td>
                <td>
                  <button @click="editRole(role)" class="action-btn" :disabled="role.is_super">编辑</button>
                  <button v-if="!role.is_super" @click="deleteRole(role)" class="action-btn delete-btn">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 系统设置 -->
        <div v-if="currentPage === 'settings'" class="settings-page">
          <div class="settings-section">
            <h3>基础设置</h3>
            <div class="form-group">
              <label>网站名称</label>
              <input v-model="systemSettings.siteName" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>网站描述</label>
              <input v-model="systemSettings.siteDescription" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>联系方式</label>
              <input v-model="systemSettings.contactPhone" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>联系邮箱</label>
              <input v-model="systemSettings.contactEmail" type="email" class="form-input" />
            </div>
          </div>

          <div class="settings-section">
            <h3>用户设置</h3>
            <div class="form-group">
              <label>用户初始余额</label>
              <input v-model.number="systemSettings.userInitBalance" type="number" class="form-input" />
            </div>
            <div class="form-group">
              <label>最低提现金额</label>
              <input v-model.number="systemSettings.withdrawMinAmount" type="number" class="form-input" />
            </div>
            <div class="form-group">
              <label>提现手续费率</label>
              <input v-model.number="systemSettings.withdrawFeeRate" type="number" step="0.01" class="form-input" />
            </div>
          </div>

          <div class="settings-section">
            <h3>功能开关</h3>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="systemSettings.registerEnabled" />
                允许用户注册
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="systemSettings.giftEnabled" />
                启用礼物功能
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="systemSettings.voiceChatEnabled" />
                启用语音聊天
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="systemSettings.videoChatEnabled" />
                启用视频聊天
              </label>
            </div>
          </div>

          <div class="settings-actions">
            <button @click="saveSettings" class="btn-save">保存设置</button>
          </div>
        </div>

        <!-- 接口管理 -->
        <div v-if="currentPage === 'api'" class="api-management">
          <div class="page-header">
            <h2>接口管理</h2>
          </div>

          <div class="api-list">
            <div class="api-section">
              <h3 class="api-section-title">📊 仪表盘接口</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>路径</th>
                    <th>方法</th>
                    <th>描述</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>/api/admin/dashboard</td>
                    <td><span class="method-badge get">GET</span></td>
                    <td>获取仪表盘统计数据</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="api-section">
              <h3 class="api-section-title">👥 用户管理接口</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>路径</th>
                    <th>方法</th>
                    <th>描述</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>/api/admin/users</td>
                    <td><span class="method-badge get">GET</span></td>
                    <td>获取用户列表</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin/users/:id</td>
                    <td><span class="method-badge get">GET</span></td>
                    <td>获取用户详情</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin/users</td>
                    <td><span class="method-badge post">POST</span></td>
                    <td>创建用户</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin/users/:id</td>
                    <td><span class="method-badge put">PUT</span></td>
                    <td>更新用户</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin/users/:id/status</td>
                    <td><span class="method-badge put">PUT</span></td>
                    <td>更新用户状态</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin/users/:id</td>
                    <td><span class="method-badge delete">DELETE</span></td>
                    <td>删除用户</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="api-section">
              <h3 class="api-section-title">🎪 Banner管理接口</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>路径</th>
                    <th>方法</th>
                    <th>描述</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>/api/admin/banners</td>
                    <td><span class="method-badge get">GET</span></td>
                    <td>获取Banner列表</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin/banners/:id</td>
                    <td><span class="method-badge get">GET</span></td>
                    <td>获取Banner详情</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin/banners</td>
                    <td><span class="method-badge post">POST</span></td>
                    <td>创建Banner</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin/banners/:id</td>
                    <td><span class="method-badge put">PUT</span></td>
                    <td>更新Banner</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin/banners/:id/status</td>
                    <td><span class="method-badge put">PUT</span></td>
                    <td>更新Banner状态</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin/banners/:id</td>
                    <td><span class="method-badge delete">DELETE</span></td>
                    <td>删除Banner</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="api-section">
              <h3 class="api-section-title">👨‍💼 管理员权限接口</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>路径</th>
                    <th>方法</th>
                    <th>描述</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>/api/admin-manage/login</td>
                    <td><span class="method-badge post">POST</span></td>
                    <td>管理员登录</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin-manage/admins</td>
                    <td><span class="method-badge get">GET</span></td>
                    <td>获取管理员列表</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin-manage/admins</td>
                    <td><span class="method-badge post">POST</span></td>
                    <td>创建管理员</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin-manage/admins/:id</td>
                    <td><span class="method-badge put">PUT</span></td>
                    <td>更新管理员</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin-manage/admins/:id/password</td>
                    <td><span class="method-badge put">PUT</span></td>
                    <td>修改管理员密码</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin-manage/admins/:id</td>
                    <td><span class="method-badge delete">DELETE</span></td>
                    <td>删除管理员</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin-manage/roles</td>
                    <td><span class="method-badge get">GET</span></td>
                    <td>获取角色列表</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin-manage/roles</td>
                    <td><span class="method-badge post">POST</span></td>
                    <td>创建角色</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin-manage/roles/:id</td>
                    <td><span class="method-badge put">PUT</span></td>
                    <td>更新角色</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin-manage/roles/:id</td>
                    <td><span class="method-badge delete">DELETE</span></td>
                    <td>删除角色</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                  <tr>
                    <td>/api/admin-manage/permissions</td>
                    <td><span class="method-badge get">GET</span></td>
                    <td>获取权限列表</td>
                    <td><span class="status-badge active">正常</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 虚拟用户创建/编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑虚拟机器人' : '添加虚拟机器人' }}</h3>
          <button class="close-btn" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>昵称</label>
            <div class="input-with-random">
              <input v-model="currentUser.nickname" type="text" class="form-input" />
              <button type="button" class="random-btn" @click="currentUser.nickname = randomNickname()" title="随机生成">🎲</button>
            </div>
          </div>
          <div class="form-group">
            <label>头像URL</label>
            <input v-model="currentUser.avatar" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="currentUser.role" class="form-select">
              <option value="default">默认</option>
              <option value="companion">陪玩师</option>
              <option value="guide">向导</option>
              <option value="assistant">助手</option>
            </select>
          </div>
          <div class="form-group">
            <label>对话风格 <span class="tag-limit">(多选，最多5个)</span></label>
            <div class="style-tags">
              <span
                v-for="opt in styleOptions"
                :key="opt.value"
                :class="['style-tag', { active: selectedStyles.includes(opt.value) }]"
                @click="toggleStyle(opt.value)"
              >
                {{ opt.label }}
              </span>
            </div>
            <div v-if="selectedStyles.length >= 5" class="hint">已选满5个风格</div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="btn-cancel">取消</button>
          <button @click="saveUser" class="btn-save">保存</button>
        </div>
      </div>
    </div>

    <!-- 批量添加机器人弹窗 -->
    <div v-if="showBatchModal" class="modal-overlay" @click="showBatchModal = false">
      <div class="modal-content batch-modal" @click.stop>
        <div class="modal-header">
          <h3>📦 批量添加机器人</h3>
          <button class="close-btn" @click="showBatchModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>添加数量</label>
              <input v-model.number="batchCount" type="number" min="1" max="100" class="form-input" />
            </div>
            <div class="form-group">
              <label>角色</label>
              <select v-model="batchRole" class="form-select">
                <option value="default">默认</option>
                <option value="companion">陪玩师</option>
                <option value="guide">向导</option>
                <option value="assistant">助手</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>状态</label>
              <select v-model.number="batchStatus" class="form-select">
                <option :value="1">启用</option>
                <option :value="0">禁用</option>
              </select>
            </div>
            <div class="form-group">
              <label>在线状态</label>
              <select v-model.number="batchOnline" class="form-select">
                <option :value="1">在线</option>
                <option :value="0">离线</option>
              </select>
            </div>
          </div>
          <div class="batch-preview" v-if="batchPreview.length > 0">
            <label>预览 (随机昵称 + 随机5个风格)：</label>
            <div class="batch-list">
              <div v-for="(item, idx) in batchPreview" :key="idx" class="batch-item">
                <span class="batch-index">{{ idx + 1 }}</span>
                <span class="batch-name">{{ item.nickname }}</span>
                <span class="batch-styles">{{ item.styles }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <span class="batch-progress" v-if="batchCreating">{{ batchProgress }}</span>
          <button @click="showBatchModal = false" class="btn-cancel" :disabled="batchCreating">取消</button>
          <button @click="batchCreate" class="btn-save" :disabled="batchCreating">
            {{ batchCreating ? '创建中...' : '批量创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 礼物创建/编辑弹窗 -->
    <div v-if="showGiftModal" class="modal-overlay" @click="showGiftModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isGiftEdit ? '编辑礼物' : '添加礼物' }}</h3>
          <button class="close-btn" @click="showGiftModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>礼物名称 *</label>
            <input v-model="currentGift.title" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>图片URL *</label>
            <input v-model="currentGift.image" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>动画URL</label>
            <input v-model="currentGift.svga" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>价格 *</label>
            <input v-model.number="currentGift.money" type="number" step="0.01" class="form-input" />
          </div>
          <div class="form-group">
            <label>类型</label>
            <select v-model.number="currentGift.type" class="form-select">
              <option :value="0">普通</option>
              <option :value="1">特殊</option>
            </select>
          </div>
          <div class="form-group">
            <label>VIP专属</label>
            <select v-model.number="currentGift.is_vip" class="form-select">
              <option :value="0">否</option>
              <option :value="1">是</option>
            </select>
          </div>
          <div class="form-group">
            <label>排序</label>
            <input v-model.number="currentGift.sort" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentGift.status" class="form-select">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showGiftModal = false" class="btn-cancel">取消</button>
          <button @click="saveGift" class="btn-save">保存</button>
        </div>
      </div>
    </div>

    <!-- VIP套餐创建/编辑弹窗 -->
    <div v-if="showVipModal" class="modal-overlay" @click="showVipModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isVipEdit ? '编辑VIP套餐' : '添加VIP套餐' }}</h3>
          <button class="close-btn" @click="showVipModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>套餐名称 *</label>
            <input v-model="currentVipPackage.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>价格 *</label>
            <input v-model.number="currentVipPackage.price" type="number" step="0.01" class="form-input" />
          </div>
          <div class="form-group">
            <label>原价</label>
            <input v-model.number="currentVipPackage.originalPrice" type="number" step="0.01" class="form-input" />
          </div>
          <div class="form-group">
            <label>时长(天) *</label>
            <input v-model.number="currentVipPackage.duration" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>等级</label>
            <input v-model.number="currentVipPackage.level" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>热门标记</label>
            <select v-model.number="currentVipPackage.hot" class="form-select">
              <option :value="0">否</option>
              <option :value="1">是</option>
            </select>
          </div>
          <div class="form-group">
            <label>排序</label>
            <input v-model.number="currentVipPackage.sort" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentVipPackage.status" class="form-select">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showVipModal = false" class="btn-cancel">取消</button>
          <button @click="saveVipPackage" class="btn-save">保存</button>
        </div>
      </div>
    </div>

    <!-- 服务分类创建/编辑弹窗 -->
    <div v-if="showGameModal" class="modal-overlay" @click="showGameModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isGameEdit ? '编辑服务分类' : '添加服务分类' }}</h3>
          <button class="close-btn" @click="showGameModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>名称 *</label>
            <input v-model="currentGame.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>图标URL</label>
            <input v-model="currentGame.icon" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <input v-model="currentGame.description" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>排序</label>
            <input v-model.number="currentGame.sort" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentGame.status" class="form-select">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showGameModal = false" class="btn-cancel">取消</button>
          <button @click="saveGame" class="btn-save">保存</button>
        </div>
      </div>
    </div>

    <!-- Banner创建/编辑弹窗 -->
    <div v-if="showBannerModal" class="modal-overlay" @click="showBannerModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isBannerEdit ? '编辑Banner' : '添加Banner' }}</h3>
          <button class="close-btn" @click="showBannerModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题 *</label>
            <input v-model="currentBanner.title" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>图片URL *</label>
            <input v-model="currentBanner.image" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>链接</label>
            <input v-model="currentBanner.link" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>排序</label>
            <input v-model.number="currentBanner.sort" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentBanner.status" class="form-select">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showBannerModal = false" class="btn-cancel">取消</button>
          <button @click="saveBanner" class="btn-save">保存</button>
        </div>
      </div>
    </div>

    <!-- 管理员创建/编辑弹窗 -->
    <div v-if="showAdminModal" class="modal-overlay" @click="showAdminModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isAdminEdit ? '编辑管理员' : '添加管理员' }}</h3>
          <button class="close-btn" @click="showAdminModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户名 *</label>
            <input v-model="currentAdmin.username" type="text" class="form-input" :disabled="isAdminEdit" />
          </div>
          <div class="form-group" v-if="!isAdminEdit">
            <label>密码 *</label>
            <input v-model="currentAdmin.password" type="password" class="form-input" />
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input v-model="currentAdmin.nickname" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="currentAdmin.email" type="email" class="form-input" />
          </div>
          <div class="form-group">
            <label>手机</label>
            <input v-model="currentAdmin.phone" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="currentAdmin.role_id" class="form-select">
              <option :value="0">请选择</option>
              <option v-for="role in roleList" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentAdmin.status" class="form-select">
              <option :value="1">正常</option>
              <option :value="0">禁用</option>
            </select>
          </div>
          <div class="form-group">
            <label>权限设置</label>
            <div style="margin-bottom:10px;">
              <button type="button" @click="selectAllAdminPermissions" class="action-btn" style="background:#3498db;color:white;margin-right:8px;">全选</button>
              <button type="button" @click="deselectAllAdminPermissions" class="action-btn">全不选</button>
            </div>
            <div class="permission-checkboxes">
              <label v-for="perm in allPermissions" :key="perm.id" class="permission-item">
                <input type="checkbox" :value="perm.id" v-model="currentAdmin.permissions" />
                {{ perm.icon }} {{ perm.name }}
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAdminModal = false" class="btn-cancel">取消</button>
          <button @click="saveAdmin" class="btn-save">保存</button>
        </div>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <div v-if="showPasswordModal" class="modal-overlay" @click="showPasswordModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>修改密码</h3>
          <button class="close-btn" @click="showPasswordModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group" v-if="passwordAdminId !== 1">
            <label>旧密码 (非超级管理员可留空)</label>
            <input v-model="passwordForm.oldPassword" type="password" class="form-input" />
          </div>
          <div class="form-group">
            <label>新密码 *</label>
            <input v-model="passwordForm.newPassword" type="password" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showPasswordModal = false" class="btn-cancel">取消</button>
          <button @click="updatePassword" class="btn-save">保存</button>
        </div>
      </div>
    </div>

    <!-- 角色创建/编辑弹窗 -->
    <div v-if="showRoleModal" class="modal-overlay" @click="showRoleModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isRoleEdit ? '编辑角色' : '添加角色' }}</h3>
          <button class="close-btn" @click="showRoleModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>角色名称 *</label>
            <input v-model="currentRole.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <input v-model="currentRole.description" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>排序</label>
            <input v-model.number="currentRole.sort" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentRole.status" class="form-select">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
          <div class="form-group">
            <label>权限设置</label>
            <div style="margin-bottom:10px;">
              <button type="button" @click="selectAllRolePermissions" class="action-btn" style="background:#3498db;color:white;margin-right:8px;">全选</button>
              <button type="button" @click="deselectAllRolePermissions" class="action-btn">全不选</button>
            </div>
            <div class="permission-checkboxes">
              <label v-for="perm in allPermissions" :key="perm.id" class="permission-item">
                <input type="checkbox" :value="perm.id" v-model="currentRole.permissions" />
                {{ perm.icon }} {{ perm.name }}
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showRoleModal = false" class="btn-cancel">取消</button>
          <button @click="saveRole" class="btn-save">保存</button>
        </div>
      </div>
    </div>

    <!-- 用户详情弹窗 -->
    <div v-if="showUserDetail && currentUserDetail" class="modal-overlay" @click="closeUserDetail">
      <div class="modal-content user-detail-modal" @click.stop>
        <div class="modal-header">
          <h3>用户详情</h3>
          <button class="close-btn" @click="closeUserDetail">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-avatar">
            <img v-if="currentUserDetail.avatar" :src="currentUserDetail.avatar" class="detail-avatar-img" />
            <span v-else class="avatar-placeholder-large">👤</span>
          </div>
          <table class="detail-table">
            <tr><td class="detail-label">用户ID</td><td>{{ currentUserDetail.userId }}</td></tr>
            <tr><td class="detail-label">昵称</td><td>{{ currentUserDetail.nickname }}</td></tr>
            <tr><td class="detail-label">手机号</td><td>{{ currentUserDetail.phone || '-' }}</td></tr>
            <tr><td class="detail-label">邮箱</td><td>{{ currentUserDetail.email || '-' }}</td></tr>
            <tr><td class="detail-label">性别</td><td>{{ currentUserDetail.sex === 1 ? '男' : currentUserDetail.sex === 2 ? '女' : '未知' }}</td></tr>
            <tr><td class="detail-label">等级</td><td>Lv.{{ currentUserDetail.lv || 1 }}</td></tr>
            <tr><td class="detail-label">VIP</td><td>{{ currentUserDetail.vip ? 'VIP'+currentUserDetail.vipLv : '否' }}</td></tr>
            <tr><td class="detail-label">金币</td><td>{{ currentUserDetail.money || 0 }} 金币</td></tr>
            <tr><td class="detail-label">粉丝数</td><td>{{ currentUserDetail.fansNum || 0 }}</td></tr>
            <tr><td class="detail-label">城市</td><td>{{ currentUserDetail.city || '-' }}</td></tr>
            <tr><td class="detail-label">个人简介</td><td>{{ currentUserDetail.dec || '-' }}</td></tr>
            <tr><td class="detail-label">状态</td><td><span :class="['status-badge', currentUserDetail.status === 0 ? 'active' : 'disabled']">{{ currentUserDetail.status === 0 ? '正常' : '禁用' }}</span></td></tr>
            <tr><td class="detail-label">注册时间</td><td>{{ formatTime(currentUserDetail.createTime) }}</td></tr>
            <tr><td class="detail-label">最后登录</td><td>{{ currentUserDetail.lastLoginTime ? formatTime(currentUserDetail.lastLoginTime) : '-' }}</td></tr>
          </table>

          <div class="detail-section-title">我的服务</div>
          <table class="detail-table">
            <tr>
              <td class="detail-label">VIP</td>
              <td>
                <span v-if="currentUserDetail.vip" class="service-badge vip">VIP{{ currentUserDetail.vipLv }}</span>
                <span v-else class="service-badge disabled">未开通</span>
              </td>
            </tr>
            <tr>
              <td class="detail-label">陪玩师</td>
              <td>
                <template v-if="currentUserDetail.companionService">
                  <span :class="['service-badge', companionStatusClass(currentUserDetail.companionService.status)]">
                    {{ companionStatusText(currentUserDetail.companionService.status) }}
                  </span>
                  <span v-if="currentUserDetail.companionService.status === 2" class="service-detail">
                    {{ currentUserDetail.companionService.price }} 金币/局 · ⭐{{ currentUserDetail.companionService.star }}
                  </span>
                </template>
                <span v-else class="service-badge disabled">未申请</span>
              </td>
            </tr>
          </table>
        </div>
        <div class="modal-footer">
          <button @click="closeUserDetail" class="btn-cancel">关闭</button>
        </div>
      </div>
    </div>

    <!-- 用户创建/编辑弹窗 -->
    <div v-if="showUserModal" class="modal-overlay" @click="showUserModal = false">
      <div class="modal-content user-form-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ isUserEdit ? '编辑用户' : '添加用户' }}</h3>
          <button class="close-btn" @click="showUserModal = false">×</button>
        </div>

        <div class="modal-body">
          <div class="user-form-avatar-section">
            <div class="avatar-preview">
              <img v-if="currentUserEdit.avatar" :src="currentUserEdit.avatar" class="avatar-preview-img" />
              <span v-else class="avatar-preview-placeholder">+</span>
            </div>
            <div class="avatar-input-group">
              <label class="user-field-label">头像URL</label>
              <input v-model="currentUserEdit.avatar" type="text" class="form-input" placeholder="输入头像图片地址" />
            </div>
          </div>

          <div class="user-form-grid">
            <div class="form-group">
              <label>昵称 <span class="required">*</span></label>
              <input v-model="currentUserEdit.nickname" type="text" class="form-input" placeholder="请输入昵称" />
            </div>
            <div class="form-group">
              <label>手机号</label>
              <input v-model="currentUserEdit.phone" type="text" class="form-input" placeholder="请输入手机号" />
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input v-model="currentUserEdit.email" type="email" class="form-input" placeholder="请输入邮箱地址" />
            </div>
            <div class="form-group">
              <label>性别</label>
              <select v-model.number="currentUserEdit.gender" class="form-select">
                <option :value="2">未知</option>
                <option :value="1">男</option>
                <option :value="0">女</option>
              </select>
            </div>
            <div class="form-group">
              <label>城市</label>
              <div class="region-display" @click="showRegionPicker = true">
                <span :class="{ placeholder: !currentUserEdit.city }">{{ currentUserEdit.city || '请选择地区' }}</span>
                <span class="arrow">›</span>
              </div>
            </div>
            <div class="form-group">
              <label>个人简介</label>
              <input v-model="currentUserEdit.dec" type="text" class="form-input" placeholder="请输入个人简介" />
            </div>
            <div class="form-group">
              <label>VIP等级</label>
              <input v-model.number="currentUserEdit.vipLv" type="number" class="form-input" min="0" placeholder="0" />
            </div>
            <div class="form-group">
              <label>金币</label>
              <input v-model.number="currentUserEdit.money" type="number" class="form-input" min="0" step="0.01" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model.number="currentUserEdit.status" class="form-select">
                <option :value="0">正常</option>
                <option :value="1">禁用</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showUserModal = false" class="btn-cancel">取消</button>
          <button @click="saveUserAccountEdit" class="btn-save">{{ isUserEdit ? '保存修改' : '创建账号' }}</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 地区选择器 -->
  <div v-if="showRegionPicker" class="modal-overlay" @click="closeRegionPicker">
    <div class="modal-content region-modal" @click.stop>
      <div class="modal-header">
        <h3>选择地区</h3>
        <button class="close-btn" @click="closeRegionPicker">×</button>
      </div>
      <div class="modal-body region-modal-body">
        <div class="region-step-tabs">
          <span class="region-step" :class="{ active: regionStep === 'province' }">省份</span>
          <span class="region-step" :class="{ active: regionStep === 'city' }">城市</span>
          <span class="region-step" :class="{ active: regionStep === 'district' }">区县</span>
        </div>
        <div class="region-columns">
          <div class="region-column" v-show="regionStep === 'province'">
            <div class="region-list">
              <div class="region-item" v-for="province in regionData" :key="province.code"
                :class="{ active: tempRegion.province === province.name }"
                @click="selectProvince(province)">
                <span class="region-item-name">{{ province.name }}</span>
                <span class="region-item-arrow">›</span>
              </div>
            </div>
          </div>
          <div class="region-column" v-show="regionStep === 'city'">
            <div class="region-list">
              <div class="region-item" v-for="city in currentProvince?.cities" :key="city.code"
                :class="{ active: tempRegion.city === city.name }"
                @click="selectCity(city)">
                <span class="region-item-name">{{ city.name }}</span>
                <span class="region-item-arrow" v-if="city.districts && city.districts.length > 0">›</span>
              </div>
            </div>
          </div>
          <div class="region-column" v-show="regionStep === 'district'">
            <div class="region-list">
              <div class="region-item" v-for="district in currentCity?.districts" :key="district.code"
                :class="{ active: tempRegion.district === district.name }"
                @click="selectDistrict(district)">
                <span class="region-item-name">{{ district.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="closeRegionPicker" class="btn-cancel">取消</button>
        <button @click="confirmRegion" class="btn-save">确定</button>
      </div>
    </div>
  </div>

  <!-- 订单详情弹窗 -->
  <div v-if="showOrderDetail" class="modal-overlay" @click="showOrderDetail = false">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>订单详情</h3>
        <button class="close-btn" @click="showOrderDetail = false">×</button>
      </div>
      <div class="modal-body">
        <table class="detail-table">
          <tr><td class="detail-label">订单号</td><td>{{ currentOrderDetail.orderNo }}</td></tr>
          <tr><td class="detail-label">游戏</td><td>{{ currentOrderDetail.gameName }}</td></tr>
          <tr><td class="detail-label">服务类型</td><td><span :class="['service-type-tag', 'service-type-' + (currentOrderDetail.type || 0)]">{{ currentOrderDetail.typeText || '线上服务' }}</span></td></tr>
          <tr><td class="detail-label">买家</td><td>{{ currentOrderDetail.buyerName || '用户' + currentOrderDetail.userId }}</td></tr>
          <tr><td class="detail-label">陪玩师</td><td>{{ currentOrderDetail.sellerName || '用户' + currentOrderDetail.targetId }}</td></tr>
          <tr><td class="detail-label">单价</td><td>{{ currentOrderDetail.price }} 金币</td></tr>
          <tr><td class="detail-label">数量</td><td>{{ currentOrderDetail.num }} 局</td></tr>
          <tr><td class="detail-label">总金额</td><td>{{ currentOrderDetail.totalPrice }} 金币</td></tr>
          <tr><td class="detail-label">状态</td><td><span :class="['order-status-badge', orderStatusClass(currentOrderDetail.status)]">{{ orderStatusText(currentOrderDetail.status) }}</span></td></tr>
          <tr><td class="detail-label">游戏区服</td><td>{{ currentOrderDetail.gamesServerName || '-' }}</td></tr>
          <tr><td class="detail-label">游戏角色</td><td>{{ currentOrderDetail.gameRoleName || '-' }}</td></tr>
          <tr><td class="detail-label">创建时间</td><td>{{ formatUnixTime(currentOrderDetail.createTime) }}</td></tr>
          <tr><td class="detail-label">开始时间</td><td>{{ currentOrderDetail.startTime ? formatUnixTime(currentOrderDetail.startTime) : '-' }}</td></tr>
          <tr><td class="detail-label">完成时间</td><td>{{ currentOrderDetail.endTime ? formatUnixTime(currentOrderDetail.endTime) : '-' }}</td></tr>
        </table>
      </div>
      <div class="modal-footer">
        <button @click="showOrderDetail = false" class="btn-cancel">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { regionData } from '../common/regionData'
import { useAdmin } from './admin/composables/useAdmin'
import adminService from '../services/adminService'
import adminManageService from '../services/adminManageService'
import { toast } from '../composables/useToast'

const { toast, confirm, formatTime, exportCSV } = useAdmin()

const currentPage = ref('dashboard')
const token = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const searchKeyword = ref('')
const filterStatus = ref('')

const userList = ref([])
const orderList = ref([])
const showOrderDetail = ref(false)
const currentOrderDetail = ref({})
const withdrawList = ref([])
const virtualUserList = ref([])
const giftList = ref([])
const giftLogList = ref([])
const postList = ref([])
const reportList = ref([])
const vipPackageList = ref([])
const rechargeList = ref([])
const gameList = ref([])
const applicationList = ref([])
const bannerList = ref([])
const recommendList = ref([])
const manualRecommendList = ref([])
const newRecommendUserId = ref('')
const recommendTab = ref('system')

const mergedRecommendList = computed(() => {
  const topList = manualRecommendList.value.filter(u => u.isTop)
  const normalList = manualRecommendList.value.filter(u => !u.isTop)
  return [...topList, ...normalList]
})

const getRecommendScore = (user) => {
  return (user.likeCount || user.likes || 0) + (user.followerCount || user.followers || 0) + (user.activityScore || user.score || 0)
}

const showModal = ref(false)
const isEdit = ref(false)
const showGiftModal = ref(false)
const isGiftEdit = ref(false)
const showVipModal = ref(false)
const isVipEdit = ref(false)
const showGameModal = ref(false)
const isGameEdit = ref(false)
const showBannerModal = ref(false)
const isBannerEdit = ref(false)

const systemSettings = ref({
  siteName: '多客陪玩',
  siteDescription: '专业游戏陪玩平台',
  contactPhone: '400-888-8888',
  contactEmail: 'admin@duoke.com',
  userInitBalance: 0,
  withdrawMinAmount: 50,
  withdrawFeeRate: 0.02,
  registerEnabled: true,
  giftEnabled: true,
  voiceChatEnabled: true,
  videoChatEnabled: true
})

const currentUser = ref({
  id: '',
  username: '',
  nickname: '',
  avatar: '',
  role: 'default',
  dialogueStyle: 'friendly',
  status: 1,
  isOnline: 1
})

// 对话风格多选
const styleOptions = [
  { value: 'friendly', label: '友好亲切' },
  { value: 'professional', label: '专业严谨' },
  { value: 'humorous', label: '幽默风趣' },
  { value: 'cute', label: '可爱俏皮' },
  { value: 'warm', label: '温柔体贴' },
  { value: 'passionate', label: '热情开朗' },
  { value: 'mature', label: '成熟稳重' },
  { value: 'lively', label: '活泼阳光' },
  { value: 'elegant', label: '优雅大方' },
  { value: 'cool', label: '高冷酷拽' },
  { value: 'caring', label: '暖心关怀' },
  { value: 'witty', label: '机智健谈' },
  { value: 'calm', label: '沉稳内敛' },
  { value: 'easygoing', label: '风趣随和' },
  { value: 'intellectual', label: '知性优雅' },
  { value: 'bold', label: '豪爽直率' },
  { value: 'artistic', label: '文艺清新' },
  { value: 'bossy', label: '霸道总裁' },
  { value: 'brotherly', label: '邻家大哥' },
  { value: 'sweetheart', label: '软萌甜心' },
  { value: 'tsundere', label: '腹黑傲娇' },
  { value: 'free', label: '潇洒不羁' },
  { value: 'gentle', label: '温文尔雅' },
  { value: 'sunny', label: '阳光开朗' },
  { value: 'mysterious', label: '神秘莫测' },
  { value: 'sincere', label: '真诚朴实' },
  { value: 'chatty', label: '话痨社牛' },
  { value: 'composed', label: '淡定从容' },
  { value: 'kind', label: '热心肠' },
  { value: 'sarcastic', label: '毒舌吐槽' },
  { value: 'devoted', label: '痴情专一' },
  { value: 'carefree', label: '洒脱自由' },
]
const selectedStyles = ref([])

// 随机选5个风格标签
const randomStyles = () => {
  const shuffled = [...styleOptions].sort(() => Math.random() - 0.5)
  selectedStyles.value = shuffled.slice(0, 5).map(s => s.value)
}

const toggleStyle = (value) => {
  const idx = selectedStyles.value.indexOf(value)
  if (idx > -1) {
    selectedStyles.value.splice(idx, 1)
  } else if (selectedStyles.value.length < 5) {
    selectedStyles.value.push(value)
  }
}

// 随机昵称生成
const randomFamilyNames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许', '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', '陶', '姜', '谢', '苏', '潘', '葛', '范', '彭', '鲁', '马', '柳', '黄', '萧', '狄', '宋', '乔', '谭', '钟', '徐', '邱', '高', '林', '蔡', '田', '樊', '胡', '凌', '霍', '万', '柯']
const randomMaleNames = ['伟', '强', '磊', '军', '勇', '杰', '涛', '明', '辉', '鹏', '彬', '宇', '浩', '然', '博', '文', '刚', '超', '飞', '龙', '峰', '亮', '洋', '威', '健', '鑫', '安', '帅', '杰', '宇', '博', '毅', '恒', '霖', '彦', '宸', '诺', '誉', '豪', '瑞']
const randomFemaleNames = ['芳', '敏', '静', '丽', '婷', '雪', '娟', '艳', '洁', '琳', '倩', '怡', '慧', '颖', '瑶', '晓', '彤', '月', '梦', '萱', '娜', '莉', '欣', '雨', '悦', '莹', '雅', '云', '佳', '宁', '菲', '妍', '莎', '丹', '茜', '媛', '蕾', '柳', '霜', '婉']
const randomNickPrefixes = ['快乐的', '安静的', '懒懒的', '可爱的', '酷酷的', '温柔的', '阳光的', '甜甜的', '努力的', '佛系的', '呆萌的', '热心的', '幸运的', '治愈的', '优雅的', '元气', '软萌', '高冷', '暖心的', '浪漫的']
const randomNickAnimals = ['小猫', '小兔', '小熊', '小鹿', '小鱼', '小鸟', '小熊猫', '小柯基', '小柴犬', '小海豚', '小仓鼠', '小奶猫', '布偶猫', '金毛', '柴犬', '橘猫', '狸花', '企鹅', '考拉', '树懒']

const _rand = (max) => Math.floor(Math.random() * max)

const randomNickname = () => {
  const useRealName = Math.random() > 0.5
  if (useRealName) {
    const family = randomFamilyNames[_rand(randomFamilyNames.length)]
    const pool = Math.random() > 0.5 ? randomMaleNames : randomFemaleNames
    const given = pool[_rand(pool.length)] + (Math.random() > 0.7 ? pool[_rand(pool.length)] : '')
    return family + given
  } else {
    const prefix = randomNickPrefixes[_rand(randomNickPrefixes.length)]
    const animal = randomNickAnimals[_rand(randomNickAnimals.length)]
    return prefix + animal
  }
}

// 生成随机风格（批量用）
const _genRandomStyleLabel = () => {
  const shuffled = [...styleOptions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5).map(s => s.label).join('、')
}
const _genRandomStyleValue = () => {
  const shuffled = [...styleOptions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5).map(s => s.value).join(',')
}

// 批量添加
const showBatchModal = ref(false)
const batchCount = ref(10)
const batchRole = ref('default')
const batchStatus = ref(1)
const batchOnline = ref(1)
const batchPreview = ref([])
const batchCreating = ref(false)
const batchProgress = ref('')

const refreshBatchPreview = () => {
  const count = Math.min(Math.max(parseInt(batchCount.value) || 1, 1), 100)
  batchCount.value = count
  batchPreview.value = Array.from({ length: count }, () => ({
    nickname: randomNickname(),
    styles: _genRandomStyleLabel()
  }))
}

const openBatchModal = () => {
  batchCount.value = 10
  batchRole.value = 'default'
  batchStatus.value = 1
  batchOnline.value = 1
  batchPreview.value = []
  batchCreating.value = false
  batchProgress.value = ''
  refreshBatchPreview()
  showBatchModal.value = true
}

const batchCreate = async () => {
  const count = Math.min(Math.max(parseInt(batchCount.value) || 1, 1), 100)
  batchCount.value = count
  batchCreating.value = true
  let success = 0
  let fail = 0

  for (let i = 0; i < count; i++) {
    batchProgress.value = `正在创建 ${i + 1}/${count}...`
    try {
      const data = {
        nickname: randomNickname(),
        avatar: '',
        role: batchRole.value,
        dialogueStyle: _genRandomStyleValue(),
        status: batchStatus.value,
        isOnline: batchOnline.value
      }
      const result = await adminService.createVirtualUser(data)
      if (result.code === 200 || result.code === 0) {
        success++
      } else {
        fail++
      }
    } catch (err) {
      fail++
      console.error('批量创建失败:', err)
    }
  }

  batchCreating.value = false
  batchProgress.value = ''
  toast(`批量创建完成！成功 ${success} 个，失败 ${fail} 个`)
  showBatchModal.value = false
  loadVirtualUsers()
}

// 数量变化刷新预览
watch(batchCount, () => {
  if (showBatchModal.value) refreshBatchPreview()
})

const currentGift = ref({
  id: '',
  title: '',
  image: '',
  svga: '',
  money: 0,
  type: 0,
  is_vip: 0,
  tian: 0,
  status: 1,
  sort: 0
})

const currentVipPackage = ref({
  id: '',
  name: '',
  price: 0,
  originalPrice: 0,
  duration: 30,
  level: 1,
  hot: 0,
  sort: 0,
  status: 1
})

const currentGame = ref({
  id: '',
  name: '',
  icon: '',
  description: '',
  sort: 0,
  status: 1
})

const currentBanner = ref({
  id: '',
  title: '',
  image: '',
  link: '',
  sort: 0,
  status: 1
})

// 用户管理相关变量
const showUserModal = ref(false)
const showUserDetail = ref(false)
const isUserEdit = ref(false)
const currentUserDetail = ref(null)
const currentUserEdit = ref({
  userId: '',
  nickname: '',
  phone: '',
  email: '',
  avatar: '',
  gender: 2,
  city: '',
  dec: '',
  vipLv: 0,
  money: 0,
  status: 0
})

// 地区选择器相关
const showRegionPicker = ref(false)
const regionStep = ref('province')
const tempRegion = reactive({
  province: '',
  city: '',
  district: ''
})
const currentProvince = ref(null)
const currentCity = ref(null)
const selectProvince = (province) => {
  tempRegion.province = province.name
  tempRegion.city = ''
  tempRegion.district = ''
  regionStep.value = 'city'
  currentProvince.value = province
  currentCity.value = null
}

const selectCity = (city) => {
  tempRegion.city = city.name
  tempRegion.district = ''
  currentCity.value = city
  if (city.districts && city.districts.length > 0) {
    regionStep.value = 'district'
  } else {
    regionStep.value = 'province'
    currentUserEdit.value.city = tempRegion.province + ' ' + tempRegion.city
    showRegionPicker.value = false
  }
}

const selectDistrict = (district) => {
  tempRegion.district = district.name
  regionStep.value = 'province'
  currentUserEdit.value.city = tempRegion.province + ' ' + tempRegion.city + ' ' + tempRegion.district
  showRegionPicker.value = false
}

const confirmRegion = () => {
  const parts = [tempRegion.province, tempRegion.city, tempRegion.district].filter(Boolean)
  currentUserEdit.value.city = parts.join(' ')
  showRegionPicker.value = false
}

const closeRegionPicker = () => {
  showRegionPicker.value = false
  regionStep.value = 'province'
  tempRegion.province = ''
  tempRegion.city = ''
  tempRegion.district = ''
  currentProvince.value = null
  currentCity.value = null
}

// 管理员和角色相关变量
const adminList = ref([])
const roleList = ref([])
const allPermissions = ref([])

const showAdminModal = ref(false)
const isAdminEdit = ref(false)
const showPasswordModal = ref(false)
const showRoleModal = ref(false)
const isRoleEdit = ref(false)

const passwordAdminId = ref(0)
const passwordForm = ref({
  oldPassword: '',
  newPassword: ''
})

const currentAdmin = ref({
  id: '',
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  role_id: 0,
  permissions: [],
  status: 1
})

const currentRole = ref({
  id: '',
  name: '',
  description: '',
  permissions: [],
  status: 1,
  sort: 0
})

const pageTitle = computed(() => {
  const titles = {
    dashboard: '控制台',
    users: '用户管理',
    recommend: '热门推荐',
    orders: '订单管理',
    withdraws: '提现管理',
    posts: '帖子管理',
    reports: '举报管理',
    banners: 'Banner管理',
    'vip-packages': 'VIP套餐管理',
    'gift-management': '礼物管理',
    gifts: '礼物记录',
    recharges: '充值记录',
    games: '服务分类',
    'companion-applications': '服务申请管理',
    'virtual-users': '虚拟机器人管理',
    admins: '管理员管理',
    roles: '角色管理',
    api: '接口管理',
    settings: '系统设置'
  }
  return titles[currentPage.value] || '控制台'
})

const initPage = () => {
  const path = window.location.pathname
  const pathMap = {
    '/admin/dashboard': 'dashboard',
    '/admin/users': 'users',
    '/admin/recommend': 'recommend',
    '/admin/orders': 'orders',
    '/admin/withdraws': 'withdraws',
    '/admin/posts': 'posts',
    '/admin/reports': 'reports',
    '/admin/banners': 'banners',
    '/admin/vip-packages': 'vip-packages',
    '/admin/gift-management': 'gift-management',
    '/admin/gifts': 'gifts',
    '/admin/recharges': 'recharges',
    '/admin/games': 'games',
    '/admin/companion-applications': 'companion-applications',
    '/admin/virtual-users': 'virtual-users',
    '/admin/admins': 'admins',
    '/admin/roles': 'roles',
    '/admin/api': 'api',
    '/admin/settings': 'settings'
  }
  currentPage.value = pathMap[path] || 'dashboard'
}


const loadUsers = async () => {
  try {
    const params = {}
    if (searchKeyword.value) params.nickname = searchKeyword.value
    if (filterStatus.value !== '') params.status = filterStatus.value
    const result = await adminService.getUsers({ page: page.value, pageSize: pageSize.value, ...params })
    if (result.code === 200 || result.code === 0) {
      userList.value = result.data.list || []
      total.value = result.data.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载用户列表失败:', err)
  }
}

const loadRecommendUsers = async () => {
  try {
    const result = await adminService.getUsers({ page: 1, pageSize: 50 })
    if (result.code === 200 || result.code === 0) {
      const list = result.data.list || []
      recommendList.value = list
        .filter(u => u.status === 0)
        .sort((a, b) => {
          const scoreA = (a.likeCount || a.likes || 0) + (a.followerCount || a.followers || 0) + (a.activityScore || a.score || 0)
          const scoreB = (b.likeCount || b.likes || 0) + (b.followerCount || b.followers || 0) + (b.activityScore || b.score || 0)
          return scoreB - scoreA
        })
        .slice(0, 20)
      localStorage.setItem('admin_system_recommend', JSON.stringify(recommendList.value))
      return
    }
    useFallbackRecommendData()
  } catch (err) {
    console.error('加载系统推荐数据失败，使用模拟数据', err)
    useFallbackRecommendData()
  }
}

const useFallbackRecommendData = () => {
  recommendList.value = [
    { userId: 1001, nickname: '小甜心', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rec1', likeCount: 256, followerCount: 1280, activityScore: 95, vip: true, status: 0 },
    { userId: 1002, nickname: '游戏达人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rec2', likeCount: 189, followerCount: 856, activityScore: 88, vip: true, status: 0 },
    { userId: 1003, nickname: '温柔小姐姐', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rec3', likeCount: 312, followerCount: 2100, activityScore: 92, vip: true, status: 0 },
    { userId: 1004, nickname: '技术大神', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rec4', likeCount: 145, followerCount: 620, activityScore: 78, vip: false, status: 0 },
    { userId: 1005, nickname: '声音控', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rec5', likeCount: 198, followerCount: 950, activityScore: 85, vip: true, status: 0 },
    { userId: 1006, nickname: '幽默风趣', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rec6', likeCount: 87, followerCount: 430, activityScore: 72, vip: false, status: 0 },
  ]
  localStorage.setItem('admin_system_recommend', JSON.stringify(recommendList.value))
}

const loadManualRecommendList = () => {
  try {
    const stored = localStorage.getItem('admin_recommend_users')
    manualRecommendList.value = stored ? JSON.parse(stored) : []
  } catch (e) {
    manualRecommendList.value = []
  }
}

const saveManualRecommendList = () => {
  localStorage.setItem('admin_recommend_users', JSON.stringify(manualRecommendList.value))
}

const isAlreadyRecommended = (userId) => {
  return manualRecommendList.value.some(u => u.userId === userId)
}

const addToManualRecommend = (user) => {
  if (isAlreadyRecommended(user.userId)) {
    toast('该用户已在推荐列表中')
    return
  }
  manualRecommendList.value.push({
    userId: user.userId,
    nickname: user.nickname,
    avatar: user.avatar,
    createTime: new Date().getTime()
  })
  saveManualRecommendList()
  toast(`已添加用户 ${user.nickname} 到推荐列表`)
}

const addManualRecommendUser = async () => {
  const userId = parseInt(newRecommendUserId.value)
  if (!userId) {
    toast('请输入有效的用户ID')
    return
  }
  if (isAlreadyRecommended(userId)) {
    toast('该用户已在推荐列表中')
    return
  }
  try {
    const result = await adminService.getUserDetail(userId)
    if (result.code === 200 || result.code === 0) {
      const user = result.data
      manualRecommendList.value.push({
        userId: user.userId,
        nickname: user.nickname,
        avatar: user.avatar,
        createTime: new Date().getTime()
      })
      saveManualRecommendList()
      newRecommendUserId.value = ''
      toast(`已成功添加用户 ${user.nickname}`)
    } else {
      toast('未找到该用户，请检查ID是否正确')
    }
  } catch (err) {
    console.error('添加推荐用户失败:', err)
    toast('添加失败，请检查网络或用户ID')
  }
}

const removeManualRecommend = async (user, idx) => {
  if (!(await confirm(`确定要移除用户 ${user.nickname} 的推荐吗？`)) return
  manualRecommendList.value.splice(idx, 1)
  saveManualRecommendList()
}

const moveRecommendUp = (idx) => {
  if (idx <= 0) return
  const item = manualRecommendList.value[idx]
  manualRecommendList.value.splice(idx, 1)
  manualRecommendList.value.splice(idx - 1, 0, item)
  saveManualRecommendList()
}

const moveRecommendDown = (idx) => {
  if (idx >= manualRecommendList.value.length - 1) return
  const item = manualRecommendList.value[idx]
  manualRecommendList.value.splice(idx, 1)
  manualRecommendList.value.splice(idx + 1, 0, item)
  saveManualRecommendList()
}

const toggleRecommendTop = (user) => {
  user.isTop = !user.isTop
  saveManualRecommendList()
}

const syncRecommendToApi = async () => {
  try {
    const data = {
      recommendUsers: mergedRecommendList.value.map((u, i) => ({
        userId: u.userId,
        nickname: u.nickname,
        sort: i + 1,
        isTop: u.isTop ? 1 : 0
      }))
    }
    const result = await adminService.saveRecommend(data)
    if (result.code === 200 || result.code === 0) {
      toast('推荐列表已保存到服务器')
    } else {
      toast('服务器暂不支持保存，数据已保存在本地')
    }
  } catch (err) {
    console.warn('保存到服务器失败:', err)
    toast('服务器暂不可用，数据已保存在本地缓存')
  }
}

const viewUser = (user) => {
  currentUserDetail.value = user
  showUserDetail.value = true
}

const closeUserDetail = () => {
  showUserDetail.value = false
  currentUserDetail.value = null
}

const toggleUserStatus = async (user) => {
  const newStatus = user.status === 0 ? 1 : 0
  try {
    const result = await adminService.updateUserStatus(user.userId, newStatus)
    if (result.code === 200 || result.code === 0) {
      user.status = newStatus
      toast('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
    toast('更新状态失败')
  }
}

const openCreateUserAccountModal = () => {
  isUserEdit.value = false
  currentUserEdit.value = {
    userId: '',
    nickname: '',
    phone: '',
    email: '',
    avatar: '',
    gender: 2,
    city: '',
    dec: '',
    vipLv: 0,
    money: 0,
    status: 0
  }
  showUserModal.value = true
}

const editUserAccount = (user) => {
  isUserEdit.value = true
  currentUserEdit.value = {
    userId: user.userId,
    nickname: user.nickname || '',
    phone: user.phone || '',
    email: user.email || '',
    avatar: user.avatar || '',
    gender: user.sex !== undefined ? user.sex : 2,
    city: user.city || '',
    dec: user.dec || '',
    vipLv: user.vipLv || 0,
    money: user.money || 0,
    status: user.status || 0
  }
  showUserModal.value = true
}

const saveUserAccountEdit = async () => {
  if (!currentUserEdit.value.nickname) {
    toast('请输入用户昵称')
    return
  }

  try {
    const data = {
      nickname: currentUserEdit.value.nickname,
      phone: currentUserEdit.value.phone,
      email: currentUserEdit.value.email,
      avatar: currentUserEdit.value.avatar,
      sex: currentUserEdit.value.gender,
      city: currentUserEdit.value.city,
      dec: currentUserEdit.value.dec,
      vipLv: currentUserEdit.value.vipLv,
      money: currentUserEdit.value.money,
      status: currentUserEdit.value.status
    }
    
    const result = isUserEdit.value
      ? await adminService.updateUser(currentUserEdit.value.userId, data)
      : await adminService.createUser(data)
    
    if (result.code === 200 || result.code === 0) {
      toast(isUserEdit.value ? '更新成功' : '创建成功')
      showUserModal.value = false
      loadUsers()
    } else {
      toast(result.message || '操作失败')
    }
  } catch (err) {
    console.error('保存用户失败:', err)
    toast('保存失败')
  }
}

const deleteUserAccount = async (user) => {
  if (!(await confirm(`确定要删除用户 ${user.nickname} 吗？`)) {
    return
  }
  
  try {
    const result = await adminService.deleteUser(user.userId)
    if (result.code === 200 || result.code === 0) {
      toast('删除成功')
      loadUsers()
    }
  } catch (err) {
    console.error('删除失败:', err)
    toast('删除失败')
  }
}

const loadOrders = async () => {
  try {
    const params = {}
    if (searchKeyword.value) params.orderNo = searchKeyword.value
    const result = await adminService.getOrders({ page: page.value, pageSize: pageSize.value, ...params })
    if (result.code === 200 || result.code === 0) {
      orderList.value = result.data.list || []
      total.value = result.data.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载订单列表失败:', err)
  }
}

const viewOrderDetail = async (order) => {
  try {
    const result = await adminService.getOrderDetail(order.orderId)
    if (result.code === 200 || result.code === 0) {
      currentOrderDetail.value = result.data || order
      showOrderDetail.value = true
    } else {
      currentOrderDetail.value = order
      showOrderDetail.value = true
    }
  } catch (err) {
    currentOrderDetail.value = order
    showOrderDetail.value = true
  }
}

const orderStatusText = (status) => {
  const map = { 0: '待付款', 1: '待服务', 2: '进行中', 3: '已完成', 4: '已取消' }
  return map[status] || '未知'
}

const orderStatusClass = (status) => {
  const map = { 0: 'status-pending', 1: 'status-waiting', 2: 'status-ongoing', 3: 'status-completed', 4: 'status-cancelled' }
  return map[status] || ''
}

const formatUnixTime = (ts) => {
  if (!ts) return '-'
  const date = new Date(Number(ts) * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const loadWithdraws = async () => {
  try {

    const result = await adminService.getWithdraws({ page: page.value, pageSize: pageSize.value })
    if (result.code === 200 || result.code === 0) {
      withdrawList.value = result.data.list || []
      total.value = result.data.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载提现列表失败:', err)
  }
}

const viewWithdraw = (withdraw) => {
  toast('查看提现详情: ' + withdraw.id)
}

const loadVirtualUsers = async () => {
  try {

    const result = await adminService.getVirtualUsers({ page: page.value, pageSize: pageSize.value })
    if (result.code === 200 || result.code === 0) {
      virtualUserList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || virtualUserList.value.length
    }
  } catch (err) {
    console.error('加载虚拟用户失败:', err)
  }
}

const openCreateModal = () => {
  isEdit.value = false
  currentUser.value = {
    id: '',
    nickname: randomNickname(),
    avatar: '',
    role: 'default',
    dialogueStyle: '',
    status: 1,
    isOnline: 1
  }
  randomStyles()
  showModal.value = true
}

const editUser = (user) => {
  isEdit.value = true
  currentUser.value = {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar || '',
    role: user.role || 'default',
    dialogueStyle: user.dialogueStyle || '',
    status: user.status,
    isOnline: user.isOnline
  }
  selectedStyles.value = user.dialogueStyle ? String(user.dialogueStyle).split(',').filter(Boolean) : []
  showModal.value = true
}

const saveUser = async () => {
  if (!currentUser.value.nickname) {
    toast('请填写昵称')
    return
  }

  // 同步多选风格到字段
  currentUser.value.dialogueStyle = selectedStyles.value.join(',')

  try {
    const result = isEdit.value
      ? await adminService.updateVirtualUser(currentUser.value.id, currentUser.value)
      : await adminService.createVirtualUser(currentUser.value)
    
    if (result.code === 200 || result.code === 0) {
      toast('保存成功')
      showModal.value = false
      loadVirtualUsers()
    } else {
      toast(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存失败:', err)
    toast('保存失败')
  }
}

const toggleStatus = async (user) => {
  const newStatus = user.status === 1 ? 0 : 1
  try {
    const result = await adminService.toggleVirtualUserStatus(user.id, newStatus)
    if (result.code === 200 || result.code === 0) {
      user.status = newStatus
      toast('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
  }
}

const deleteUser = async (user) => {
  if (!(await confirm(`确定要删除用户 ${user.nickname} 吗？`)) {
    return
  }
  
  try {
    const result = await adminService.deleteVirtualUser(user.id)
    if (result.code === 200 || result.code === 0) {
      toast('删除成功')
      loadVirtualUsers()
    }
  } catch (err) {
    console.error('删除失败:', err)
    toast('删除失败')
  }
}

const loadGifts = async () => {
  try {
    const params = {}
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterStatus.value !== '') params.status = filterStatus.value

    const result = await adminService.getGifts({ page: page.value, pageSize: pageSize.value, ...params })
    if (result.code === 200 || result.code === 0) {
      giftList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || giftList.value.length
    }
  } catch (err) {
    console.error('加载礼物列表失败:', err)
  }
}

const openCreateGiftModal = () => {
  isGiftEdit.value = false
  currentGift.value = {
    id: '',
    title: '',
    image: '',
    svga: '',
    money: 0,
    type: 0,
    is_vip: 0,
    tian: 0,
    status: 1,
    sort: 0
  }
  showGiftModal.value = true
}

const editGift = (gift) => {
  isGiftEdit.value = true
  currentGift.value = {
    id: gift.id,
    title: gift.title,
    image: gift.image || '',
    svga: gift.svga || '',
    money: gift.money,
    type: gift.type || 0,
    is_vip: gift.is_vip || 0,
    tian: gift.tian || 0,
    status: gift.status,
    sort: gift.sort || 0
  }
  showGiftModal.value = true
}

const saveGift = async () => {
  if (!currentGift.value.title || !currentGift.value.image || currentGift.value.money === undefined) {
    toast('请填写必填项（礼物名称、图片、价格）')
    return
  }

  try {
    const result = isGiftEdit.value
      ? await adminService.updateGift(currentGift.value.id, currentGift.value)
      : await adminService.createGift(currentGift.value)
    
    if (result.code === 200 || result.code === 0) {
      toast('保存成功')
      showGiftModal.value = false
      loadGifts()
    } else {
      toast(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存失败:', err)
    toast('保存失败')
  }
}

const toggleGiftStatus = async (gift) => {
  const newStatus = gift.status === 1 ? 0 : 1
  try {
    const result = await adminService.updateGift(gift.id, { ...gift, status: newStatus })
    if (result.code === 200 || result.code === 0) {
      gift.status = newStatus
      toast('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
  }
}

const deleteGift = async (gift) => {
  if (!(await confirm(`确定要删除礼物 ${gift.title} 吗？`)) {
    return
  }
  
  try {
    const result = await adminService.deleteGift(gift.id)
    if (result.code === 200 || result.code === 0) {
      toast('删除成功')
      loadGifts()
    }
  } catch (err) {
    console.error('删除失败:', err)
    toast('删除失败')
  }
}

const loadGiftLogs = async () => {
  try {

    const result = await adminService.getGiftLogs({ page: page.value, pageSize: pageSize.value, userId: searchKeyword.value || undefined })
    if (result.code === 200 || result.code === 0) {
      giftLogList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || giftLogList.value.length
    }
  } catch (err) {
    console.error('加载礼物记录失败:', err)
  }
}

const viewGiftLog = (log) => {
  toast(`礼物记录详情：\nID: ${log.id}\n赠送用户: ${log.fromNickname || '用户' + log.fromUserId}\n接收用户: ${log.toNickname || '用户' + log.toUserId}\n礼物: ${log.giftName}\n数量: ${log.count}\n总金额: ${log.amount} 金币\n时间: ${formatTime(log.createTime)}`)
}

const getRoleName = (role) => {
  const roleMap = {
    default: '默认',
    companion: '陪玩师',
    guide: '向导',
    assistant: '助手'
  }
  return roleMap[role] || '默认'
}

const getStyleName = (style) => {
  const styleMap = {
    friendly: '友好亲切',
    professional: '专业严谨',
    humorous: '幽默风趣',
    cute: '可爱俏皮',
    warm: '温柔体贴',
    passionate: '热情开朗',
    mature: '成熟稳重',
    lively: '活泼阳光',
    elegant: '优雅大方',
    cool: '高冷酷拽',
    caring: '暖心关怀',
    witty: '机智健谈',
    calm: '沉稳内敛',
    easygoing: '风趣随和',
    intellectual: '知性优雅',
    bold: '豪爽直率',
    artistic: '文艺清新',
    bossy: '霸道总裁',
    brotherly: '邻家大哥',
    sweetheart: '软萌甜心',
    tsundere: '腹黑傲娇',
    free: '潇洒不羁',
    gentle: '温文尔雅',
    sunny: '阳光开朗',
    mysterious: '神秘莫测',
    sincere: '真诚朴实',
    chatty: '话痨社牛',
    composed: '淡定从容',
    kind: '热心肠',
    sarcastic: '毒舌吐槽',
    devoted: '痴情专一',
    carefree: '洒脱自由',
  }
  if (!style) return ''
  const arr = Array.isArray(style) ? style : String(style).split(',').filter(Boolean)
  return arr.map(s => styleMap[s] || s).join('、')
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString()
}

const companionStatusText = (status) => {
  const map = { 0: '未申请', 1: '审核中', 2: '已通过' }
  return map[status] || '未知'
}

const companionStatusClass = (status) => {
  const map = { 0: 'disabled', 1: 'pending', 2: 'approved' }
  return map[status] || 'disabled'
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadCurrentPageData()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadCurrentPageData()
  }
}



const loadPosts = async () => {
  try {
    const result = await adminService.getPosts({ page: page.value, pageSize: pageSize.value, keyword: searchKeyword.value || undefined })
    if (result.code === 200 || result.code === 0) {
      postList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || postList.value.length
    }
  } catch (err) {
    console.error('加载帖子列表失败:', err)
  }
}

const viewPost = (post) => {
  toast(`查看帖子详情：\nID: ${post.id}\n用户: ${post.userId}\n内容: ${post.content?.substring(0, 50)}...`)
}

const deletePost = async (post) => {
  if (!(await confirm('确定要删除这条帖子吗？')) {
    return
  }
  
  try {
    const result = await adminService.deletePost(post.id)
    if (result.code === 200 || result.code === 0) {
      toast('删除成功')
      loadPosts()
    }
  } catch (err) {
    console.error('删除失败:', err)
    toast('删除失败')
  }
}

const loadReports = async () => {
  try {
    const result = await adminService.getReports({ page: page.value, pageSize: pageSize.value, status: filterStatus.value || undefined })
    if (result.code === 200 || result.code === 0) {
      reportList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || reportList.value.length
    }
  } catch (err) {
    console.error('加载举报列表失败:', err)
  }
}

const viewReport = (report) => {
  toast(`查看举报详情：\nID: ${report.id}\n举报人: ${report.reporterName || '用户' + report.reporterId}\n类型: ${report.targetType}\n内容: ${report.targetContent?.substring(0, 50)}...\n原因: ${report.reason}`)
}

const handleReport = async (report, status) => {
  try {
    const result = await adminService.updateReportStatus(report.id, { status })
    if (result.code === 200 || result.code === 0) {
      toast(status === 'resolved' ? '举报已处理' : '举报已驳回')
      loadReports()
    }
  } catch (err) {
    console.error('处理举报失败:', err)
  }
}

const loadVipPackages = async () => {
  try {
    const result = await adminService.getVipPackages({ page: page.value, pageSize: pageSize.value })
    if (result.code === 200 || result.code === 0) {
      vipPackageList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || vipPackageList.value.length
    }
  } catch (err) {
    console.error('加载VIP套餐失败:', err)
  }
}

const openCreateVipModal = () => {
  isVipEdit.value = false
  currentVipPackage.value = {
    id: '',
    name: '',
    price: 0,
    originalPrice: 0,
    duration: 30,
    level: 1,
    hot: 0,
    sort: 0,
    status: 1
  }
  showVipModal.value = true
}

const editVipPackage = (pkg) => {
  isVipEdit.value = true
  currentVipPackage.value = {
    id: pkg.id,
    name: pkg.name,
    price: pkg.price,
    originalPrice: pkg.originalPrice || 0,
    duration: pkg.duration,
    level: pkg.level || 1,
    hot: pkg.hot || 0,
    sort: pkg.sort || 0,
    status: pkg.status
  }
  showVipModal.value = true
}

const saveVipPackage = async () => {
  if (!currentVipPackage.value.name || currentVipPackage.value.price === undefined || !currentVipPackage.value.duration) {
    toast('请填写必填项（套餐名称、价格、时长）')
    return
  }

  try {
    const result = isVipEdit.value
      ? await adminService.updateVipPackage(currentVipPackage.value.id, currentVipPackage.value)
      : await adminService.createVipPackage(currentVipPackage.value)
    if (result.code === 200 || result.code === 0) {
      toast('保存成功')
      showVipModal.value = false
      loadVipPackages()
    } else {
      toast(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存失败:', err)
    toast('保存失败')
  }
}

const toggleVipPackageStatus = async (pkg) => {
  const newStatus = pkg.status === 1 ? 0 : 1
  try {
    const result = await adminService.updateVipPackageStatus(pkg.id, newStatus)
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      pkg.status = newStatus
      toast('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
  }
}

const deleteVipPackage = async (pkg) => {
  if (!(await confirm(`确定要删除VIP套餐 ${pkg.name} 吗？`)) {
    return
  }
  
  try {
    const result = await adminService.deleteVipPackage(pkg.id)
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      toast('删除成功')
      loadVipPackages()
    }
  } catch (err) {
    console.error('删除失败:', err)
    toast('删除失败')
  }
}

const loadRecharges = async () => {
  try {

    const result = await adminService.getRecharges({ page: page.value, pageSize: pageSize.value, userId: searchKeyword.value || undefined, status: filterStatus.value || undefined })
    if (result.code === 200 || result.code === 0) {
      rechargeList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || rechargeList.value.length
    }
  } catch (err) {
    console.error('加载充值记录失败:', err)
  }
}

const viewRecharge = (recharge) => {
  toast(`查看充值记录详情：\nID: ${recharge.id}\n订单号: ${recharge.orderNo}\n用户: ${recharge.userId}\n金额: ${recharge.amount} 金币\n支付方式: ${recharge.paymentMethod}\n状态: ${recharge.status}`)
}

const loadGames = async () => {
  try {

    const result = await adminService.getGames({ page: page.value, pageSize: pageSize.value })
    if (result.code === 200 || result.code === 0) {
      gameList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || gameList.value.length
    }
  } catch (err) {
    console.error('加载服务分类失败:', err)
  }
}

const openCreateGameModal = () => {
  isGameEdit.value = false
  currentGame.value = {
    id: '',
    name: '',
    icon: '',
    description: '',
    sort: 0,
    status: 1
  }
  showGameModal.value = true
}

const editGame = (game) => {
  isGameEdit.value = true
  currentGame.value = {
    id: game.id,
    name: game.name,
    icon: game.icon || '',
    description: game.description || '',
    sort: game.sort || 0,
    status: game.status
  }
  showGameModal.value = true
}

const saveGame = async () => {
  if (!currentGame.value.name) {
    toast('请填写分类名称')
    return
  }

  try {
    const result = isGameEdit.value
      ? await adminService.updateGame(currentGame.value.id, currentGame.value)
      : await adminService.createGame(currentGame.value)
    if (result.code === 200 || result.code === 0) {
      toast('保存成功')
      showGameModal.value = false
      loadGames()
    } else {
      toast(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存失败:', err)
    toast('保存失败')
  }
}

const toggleGameStatus = async (game) => {
  const newStatus = game.status === 1 ? 0 : 1
  try {
    const result = await adminService.updateGame(game.id, { ...game, status: newStatus })
    if (result.code === 200 || result.code === 0) {
      game.status = newStatus
      toast('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
  }
}

const deleteGame = async (game) => {
  if (!(await confirm(`确定要删除服务分类 ${game.name} 吗？`)) {
    return
  }
  
  try {
    const result = await adminService.deleteGame(game.id)
    if (result.code === 200 || result.code === 0) {
      toast('删除成功')
      loadGames()
    }
  } catch (err) {
    console.error('删除失败:', err)
    toast('删除失败')
  }
}

const loadBanners = async () => {
  try {

    const result = await adminService.getBanners({ page: page.value, pageSize: pageSize.value, status: filterStatus.value || undefined })
    if (result.code === 200 || result.code === 0) {
      bannerList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || bannerList.value.length
    }
  } catch (err) {
    console.error('加载Banner列表失败:', err)
  }
}

const openCreateBannerModal = () => {
  isBannerEdit.value = false
  currentBanner.value = {
    id: '',
    title: '',
    image: '',
    link: '',
    sort: 0,
    status: 1
  }
  showBannerModal.value = true
}

const editBanner = (banner) => {
  isBannerEdit.value = true
  currentBanner.value = {
    id: banner.id,
    title: banner.title,
    image: banner.image,
    link: banner.link || '',
    sort: banner.sort || 0,
    status: banner.status
  }
  showBannerModal.value = true
}

const saveBanner = async () => {
  if (!currentBanner.value.title || !currentBanner.value.image) {
    toast('请填写标题和图片URL')
    return
  }

  try {
    const result = isBannerEdit.value
      ? await adminService.updateBanner(currentBanner.value.id, currentBanner.value)
      : await adminService.createBanner(currentBanner.value)
    if (result.code === 200 || result.code === 0) {
      toast('保存成功')
      showBannerModal.value = false
      loadBanners()
    } else {
      toast(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存失败:', err)
    toast('保存失败')
  }
}

const toggleBannerStatus = async (banner) => {
  const newStatus = banner.status === 1 ? 0 : 1
  try {
    const result = await adminService.updateBanner(banner.id, { ...banner, status: newStatus })
    if (result.code === 200 || result.code === 0) {
      banner.status = newStatus
      toast('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
  }
}

const deleteBanner = async (banner) => {
  if (!(await confirm(`确定要删除Banner ${banner.title}吗？`)) {
    return
  }
  
  try {
    const result = await adminService.deleteBanner(banner.id)
    if (result.code === 200 || result.code === 0) {
      toast('删除成功')
      loadBanners()
    }
  } catch (err) {
    console.error('删除失败:', err)
    toast('删除失败')
  }
}

const loadApplications = async () => {
  try {

    const result = await adminService.getCompanionApplications({ page: page.value, pageSize: pageSize.value, status: filterStatus.value || undefined })
    if (result.code === 200 || result.code === 0) {
      applicationList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || applicationList.value.length
    }
  } catch (err) {
    console.error('加载服务申请失败:', err)
  }
}

const viewApplication = (app) => {
  toast(`查看服务申请详情：\nID: ${app.id}\n用户: ${app.userId}\n服务类型: ${app.gameName || '游戏陪玩'}\n申请时间: ${formatTime(app.createTime)}\n状态: ${app.status}`)
}

const approveApplication = async (app) => {
  try {
    const result = await adminService.approveCompanionApplication(app.id)
    if (result.code === 200 || result.code === 0) {
      toast('申请已通过')
      loadApplications()
    }
  } catch (err) {
    console.error('审核失败:', err)
  }
}

const rejectApplication = async (app) => {
  try {
    const result = await adminService.rejectCompanionApplication(app.id)
    if (result.code === 200 || result.code === 0) {
      toast('申请已拒绝')
      loadApplications()
    }
  } catch (err) {
    console.error('审核失败:', err)
  }
}

const loadSettings = async () => {
  try {
    const result = await adminService.getSystemSettings()
    if (result.code === 200 || result.code === 0) {
      systemSettings.value = { ...systemSettings.value, ...result.data }
    }
  } catch (err) {
    console.error('加载设置失败:', err)
  }
}

const saveSettings = async () => {
  try {
    const result = await adminService.updateSystemSettings(systemSettings.value)
    if (result.code === 200 || result.code === 0) {
      toast('设置保存成功')
    } else {
      toast(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存设置失败:', err)
    toast('保存失败')
  }
}

// 管理员和角色相关函数
const loadCurrentPageData = async () => {
  switch (currentPage.value) {
    case 'dashboard':
      break
    case 'users':
      await loadUsers()
      break
    case 'orders':
      await loadOrders()
      break
    case 'withdraws':
      await loadWithdraws()
      break
    case 'posts':
      await loadPosts()
      break
    case 'reports':
      await loadReports()
      break
    case 'banners':
      await loadBanners()
      break
    case 'vip-packages':
      await loadVipPackages()
      break
    case 'gift-management':
      await loadGifts()
      break
    case 'gifts':
      await loadGiftLogs()
      break
    case 'recharges':
      await loadRecharges()
      break
    case 'games':
      await loadGames()
      break
    case 'companion-applications':
      await loadApplications()
      break
    case 'virtual-users':
      await loadVirtualUsers()
      break
    case 'admins':
      await loadAdmins()
      await loadRoles()
      await loadPermissions()
      break
    case 'roles':
      await loadRoles()
      await loadPermissions()
      break
    case 'settings':
      await loadSettings()
      break
    case 'recommend':
      await loadRecommendUsers()
      loadManualRecommendList()
      break
  }
}

const loadAdmins = async () => {
  try {

    const result = await adminManageService.getAdmins({ page: page.value, pageSize: pageSize.value, keyword: searchKeyword.value || undefined, status: filterStatus.value || undefined })
    if (result.code === 200 || result.code === 0) {
      adminList.value = result.data.list || []
      total.value = result.data.pagination?.total || adminList.value.length
    }
  } catch (err) {
    console.error('加载管理员列表失败:', err)
  }
}

const openCreateAdminModal = async () => {
  isAdminEdit.value = false
  currentAdmin.value = {
    id: '',
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    role_id: 0,
    permissions: [],
    status: 1
  }
  // 确保权限数据已加载
  if (!allPermissions.value || allPermissions.value.length === 0) {
    await loadPermissions()
  }
  showAdminModal.value = true
}

const editAdmin = async (admin) => {
  isAdminEdit.value = true
  // 确保权限数据已加载
  if (!allPermissions.value || allPermissions.value.length === 0) {
    await loadPermissions()
  }
  currentAdmin.value = {
    id: admin.id,
    username: admin.username,
    password: '',
    nickname: admin.nickname,
    email: admin.email,
    phone: admin.phone,
    role_id: admin.role_id,
    permissions: admin.permissions ? (Array.isArray(admin.permissions) ? admin.permissions : JSON.parse(admin.permissions)) : [],
    status: admin.status
  }
  showAdminModal.value = true
}

const saveAdmin = async () => {
  try {
    const data = { ...currentAdmin.value }
    if (!isAdminEdit.value && !data.password) {
      toast('请输入密码')
      return
    }
    if (isAdminEdit.value) {
      delete data.password
    }

    const result = isAdminEdit.value
      ? await adminManageService.updateAdmin(currentAdmin.value.id, data)
      : await adminManageService.createAdmin(data)
    if (result.code === 200 || result.code === 0) {
      toast(isAdminEdit.value ? '更新成功' : '创建成功')
      showAdminModal.value = false
      loadAdmins()
    } else {
      toast(result.message || '操作失败')
    }
  } catch (err) {
    console.error('保存管理员失败:', err)
    toast('保存失败')
  }
}

const deleteAdmin = async (admin) => {
  if (!(await confirm(`确定要删除管理员 ${admin.username} 吗？`)) {
    return
  }
  
  try {
    const result = await adminManageService.deleteAdmin(admin.id)
    if (result.code === 200 || result.code === 0) {
      toast('删除成功')
      loadAdmins()
    }
  } catch (err) {
    console.error('删除失败:', err)
    toast('删除失败')
  }
}

// 管理员权限全选/全不选
const selectAllAdminPermissions = () => {
  if (allPermissions.value) {
    currentAdmin.value.permissions = allPermissions.value.map(perm => perm.id)
  }
}

const deselectAllAdminPermissions = () => {
  currentAdmin.value.permissions = []
}

// 角色权限全选/全不选
const selectAllRolePermissions = () => {
  if (allPermissions.value) {
    currentRole.value.permissions = allPermissions.value.map(perm => perm.id)
  }
}

const deselectAllRolePermissions = () => {
  currentRole.value.permissions = []
}

const openPasswordModal = (admin) => {
  passwordAdminId.value = admin.id
  passwordForm.value = {
    oldPassword: '',
    newPassword: ''
  }
  showPasswordModal.value = true
}

const updatePassword = async () => {
  if (!passwordForm.value.newPassword) {
    toast('请输入新密码')
    return
  }

  try {
    const result = await adminManageService.updateAdminPassword(passwordAdminId.value, passwordForm.value)
    if (result.code === 200 || result.code === 0) {
      toast('密码修改成功')
      showPasswordModal.value = false
    } else {
      toast(result.message || '修改失败')
    }
  } catch (err) {
    console.error('修改密码失败:', err)
    toast('修改失败')
  }
}

const loadRoles = async () => {
  try {
    const result = await adminManageService.getRoles()
    if (result.code === 200 || result.code === 0) {
      roleList.value = result.data || []
    }
  } catch (err) {
    console.error('加载角色列表失败:', err)
  }
}

const loadPermissions = async () => {
  try {
    const result = await adminManageService.getPermissions()
    if (result.code === 200 || result.code === 0) {
      allPermissions.value = result.data || []
    }
  } catch (err) {
    console.error('加载权限列表失败:', err)
  }
}

const openCreateRoleModal = async () => {
  isRoleEdit.value = false
  currentRole.value = {
    id: '',
    name: '',
    description: '',
    permissions: [],
    status: 1,
    sort: 0
  }
  // 确保权限数据已加载
  if (!allPermissions.value || allPermissions.value.length === 0) {
    await loadPermissions()
  }
  showRoleModal.value = true
}

const editRole = async (role) => {
  if (role.is_super) {
    toast('超级管理员角色不可编辑')
    return
  }
  isRoleEdit.value = true
  // 确保权限数据已加载
  if (!allPermissions.value || allPermissions.value.length === 0) {
    await loadPermissions()
  }
  currentRole.value = {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions ? (Array.isArray(role.permissions) ? role.permissions : JSON.parse(role.permissions)) : [],
    status: role.status,
    sort: role.sort
  }
  showRoleModal.value = true
}

const saveRole = async () => {
  try {
    if (!currentRole.value.name) {
      toast('请输入角色名称')
      return
    }
    
    const result = isRoleEdit.value
      ? await adminManageService.updateRole(currentRole.value.id, currentRole.value)
      : await adminManageService.createRole(currentRole.value)
    if (result.code === 200 || result.code === 0) {
      toast(isRoleEdit.value ? '更新成功' : '创建成功')
      showRoleModal.value = false
      loadRoles()
    } else {
      toast(result.message || '操作失败')
    }
  } catch (err) {
    console.error('保存角色失败:', err)
    toast('保存失败')
  }
}

const deleteRole = async (role) => {
  if (!(await confirm(`确定要删除角色 ${role.name} 吗？`)) {
    return
  }
  
  try {
    const result = await adminManageService.deleteRole(role.id)
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      toast('删除成功')
      loadRoles()
    }
  } catch (err) {
    console.error('删除失败:', err)
    toast('删除失败')
  }
}

const handleLogout = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  window.location.href = '/admin/login'
}

onMounted(async () => {
  token.value = localStorage.getItem('admin_token')
  if (!token.value) {
    window.location.href = '/admin/login'
    return
  }
  initPage()
  // 预先加载权限数据，确保弹窗打开时已有权限选项
  await loadPermissions()
  loadCurrentPageData()
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: var(--bg-secondary);
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.sidebar {
  width: 240px;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  background: #34495e;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
}

.menu {
  flex: 1;
  padding: 10px 0;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #ecf0f1;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #34495e;
}

.menu-item.active {
  background: var(--primary-color);
}

.menu-icon {
  margin-right: 10px;
  font-size: 16px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
}

.top-bar h1 {
  margin: 0;
  font-size: 24px;
  color: var(--text-primary);
}

.logout-btn {
  padding: 8px 16px;
  background: var(--danger-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.content {
  flex: 1;
  padding: 30px;
}

.dashboard .stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: var(--shadow-light);
}

.stat-icon {
  font-size: 40px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-primary);
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--text-primary);
}

.add-btn {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  max-width: 400px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.search-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.search-btn {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.data-table {
  width: 100%;
  background: var(--bg-primary);
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
}

.data-table th {
  background: var(--bg-secondary);
  font-weight: 600;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.detail-avatar {
  text-align: center;
  margin-bottom: 20px;
}

.detail-avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary-color);
}

.avatar-placeholder-large {
  font-size: 64px;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table tr {
  border-bottom: 1px solid var(--border-light);
}

.detail-table td {
  padding: 10px 8px;
  font-size: 14px;
  color: var(--text-primary);
}

.detail-label {
  color: var(--text-secondary);
  font-weight: 500;
  width: 100px;
  white-space: nowrap;
}

.user-detail-modal {
  max-width: 500px;
}

.detail-section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
  margin-top: 20px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light);
}

.service-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.service-badge.vip {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #fff;
}

.service-badge.approved {
  background: var(--success-light);
  color: var(--success-color);
}

.service-badge.pending {
  background: var(--warning-light);
  color: var(--warning-color);
}

.service-badge.disabled {
  background: var(--bg-secondary);
  color: var(--text-muted);
}

.service-detail {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.user-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.gift-avatar {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 24px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.active {
  background: var(--success-light);
  color: var(--success-color);
}

.status-badge.disabled {
  background: #ffebee;
  color: #d32f2f;
}

.status-badge.pending {
  background: #fff3e0;
  color: #e65100;
}

.status-badge.approved {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.rejected {
  background: #ffebee;
  color: #d32f2f;
}

/* ========== 订单状态徽标 ========== */
.order-status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.order-status-badge.status-pending {
  background: #fff3e0;
  color: #e65100;
}

.order-status-badge.status-waiting {
  background: #e3f2fd;
  color: #1565c0;
}

.order-status-badge.status-ongoing {
  background: #f3e5f5;
  color: #7b1fa2;
}

.order-status-badge.status-completed {
  background: #e8f5e9;
  color: #2e7d32;
}

.order-status-badge.status-cancelled {
  background: #ffebee;
  color: #c62828;
}

.order-no-cell {
  font-family: monospace;
  font-size: 12px;
}

/* ========== 服务类型标签 ========== */
.service-type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.service-type-tag.service-type-0 {
  background: #e3f2fd;
  color: #1565c0;
}

.service-type-tag.service-type-1 {
  background: #fff3e0;
  color: #e65100;
}

.service-type-tag.service-type-2 {
  background: #f3e5f5;
  color: #7b1fa2;
}

.action-btn {
  padding: 4px 8px;
  margin-right: 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn.delete-btn {
  background: #e74c3c;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
}

.page-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.placeholder-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.placeholder-text {
  font-size: 18px;
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 40px;
  padding-left: 240px;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: calc(100vw - 280px);
  max-width: none !important;
  border-radius: 8px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.btn-cancel {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.tag-limit {
  font-weight: 400;
  font-size: 12px;
  color: #999;
}

.style-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.style-tag {
  display: inline-block;
  padding: 6px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  background: #fafafa;
  color: #666;
}

.style-tag:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.style-tag.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: #ff9800;
}

.input-with-random {
  display: flex;
  gap: 6px;
  align-items: center;
}

.input-with-random .form-input {
  flex: 1;
}

.random-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.random-btn:hover {
  border-color: #1890ff;
  background: #e6f7ff;
  transform: rotate(15deg);
}

.batch-btn {
  background: #52c41a !important;
  border-color: #52c41a !important;
}
.batch-btn:hover {
  background: #73d13d !important;
}

.batch-modal .modal-content {
  max-height: 90vh;
}

.form-row {
  display: flex;
  gap: 12px;
}
.form-row .form-group {
  flex: 1;
}

.batch-preview {
  margin-top: 16px;
}
.batch-preview > label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.batch-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 4px;
}

.batch-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 13px;
}
.batch-item:nth-child(even) {
  background: #fafafa;
}

.batch-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.batch-name {
  font-weight: 600;
  min-width: 80px;
  color: #333;
}

.batch-styles {
  color: #888;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-progress {
  font-size: 13px;
  color: #1890ff;
  margin-right: auto;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.region-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
}

.region-display .arrow {
  color: #ccc;
  font-size: 18px;
}

.region-picker {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
}

.picker-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
}

.picker-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.picker-cancel {
  color: #999;
  cursor: pointer;
  font-size: 15px;
}

.picker-confirm {
  color: #3498db;
  font-weight: 500;
  cursor: pointer;
  font-size: 15px;
}

.picker-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.picker-body {
  display: flex;
  overflow: hidden;
  flex: 1;
}

.picker-column {
  flex: 1;
  overflow-y: auto;
  border-right: 1px solid #f0f0f0;
  -webkit-overflow-scrolling: touch;
}

.picker-column:last-child {
  border-right: none;
}

.picker-item {
  padding: 14px 16px;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  text-align: center;
}

.picker-item:hover {
  background: #f9f9f9;
}

.picker-item.active {
  color: #3498db;
  font-weight: 500;
  background: rgba(52, 152, 219, 0.05);
}

/* ========== 地区选择器 - 模态框风格 ========== */
.region-modal {
  max-width: 480px;
  width: 90%;
}

.region-modal-body {
  max-height: 55vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.region-step-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.region-step {
  flex: 1;
  padding: 12px 16px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: #999;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.region-step.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.region-step:hover {
  color: #666;
}

.region-columns {
  flex: 1;
  overflow: hidden;
}

.region-column {
  height: 100%;
  overflow-y: auto;
}

.region-column::-webkit-scrollbar {
  width: 4px;
}

.region-column::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 2px;
}

.region-list {
  padding: 4px 0;
}

.region-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 20px;
  cursor: pointer;
  transition: background 0.15s;
  border-left: 3px solid transparent;
}

.region-item:hover {
  background: #f8f9fa;
}

.region-item.active {
  background: rgba(52, 152, 219, 0.06);
  border-left-color: #3498db;
}

.region-item-name {
  font-size: 14px;
  color: #333;
}

.region-item.active .region-item-name {
  color: #3498db;
  font-weight: 500;
}

.region-item-arrow {
  color: #ccc;
  font-size: 18px;
}

.region-item:hover .region-item-arrow {
  color: #999;
}

/* ========== 添加/编辑用户弹窗样式 ========== */
.user-form-modal {
  max-width: 680px;
  width: 90%;
}

.user-form-modal .modal-body {
  max-height: 60vh;
  overflow-y: auto;
}

.user-form-modal .modal-body::-webkit-scrollbar {
  width: 4px;
}

.user-form-modal .modal-body::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 2px;
}

/* 头像区域 */
.user-form-avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.avatar-preview {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid #e0e0e0;
  background: #fafafa;
}

.avatar-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #bbb;
  font-weight: 300;
}

.avatar-input-group {
  flex: 1;
}

.avatar-input-group .user-field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

/* 双列网格布局 */
.user-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
}

.user-form-grid .form-group {
  margin-bottom: 0;
}

.user-form-grid .form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.user-form-grid .required {
  color: #e74c3c;
}

.user-form-grid .placeholder {
  color: #ccc;
}

.settings-page {
  background: white;
  border-radius: 8px;
  padding: 30px;
}

.settings-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.settings-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.settings-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.add-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.permission-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.permission-item:hover {
  background: #f0f0f0;
}

.admin-list,
.role-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.api-management {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.api-section {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.api-section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.method-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.method-badge.get {
  background: #27ae60;
}

.method-badge.post {
  background: #3498db;
}

.method-badge.put {
  background: #f39c12;
}

.method-badge.delete {
  background: #e74c3c;
}

/* ========== 热门推荐 ========== */
.recommend-page {
  padding: 20px;
}

.recommend-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 4px;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.section-desc {
  margin: 0 0 16px;
  font-size: 13px;
  color: #999;
}

.add-recommend-form {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
}

.form-input {
  flex: 1;
  max-width: 300px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.form-input:focus {
  border-color: #667eea;
}

.score-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-hint {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px dashed #ddd;
  margin-top: 10px;
}

.empty-hint p {
  margin: 0;
  font-size: 14px;
  color: #999;
}

.recommend-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.recommend-tab {
  flex: 1;
  text-align: center;
  padding: 12px 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.recommend-tab.active {
  color: #667eea;
  font-weight: 600;
  border-bottom-color: #667eea;
  background: rgba(102, 126, 234, 0.04);
}

.recommend-tab:hover {
  background: #f9f9f9;
}

.form-hint {
  font-size: 12px;
  color: #999;
  flex: 1;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.15s;
  padding: 0;
  line-height: 1;
}

.sort-btn:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #667eea;
  color: #667eea;
}

.sort-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sort-num {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  min-width: 20px;
  text-align: center;
}

.top-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.top-btn.active {
  background: rgba(255, 215, 0, 0.1);
  border-color: #ffd700;
}

.top-btn:hover {
  border-color: #ccc;
}

.preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.preview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fafafa;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.preview-card:hover {
  border-color: #667eea;
  background: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.preview-rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #666;
  flex-shrink: 0;
}

.preview-card:first-child .preview-rank,
.preview-card:nth-child(2) .preview-rank,
.preview-card:nth-child(3) .preview-rank {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.preview-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  background: #eee;
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.preview-meta {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.top-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255, 215, 0, 0.15);
  color: #b8860b;
  font-weight: 600;
}

.hot-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  background: rgba(255, 87, 34, 0.1);
  color: #ff5722;
  font-weight: 600;
  flex-shrink: 0;
}
</style>
