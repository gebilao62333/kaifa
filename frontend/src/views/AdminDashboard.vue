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
                <div class="stat-value">¥89,012</div>
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
                <th>性别</th>
                <th>VIP等级</th>
                <th>余额</th>
                <th>积分</th>
                <th>状态</th>
                <th>注册时间</th>
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
                <td>{{ user.phone }}</td>
                <td>{{ user.gender === 1 ? '男' : user.gender === 0 ? '女' : '未知' }}</td>
                <td>LV{{ user.vipLv }}</td>
                <td>¥{{ user.money }}</td>
                <td>{{ user.score }}</td>
                <td>
                  <span :class="['status-badge', user.status === 0 ? 'active' : 'disabled']">
                    {{ user.status === 0 ? '正常' : '禁用' }}
                  </span>
                </td>
                <td>{{ formatTime(user.createTime) }}</td>
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

        <!-- 订单管理 -->
        <div v-if="currentPage === 'orders'" class="order-list">
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索订单" class="search-input" />
            <button @click="loadOrders" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>订单ID</th>
                <th>用户</th>
                <th>订单类型</th>
                <th>金额</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orderList" :key="order.id">
                <td>{{ order.id }}</td>
                <td>{{ order.userId }}</td>
                <td>{{ order.type }}</td>
                <td>¥{{ order.amount }}</td>
                <td>
                  <span class="status-badge">{{ order.status }}</span>
                </td>
                <td>{{ formatTime(order.createTime) }}</td>
                <td>
                  <button @click="viewOrder(order)" class="action-btn">查看</button>
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
                <td>¥{{ withdraw.amount }}</td>
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
          </div>

          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索用户名/昵称" class="search-input" />
            <button @click="loadVirtualUsers" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>头像</th>
                <th>用户名</th>
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
                <td>{{ user.username }}</td>
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
                <td>¥{{ gift.money }}</td>
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
                <td>¥{{ log.amount }}</td>
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
                <td>¥{{ pkg.price }}</td>
                <td>{{ pkg.originalPrice ? '¥' + pkg.originalPrice : '-' }}</td>
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
                <td>¥{{ record.amount }}</td>
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
            <label>用户名</label>
            <input v-model="currentUser.username" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input v-model="currentUser.nickname" type="text" class="form-input" />
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
            <label>对话风格</label>
            <select v-model="currentUser.dialogueStyle" class="form-select">
              <option value="friendly">友好亲切</option>
              <option value="professional">专业严谨</option>
              <option value="humorous">幽默风趣</option>
              <option value="cute">可爱俏皮</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="btn-cancel">取消</button>
          <button @click="saveUser" class="btn-save">保存</button>
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

    <!-- 用户创建/编辑弹窗 -->
    <div v-if="showUserModal" class="modal-overlay" @click="showUserModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isUserEdit ? '编辑用户' : '添加用户' }}</h3>
          <button class="close-btn" @click="showUserModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>昵称 *</label>
            <input v-model="currentUserEdit.nickname" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>手机号</label>
            <input v-model="currentUserEdit.phone" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>头像URL</label>
            <input v-model="currentUserEdit.avatar" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>性别</label>
            <select v-model.number="currentUserEdit.gender" class="form-select">
              <option :value="0">女</option>
              <option :value="1">男</option>
              <option :value="2">未知</option>
            </select>
          </div>
          <div class="form-group">
            <label>城市</label>
            <input v-model="currentUserEdit.city" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>个人简介</label>
            <input v-model="currentUserEdit.dec" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>VIP等级</label>
            <input v-model.number="currentUserEdit.vipLv" type="number" class="form-input" min="0" />
          </div>
          <div class="form-group">
            <label>余额</label>
            <input v-model.number="currentUserEdit.money" type="number" class="form-input" min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label>积分</label>
            <input v-model.number="currentUserEdit.score" type="number" class="form-input" min="0" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentUserEdit.status" class="form-select">
              <option :value="0">正常</option>
              <option :value="1">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showUserModal = false" class="btn-cancel">取消</button>
          <button @click="saveUserAccountEdit" class="btn-save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

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
const isUserEdit = ref(false)
const currentUserEdit = ref({
  userId: '',
  nickname: '',
  phone: '',
  avatar: '',
  gender: 2,
  city: '',
  dec: '',
  vipLv: 0,
  money: 0,
  score: 0,
  status: 0
})

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

const getHost = () => {
  return window.globalData?.host || 'http://localhost:3000'
}

const loadUsers = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)
    if (searchKeyword.value) params.append('nickname', searchKeyword.value)
    if (filterStatus.value !== '') params.append('status', filterStatus.value)

    const res = await fetch(`${getHost()}/api/admin/users?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      userList.value = result.data.list || []
      total.value = result.data.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载用户列表失败:', err)
  }
}

const viewUser = (user) => {
  alert(`用户详情:\nID: ${user.userId}\n昵称: ${user.nickname}\n手机号: ${user.phone}\n余额: ${user.money}\n积分: ${user.score}`)
}

const toggleUserStatus = async (user) => {
  const newStatus = user.status === 0 ? 1 : 0
  try {
    const res = await fetch(`${getHost()}/api/admin/users/${user.userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ status: newStatus })
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      user.status = newStatus
      alert('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
    alert('更新状态失败')
  }
}

const openCreateUserAccountModal = () => {
  isUserEdit.value = false
  currentUserEdit.value = {
    userId: '',
    nickname: '',
    phone: '',
    avatar: '',
    gender: 2,
    city: '',
    dec: '',
    vipLv: 0,
    money: 0,
    score: 0,
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
    avatar: user.avatar || '',
    gender: user.gender !== undefined ? user.gender : 2,
    city: user.city || '',
    dec: user.dec || '',
    vipLv: user.vipLv || 0,
    money: user.money || 0,
    score: user.score || 0,
    status: user.status || 0
  }
  showUserModal.value = true
}

const saveUserAccountEdit = async () => {
  if (!currentUserEdit.value.nickname) {
    alert('请输入用户昵称')
    return
  }

  try {
    const url = isUserEdit.value 
      ? `${getHost()}/api/admin/users/${currentUserEdit.value.userId}`
      : `${getHost()}/api/admin/users`
    const method = isUserEdit.value ? 'PUT' : 'POST'
    
    const data = {
      nickname: currentUserEdit.value.nickname,
      phone: currentUserEdit.value.phone,
      avatar: currentUserEdit.value.avatar,
      sex: currentUserEdit.value.gender,
      city: currentUserEdit.value.city,
      dec: currentUserEdit.value.dec,
      vipLv: currentUserEdit.value.vipLv,
      money: currentUserEdit.value.money,
      score: currentUserEdit.value.score,
      status: currentUserEdit.value.status
    }
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(data)
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert(isUserEdit.value ? '更新成功' : '创建成功')
      showUserModal.value = false
      loadUsers()
    } else {
      alert(result.message || '操作失败')
    }
  } catch (err) {
    console.error('保存用户失败:', err)
    alert('保存失败')
  }
}

const deleteUserAccount = async (user) => {
  if (!confirm(`确定要删除用户 ${user.nickname} 吗？`)) {
    return
  }
  
  try {
    const res = await fetch(`${getHost()}/api/admin/users/${user.userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('删除成功')
      loadUsers()
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败')
  }
}

const loadOrders = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)

    const res = await fetch(`${getHost()}/api/admin/orders?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      orderList.value = result.data.list || []
      total.value = result.data.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载订单列表失败:', err)
  }
}

const viewOrder = (order) => {
  alert('查看订单详情: ' + order.id)
}

const loadWithdraws = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)

    const res = await fetch(`${getHost()}/api/admin/withdraws?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      withdrawList.value = result.data.list || []
      total.value = result.data.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载提现列表失败:', err)
  }
}

const viewWithdraw = (withdraw) => {
  alert('查看提现详情: ' + withdraw.id)
}

const loadVirtualUsers = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)

    const res = await fetch(`${getHost()}/api/admin/virtual-users?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
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
    username: '',
    nickname: '',
    avatar: '',
    role: 'default',
    dialogueStyle: 'friendly',
    status: 1,
    isOnline: 1
  }
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
    dialogueStyle: user.dialogueStyle || 'friendly',
    status: user.status,
    isOnline: user.isOnline
  }
  showModal.value = true
}

const saveUser = async () => {
  if (!currentUser.value.username || !currentUser.value.nickname) {
    alert('请填写完整信息')
    return
  }

  try {
    const url = isEdit.value 
      ? `${getHost()}/api/admin/virtual-users/${currentUser.value.id}`
      : `${getHost()}/api/admin/virtual-users`
    const method = isEdit.value ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(currentUser.value)
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('保存成功')
      showModal.value = false
      loadVirtualUsers()
    } else {
      alert(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存失败:', err)
    alert('保存失败')
  }
}

const toggleStatus = async (user) => {
  const newStatus = user.status === 1 ? 0 : 1
  try {
    const res = await fetch(`${getHost()}/api/admin/virtual-users/${user.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ status: newStatus })
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      user.status = newStatus
      alert('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
  }
}

const deleteUser = async (user) => {
  if (!confirm(`确定要删除用户 ${user.nickname} 吗？`)) {
    return
  }
  
  try {
    const res = await fetch(`${getHost()}/api/admin/virtual-users/${user.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('删除成功')
      loadVirtualUsers()
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败')
  }
}

const loadGifts = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)
    if (searchKeyword.value) params.append('keyword', searchKeyword.value)
    if (filterStatus.value !== '') params.append('status', filterStatus.value)

    const res = await fetch(`${getHost()}/api/admin/gifts?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
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
    alert('请填写必填项（礼物名称、图片、价格）')
    return
  }

  try {
    const url = isGiftEdit.value 
      ? `${getHost()}/api/admin/gifts/${currentGift.value.id}`
      : `${getHost()}/api/admin/gifts`
    const method = isGiftEdit.value ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(currentGift.value)
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('保存成功')
      showGiftModal.value = false
      loadGifts()
    } else {
      alert(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存失败:', err)
    alert('保存失败')
  }
}

const toggleGiftStatus = async (gift) => {
  const newStatus = gift.status === 1 ? 0 : 1
  try {
    const res = await fetch(`${getHost()}/api/admin/gifts/${gift.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ ...gift, status: newStatus })
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      gift.status = newStatus
      alert('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
  }
}

const deleteGift = async (gift) => {
  if (!confirm(`确定要删除礼物 ${gift.title} 吗？`)) {
    return
  }
  
  try {
    const res = await fetch(`${getHost()}/api/admin/gifts/${gift.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('删除成功')
      loadGifts()
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败')
  }
}

const loadGiftLogs = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)
    if (searchKeyword.value) params.append('keyword', searchKeyword.value)

    const res = await fetch(`${getHost()}/api/admin/gift-logs?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      giftLogList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || giftLogList.value.length
    }
  } catch (err) {
    console.error('加载礼物记录失败:', err)
  }
}

const viewGiftLog = (log) => {
  alert(`礼物记录详情：\nID: ${log.id}\n赠送用户: ${log.fromNickname || '用户' + log.fromUserId}\n接收用户: ${log.toNickname || '用户' + log.toUserId}\n礼物: ${log.giftName}\n数量: ${log.count}\n总金额: ¥${log.amount}\n时间: ${formatTime(log.createTime)}`)
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
    cute: '可爱俏皮'
  }
  return styleMap[style] || '友好亲切'
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString()
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
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)
    if (searchKeyword.value) params.append('keyword', searchKeyword.value)

    const res = await fetch(`${getHost()}/api/admin/posts?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      postList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || postList.value.length
    }
  } catch (err) {
    console.error('加载帖子列表失败:', err)
  }
}

const viewPost = (post) => {
  alert(`查看帖子详情：\nID: ${post.id}\n用户: ${post.userId}\n内容: ${post.content?.substring(0, 50)}...`)
}

const deletePost = async (post) => {
  if (!confirm('确定要删除这条帖子吗？')) {
    return
  }
  
  try {
    const res = await fetch(`${getHost()}/api/admin/posts/${post.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('删除成功')
      loadPosts()
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败')
  }
}

const loadReports = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)
    if (filterStatus.value !== '') params.append('status', filterStatus.value)

    const res = await fetch(`${getHost()}/api/admin/reports?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      reportList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || reportList.value.length
    }
  } catch (err) {
    console.error('加载举报列表失败:', err)
  }
}

const viewReport = (report) => {
  alert(`查看举报详情：\nID: ${report.id}\n举报人: ${report.reporterName || '用户' + report.reporterId}\n类型: ${report.targetType}\n内容: ${report.targetContent?.substring(0, 50)}...\n原因: ${report.reason}`)
}

const handleReport = async (report, status) => {
  try {
    const res = await fetch(`${getHost()}/api/admin/reports/${report.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ status })
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert(status === 'resolved' ? '举报已处理' : '举报已驳回')
      loadReports()
    }
  } catch (err) {
    console.error('处理举报失败:', err)
  }
}

const loadVipPackages = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)

    const res = await fetch(`${getHost()}/api/admin/vip-packages?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
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
    alert('请填写必填项（套餐名称、价格、时长）')
    return
  }

  try {
    const url = isVipEdit.value 
      ? `${getHost()}/api/admin/vip-packages/${currentVipPackage.value.id}`
      : `${getHost()}/api/admin/vip-packages`
    const method = isVipEdit.value ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(currentVipPackage.value)
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('保存成功')
      showVipModal.value = false
      loadVipPackages()
    } else {
      alert(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存失败:', err)
    alert('保存失败')
  }
}

const toggleVipPackageStatus = async (pkg) => {
  const newStatus = pkg.status === 1 ? 0 : 1
  try {
    const res = await fetch(`${getHost()}/api/admin/vip-packages/${pkg.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ ...pkg, status: newStatus })
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      pkg.status = newStatus
      alert('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
  }
}

const deleteVipPackage = async (pkg) => {
  if (!confirm(`确定要删除VIP套餐 ${pkg.name} 吗？`)) {
    return
  }
  
  try {
    const res = await fetch(`${getHost()}/api/admin/vip-packages/${pkg.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('删除成功')
      loadVipPackages()
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败')
  }
}

const loadRecharges = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)
    if (searchKeyword.value) params.append('userId', searchKeyword.value)
    if (filterStatus.value !== '') params.append('status', filterStatus.value)

    const res = await fetch(`${getHost()}/api/admin/recharges?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      rechargeList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || rechargeList.value.length
    }
  } catch (err) {
    console.error('加载充值记录失败:', err)
  }
}

const viewRecharge = (recharge) => {
  alert(`查看充值记录详情：\nID: ${recharge.id}\n订单号: ${recharge.orderNo}\n用户: ${recharge.userId}\n金额: ¥${recharge.amount}\n支付方式: ${recharge.paymentMethod}\n状态: ${recharge.status}`)
}

const loadGames = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)

    const res = await fetch(`${getHost()}/api/admin/games?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
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
    alert('请填写分类名称')
    return
  }

  try {
    const url = isGameEdit.value 
      ? `${getHost()}/api/admin/games/${currentGame.value.id}`
      : `${getHost()}/api/admin/games`
    const method = isGameEdit.value ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(currentGame.value)
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('保存成功')
      showGameModal.value = false
      loadGames()
    } else {
      alert(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存失败:', err)
    alert('保存失败')
  }
}

const toggleGameStatus = async (game) => {
  const newStatus = game.status === 1 ? 0 : 1
  try {
    const res = await fetch(`${getHost()}/api/admin/games/${game.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ ...game, status: newStatus })
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      game.status = newStatus
      alert('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
  }
}

const deleteGame = async (game) => {
  if (!confirm(`确定要删除服务分类 ${game.name} 吗？`)) {
    return
  }
  
  try {
    const res = await fetch(`${getHost()}/api/admin/games/${game.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('删除成功')
      loadGames()
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败')
  }
}

const loadBanners = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)
    if (filterStatus.value !== '') params.append('status', filterStatus.value)

    const res = await fetch(`${getHost()}/api/admin/banners?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
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
    alert('请填写标题和图片URL')
    return
  }

  try {
    const url = isBannerEdit.value 
      ? `${getHost()}/api/admin/banners/${currentBanner.value.id}`
      : `${getHost()}/api/admin/banners`
    const method = isBannerEdit.value ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(currentBanner.value)
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('保存成功')
      showBannerModal.value = false
      loadBanners()
    } else {
      alert(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存失败:', err)
    alert('保存失败')
  }
}

const toggleBannerStatus = async (banner) => {
  const newStatus = banner.status === 1 ? 0 : 1
  try {
    const res = await fetch(`${getHost()}/api/admin/banners/${banner.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ ...banner, status: newStatus })
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      banner.status = newStatus
      alert('状态更新成功')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
  }
}

const deleteBanner = async (banner) => {
  if (!confirm(`确定要删除Banner ${banner.title}吗？`)) {
    return
  }
  
  try {
    const res = await fetch(`${getHost()}/api/admin/banners/${banner.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('删除成功')
      loadBanners()
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败')
  }
}

const loadApplications = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)
    if (filterStatus.value !== '') params.append('status', filterStatus.value)

    const res = await fetch(`${getHost()}/api/admin/companion-applications?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      applicationList.value = result.data.list || result.data || []
      total.value = result.data.pagination?.total || applicationList.value.length
    }
  } catch (err) {
    console.error('加载服务申请失败:', err)
  }
}

const viewApplication = (app) => {
  alert(`查看服务申请详情：\nID: ${app.id}\n用户: ${app.userId}\n服务类型: ${app.gameName || '游戏陪玩'}\n申请时间: ${formatTime(app.createTime)}\n状态: ${app.status}`)
}

const approveApplication = async (app) => {
  try {
    const res = await fetch(`${getHost()}/api/admin/companion-applications/${app.id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('申请已通过')
      loadApplications()
    }
  } catch (err) {
    console.error('审核失败:', err)
  }
}

const rejectApplication = async (app) => {
  try {
    const res = await fetch(`${getHost()}/api/admin/companion-applications/${app.id}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('申请已拒绝')
      loadApplications()
    }
  } catch (err) {
    console.error('审核失败:', err)
  }
}

const loadSettings = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin/settings`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      systemSettings.value = { ...systemSettings.value, ...result.data }
    }
  } catch (err) {
    console.error('加载设置失败:', err)
  }
}

const saveSettings = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(systemSettings.value)
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('设置保存成功')
    } else {
      alert(result.message || '保存失败')
    }
  } catch (err) {
    console.error('保存设置失败:', err)
    alert('保存失败')
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
  }
}

const loadAdmins = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)
    if (searchKeyword.value) params.append('keyword', searchKeyword.value)
    if (filterStatus.value !== '') params.append('status', filterStatus.value)

    const res = await fetch(`${getHost()}/api/admin-manage/admins?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
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
    const url = isAdminEdit.value 
      ? `${getHost()}/api/admin-manage/admins/${currentAdmin.value.id}` 
      : `${getHost()}/api/admin-manage/admins`
    const method = isAdminEdit.value ? 'PUT' : 'POST'
    
    const data = { ...currentAdmin.value }
    if (!isAdminEdit.value && !data.password) {
      alert('请输入密码')
      return
    }
    if (isAdminEdit.value) {
      delete data.password
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(data)
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert(isAdminEdit.value ? '更新成功' : '创建成功')
      showAdminModal.value = false
      loadAdmins()
    } else {
      alert(result.message || '操作失败')
    }
  } catch (err) {
    console.error('保存管理员失败:', err)
    alert('保存失败')
  }
}

const deleteAdmin = async (admin) => {
  if (!confirm(`确定要删除管理员 ${admin.username} 吗？`)) {
    return
  }
  
  try {
    const res = await fetch(`${getHost()}/api/admin-manage/admins/${admin.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('删除成功')
      loadAdmins()
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败')
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
    alert('请输入新密码')
    return
  }

  try {
    const res = await fetch(`${getHost()}/api/admin-manage/admins/${passwordAdminId.value}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(passwordForm.value)
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('密码修改成功')
      showPasswordModal.value = false
    } else {
      alert(result.message || '修改失败')
    }
  } catch (err) {
    console.error('修改密码失败:', err)
    alert('修改失败')
  }
}

const loadRoles = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin-manage/roles`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      roleList.value = result.data || []
    }
  } catch (err) {
    console.error('加载角色列表失败:', err)
  }
}

const loadPermissions = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin-manage/permissions`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const result = await res.json()
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
    alert('超级管理员角色不可编辑')
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
      alert('请输入角色名称')
      return
    }
    
    const url = isRoleEdit.value 
      ? `${getHost()}/api/admin-manage/roles/${currentRole.value.id}` 
      : `${getHost()}/api/admin-manage/roles`
    const method = isRoleEdit.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(currentRole.value)
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert(isRoleEdit.value ? '更新成功' : '创建成功')
      showRoleModal.value = false
      loadRoles()
    } else {
      alert(result.message || '操作失败')
    }
  } catch (err) {
    console.error('保存角色失败:', err)
    alert('保存失败')
  }
}

const deleteRole = async (role) => {
  if (!confirm(`确定要删除角色 ${role.name} 吗？`)) {
    return
  }
  
  try {
    const res = await fetch(`${getHost()}/api/admin-manage/roles/${role.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      alert('删除成功')
      loadRoles()
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败')
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
  background: #f5f5f5;
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
  background: #3498db;
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
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.top-bar h1 {
  margin: 0;
  font-size: 24px;
}

.logout-btn {
  padding: 8px 16px;
  background: #e74c3c;
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
  background: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
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
}

.add-btn {
  padding: 8px 16px;
  background: #3498db;
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
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.data-table {
  width: 100%;
  background: white;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
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
  background: #e3f2fd;
  color: #1976d2;
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
  color: #c62828;
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 90%;
  max-width: 500px;
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

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
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
</style>
