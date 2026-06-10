<template>
  <div class="admin-cards">
    <!-- Tab导航 -->
    <div class="card-tabs">
      <button :class="['tab-btn', { active: activeTab === 'list' }]" @click="activeTab = 'list'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        卡片列表
      </button>
      <button :class="['tab-btn', { active: activeTab === 'stats' }]" @click="activeTab = 'stats'; loadStats(); loadExportLogs()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        统计分析
      </button>

    </div>

    <!-- ============ 卡片列表 Tab ============ -->
    <div v-if="activeTab === 'list'" class="tab-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="search-bar">
          <input v-model="searchKeyword" @keyup.enter="loadCards" type="text" placeholder="搜索卡号..." class="search-input" />
          <select v-model="filterStatus" @change="page=1;loadCards()" class="search-select">
            <option value="">全部状态</option>
            <option value="0">未使用</option>
            <option value="1">已使用</option>
            <option value="2">已过期</option>
            <option value="3">已禁用</option>
          </select>
          <select v-model="filterCategory" @change="page=1;loadCards()" class="search-select">
            <option value="">全部分类</option>
            <option v-for="c in categories" :key="c.key" :value="c.key">{{ c.label }}</option>
          </select>
          <input v-model="filterBatchNo" @keyup.enter="loadCards" type="text" placeholder="批次号" class="search-input batch-input" />
          <button @click="loadCards" class="search-btn">🔍 搜索</button>
          <button @click="resetFilters" class="reset-btn">重置</button>
        </div>
        <div class="toolbar-actions">
          <button @click="openCreateModal()" class="action-btn primary">+ 生成密卡</button>
          <button @click="openImportModal()" class="action-btn outline">📥 导入</button>
          <button @click="openExportModal('')" class="action-btn outline">📤 导出全部</button>
          <button @click="showCategoryModal=true" class="action-btn outline">⚙️ 管理分类</button>
          <button @click="openClearModal" class="action-btn warn-btn">🗑️ 清空密卡</button>
          <button @click="openExportModal(Object.keys(categoryMap))" class="action-btn outline">📤 按分类导出</button>
        </div>
      </div>

      <!-- 批量操作栏 -->
      <div v-if="selectedIds.length > 0" class="batch-bar">
        <span class="batch-info">已选择 <strong>{{ selectedIds.length }}</strong> 张密卡</span>
        <button @click="batchEnable" class="batch-btn enable">启用</button>
        <button @click="batchDisable" class="batch-btn disable">禁用</button>
        <button @click="batchDelete" class="batch-btn del">批量删除</button>
        <button @click="clearSelection" class="batch-btn cancel">取消选择</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state"><div class="loading-spinner"></div><span>加载中...</span></div>

      <!-- 表格 -->
      <div v-else class="table-wrapper">
        <table v-if="cardList.length > 0" class="data-table">
          <thead>
            <tr>
              <th style="width:40px"><input type="checkbox" :checked="isAllSelected" @change="toggleAll" /></th>
              <th>ID</th>
              <th>卡号</th>
              <th>密码</th>
              <th>面值</th>
              <th>金币</th>
              <th>赠送</th>
              <th>分类</th>
              <th>标签</th>
              <th>状态</th>
              <th>批次</th>
              <th>使用者</th>
              <th>过期时间</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(card, $index) in cardList" :key="card?.id || $index">
              <tr v-if="card" :class="{ 'row-disabled': card.status === 3, 'row-expired': card.status === 0 && isExpired(card) }">
                <td><input type="checkbox" :checked="selectedIds.includes(card.id)" @change="toggleSelect(card.id)" /></td>
                <td>{{ card.id }}</td>
                <td><code class="card-no">{{ card.cardNo }}</code></td>
                <td class="pwd-cell">{{ card.cardPwd }}</td>
                <td>¥{{ card.faceValue }}</td>
                <td>{{ card.coinAmount }}</td>
                <td><span class="bonus-badge">+{{ getBonusCoins(card) }}</span></td>
                <td><span class="cat-tag">{{ categoryMap[card.category] || card.category || '-' }}</span></td>
                <td><span class="label-tag" v-if="card.tag">{{ card.tag }}</span><span v-else>-</span></td>
                <td>
                  <span :class="['status-badge', getStatusClass(card)]">{{ card.statusName }}</span>
                </td>
                <td><code class="batch-code" v-if="card.batchNo">{{ card.batchNo }}</code><span v-else>-</span></td>
                <td>{{ card.useUserId ? 'UID:' + card.useUserId : '-' }}</td>
                <td>{{ card.expireTime ? formatTime(card.expireTime * 1000) : '永久' }}</td>
                <td>{{ formatTime(card.createTime) }}</td>
                <td class="actions-cell">
                  <button @click="viewCard(card)" class="row-btn">详情</button>
                  <button @click="openEditModal(card)" class="row-btn edit" v-if="card.status !== 1">编辑</button>
                  <button v-if="card.status === 0 && !isExpired(card)" @click="toggleStatus(card, 3)" class="row-btn warn">禁用</button>
                  <button v-if="card.status === 3" @click="toggleStatus(card, 0)" class="row-btn ok">启用</button>
                  <button v-if="card.status === 0 || card.status === 3" @click="deleteCardItem(card)" class="row-btn del">删除</button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="empty-icon">💳</div>
          <div class="empty-text">暂无密卡数据</div>
          <button @click="openCreateModal()" class="action-btn primary" style="margin-top:16px">生成第一张密卡</button>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 0">
        <div class="pagination-left">
          <span class="page-size-label">每页</span>
          <select v-model.number="pageSize" @change="page=1;loadCards()" class="page-size-select">
            <option :value="20">20</option><option :value="50">50</option><option :value="100">100</option><option :value="200">200</option>
          </select>
          <span class="page-size-label">条，共 {{ total }} 条</span>
        </div>
        <div class="pagination-right">
          <button @click="page=1;loadCards()" class="page-btn" :disabled="page<=1">首页</button>
          <button @click="page--;loadCards()" class="page-btn" :disabled="page<=1">上页</button>
          <template v-for="p in pageNumbers" :key="p">
            <span v-if="p==='...'" class="page-ellipsis">...</span>
            <button v-else @click="page=p;loadCards()" :class="['page-btn',{'page-active':page===p}]">{{ p }}</button>
          </template>
          <button @click="page++;loadCards()" class="page-btn" :disabled="page>=totalPages">下页</button>
          <button @click="page=totalPages;loadCards()" class="page-btn" :disabled="page>=totalPages">末页</button>
        </div>
      </div>
    </div>

    <!-- ============ 统计分析 Tab ============ -->
    <div v-if="activeTab === 'stats'" class="tab-content">
      <div v-if="statsLoading" class="loading-state"><div class="loading-spinner"></div><span>加载统计...</span></div>
      <div v-else-if="statsData" class="stats-panel">
        <!-- 概览卡片 -->
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-value">{{ statsData.overview.totalCount }}</div>
            <div class="stat-label">总数量</div>
            <div class="stat-icon total">💳</div>
          </div>
          <div class="stat-card">
            <div class="stat-value green">{{ statsData.overview.unusedCount }}</div>
            <div class="stat-label">未使用</div>
            <div class="stat-icon unused">✅</div>
          </div>
          <div class="stat-card">
            <div class="stat-value blue">{{ statsData.overview.usedCount }}</div>
            <div class="stat-label">已使用</div>
            <div class="stat-icon used">📋</div>
          </div>
          <div class="stat-card">
            <div class="stat-value orange">{{ statsData.overview.expiredCount }}</div>
            <div class="stat-label">已过期</div>
            <div class="stat-icon expired">⏰</div>
          </div>
          <div class="stat-card">
            <div class="stat-value gray">{{ statsData.overview.disabledCount }}</div>
            <div class="stat-label">已禁用</div>
            <div class="stat-icon disabled">🚫</div>
          </div>
          <div class="stat-card">
            <div class="stat-value purple">¥{{ formatNum(statsData.overview.totalFaceValue) }}</div>
            <div class="stat-label">总面值</div>
            <div class="stat-icon face">💰</div>
          </div>
          <div class="stat-card">
            <div class="stat-value teal">{{ formatNum(statsData.overview.totalCoinAmount) }}</div>
            <div class="stat-label">总金币数</div>
            <div class="stat-icon coin">🪙</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" :class="statsData.overview.useRate > 50 ? 'green' : 'orange'">{{ statsData.overview.useRate }}%</div>
            <div class="stat-label">使用率</div>
            <div class="stat-icon rate">📊</div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="charts-row">
          <!-- 状态分布饼图 -->
          <div class="chart-box">
            <h4 class="chart-title">状态分布</h4>
            <div class="pie-chart">
              <svg viewBox="0 0 200 200" class="pie-svg">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" stroke-width="30" />
                <circle v-for="(seg, i) in pieSegments" :key="i"
                  cx="100" cy="100" r="80" fill="none"
                  :stroke="seg.color" stroke-width="30"
                  :stroke-dasharray="seg.dashArray"
                  :stroke-dashoffset="seg.dashOffset"
                  transform="rotate(-90 100 100)"
                  style="transition: all 0.5s ease" />
              </svg>
              <div class="pie-legend">
                <div v-for="seg in pieSegments" :key="seg.label" class="legend-item">
                  <span class="legend-dot" :style="{background:seg.color}"></span>
                  {{ seg.label }} {{ seg.count }}
                </div>
              </div>
            </div>
          </div>

          <!-- 分类分布柱状图 -->
          <div class="chart-box">
            <h4 class="chart-title">分类分布</h4>
            <div class="bar-chart" v-if="statsData.categoryStats && statsData.categoryStats.length > 0">
              <div v-for="item in statsData.categoryStats" :key="item.name" class="bar-item">
                <span class="bar-label">{{ categoryMap[item.name] || item.name }}</span>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: getBarWidth(item.count) + '%', background: getBarColor(item.name) }"></div>
                </div>
                <span class="bar-count">{{ item.count }}</span>
              </div>
            </div>
            <div v-else class="chart-empty">暂无分类数据</div>
          </div>
        </div>

        <!-- 趋势图 -->
        <div class="chart-box trend-box" v-if="statsData.trendData && statsData.trendData.length > 0">
          <h4 class="chart-title">近30天趋势</h4>
          <div class="trend-chart">
            <div class="trend-y-axis">
              <span v-for="i in 5" :key="i">{{ trendMax - Math.round(trendMax / 5) * (i - 1) }}</span>
            </div>
            <div class="trend-bars">
              <div v-for="(d, i) in statsData.trendData" :key="i" class="trend-bar-group" :title="d.date + ' 创建:' + d.created + ' 使用:' + d.used">
                <div class="trend-bar created" :style="{ height: (d.created / trendMax * 100) + '%' }" v-if="d.created > 0"></div>
                <div class="trend-bar used-bar" :style="{ height: (d.used / trendMax * 100) + '%' }" v-if="d.used > 0"></div>
                <span class="trend-date">{{ d.date.slice(5) }}</span>
              </div>
            </div>
          </div>
          <div class="trend-legend">
            <span><span class="legend-dot" style="background:#7c3aed"></span> 创建</span>
            <span><span class="legend-dot" style="background:#10b981"></span> 使用</span>
          </div>
        </div>

        <!-- 导出记录 -->
        <div class="chart-box export-log-box">
          <div class="export-log-header">
            <h4 class="chart-title">📤 导出记录</h4>
            <button @click="loadExportLogs" class="refresh-btn" :disabled="exportLogLoading">🔄 {{ exportLogLoading ? '刷新中...' : '刷新' }}</button>
          </div>
          <div v-if="exportLogLoading" class="loading-state" style="padding:20px"><div class="loading-spinner"></div></div>
          <div v-else-if="exportLogs.length === 0" class="chart-empty" style="padding:20px">暂无导出记录</div>
          <div v-else class="export-log-table-wrap">
            <table class="export-log-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>导出时间</th>
                  <th>导出范围</th>
                  <th>分类</th>
                  <th>导出张数</th>
                  <th>操作人</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(log, i) in exportLogs" :key="log.id">
                  <td>{{ i + 1 }}</td>
                  <td>{{ log.timeLabel }}</td>
                  <td>{{ log.scope }}</td>
                  <td>{{ log.category }}</td>
                  <td>{{ log.count }}</td>
                  <td>{{ log.operator }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 创建/编辑弹窗 ============ -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal=false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingCard ? '编辑密卡 #' + editingCard.id : '生成密卡' }}</h3>
          <button @click="showCreateModal=false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <!-- 分类选择（首要） -->
          <div class="form-group">
            <label>选择分档</label>
            <select v-model="form.category" @change="applyCategoryDefaults(form.category, form)" class="form-input">
              <option value="">通用（手动填写）</option>
              <option v-for="c in categories" :key="c.key" :value="c.key">{{ c.label }}</option>
            </select>
          </div>

          <!-- 选中分档时展示该分类的完整信息卡片 -->
          <div v-if="selectedCategoryInfo" class="cat-ref-card">
            <div class="cat-ref-header">
              <span class="cat-color-dot" :style="{ background: selectedCategoryInfo.color }"></span>
              <strong>{{ selectedCategoryInfo.label }}</strong>
            </div>
            <div class="cat-ref-body">
              <div class="cat-ref-item">
                <span class="cat-ref-label">面值</span>
                <span class="cat-ref-value">¥{{ selectedCategoryInfo.faceValue }}</span>
              </div>
              <div class="cat-ref-item">
                <span class="cat-ref-label">基础金币</span>
                <span class="cat-ref-value">{{ selectedCategoryInfo.coinAmount }}</span>
              </div>
              <div class="cat-ref-item" v-if="selectedCategoryInfo.bonusCoins > 0">
                <span class="cat-ref-label">赠送金币</span>
                <span class="cat-ref-value bonus-text">+{{ selectedCategoryInfo.bonusCoins }}</span>
              </div>
            </div>
          </div>

          <!-- 通用模式 / 手动调整 -->
          <div class="form-row" v-if="!selectedCategoryInfo">
            <div class="form-group"><label>面值（元）</label><input v-model.number="form.faceValue" type="number" placeholder="100" min="1" class="form-input" /></div>
            <div class="form-group"><label>兑换金币数</label><input v-model.number="form.coinAmount" type="number" placeholder="100" min="1" class="form-input" /></div>
          </div>
          <div class="form-row" v-else>
            <div class="form-group"><label>面值（元）<span class="field-hint">已按分档预填</span></label><input v-model.number="form.faceValue" type="number" placeholder="100" min="1" class="form-input" /></div>
            <div class="form-group"><label>兑换金币数<span class="field-hint">已按分档预填</span></label><input v-model.number="form.coinAmount" type="number" placeholder="100" min="1" class="form-input" /></div>
          </div>

          <div class="form-row">
            <div class="form-group"><label>有效期（天，0=永久）</label><input v-model.number="form.expireDays" type="number" placeholder="365" min="0" class="form-input" /></div>
            <div class="form-group" v-if="!editingCard"><label>生成数量（1~1000）</label><input v-model.number="form.count" type="number" placeholder="1" min="1" max="1000" class="form-input" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>卡号前缀（留空自动生成）</label><input v-model="form.cardNo" type="text" placeholder="如: VIP2026" class="form-input" :disabled="!!editingCard" /></div>
            <div class="form-group"><label>密码（留空随机生成）</label><input v-model="form.cardPwd" type="text" placeholder="8位随机密码" class="form-input" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>标签</label><input v-model="form.tag" type="text" placeholder="如: 春节活动" class="form-input" /></div>
            <div class="form-group"><label>备注</label><input v-model="form.remark" type="text" placeholder="可选备注" class="form-input" /></div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="submitForm" :disabled="submitting" class="confirm-btn">{{ submitting ? '提交中...' : (editingCard ? '保存修改' : '确认生成') }}</button>
          <button @click="showCreateModal=false" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal=false">
      <div class="modal-content">
        <div class="modal-header"><h3>密卡详情 #{{ currentCard.id }}</h3><button @click="showDetailModal=false" class="close-btn">&times;</button></div>
        <div class="modal-body detail-grid">
          <div class="detail-item"><span class="detail-label">卡号</span><code>{{ currentCard.cardNo }}</code></div>
          <div class="detail-item"><span class="detail-label">密码</span><span class="pwd-full">{{ currentCard.cardPwd }}</span></div>
          <div class="detail-item"><span class="detail-label">面值</span>¥{{ currentCard.faceValue }}</div>
          <div class="detail-item"><span class="detail-label">金币数</span>{{ currentCard.coinAmount }} 金币</div>
          <div class="detail-item"><span class="detail-label">赠送金币</span><span class="bonus-text">+{{ getBonusCoins(currentCard) }}</span></div>
          <div class="detail-item"><span class="detail-label">分类</span>{{ categoryMap[currentCard.category] || currentCard.category || '-' }}</div>
          <div class="detail-item"><span class="detail-label">标签</span>{{ currentCard.tag || '-' }}</div>
          <div class="detail-item"><span class="detail-label">批次号</span><code v-if="currentCard.batchNo">{{ currentCard.batchNo }}</code><span v-else>-</span></div>
          <div class="detail-item"><span class="detail-label">备注</span>{{ currentCard.remark || '-' }}</div>
          <div class="detail-item"><span class="detail-label">状态</span><span :class="['status-badge', getStatusClass(currentCard)]">{{ currentCard.statusName }}</span></div>
          <div class="detail-item"><span class="detail-label">使用者ID</span>{{ currentCard.useUserId || '未使用' }}</div>
          <div class="detail-item"><span class="detail-label">使用时间</span>{{ currentCard.useTime ? formatTime(currentCard.useTime * 1000) : '未使用' }}</div>
          <div class="detail-item"><span class="detail-label">过期时间</span>{{ currentCard.expireTime ? formatTime(currentCard.expireTime * 1000) : '永久' }}</div>
          <div class="detail-item"><span class="detail-label">创建时间</span>{{ formatTime(currentCard.createTime) }}</div>
        </div>
        <div class="modal-footer"><button @click="showDetailModal=false" class="cancel-btn">关闭</button></div>
      </div>
    </div>

    <!-- 导入弹窗 -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal=false">
      <div class="modal-content modal-lg">
        <div class="modal-header"><h3>📥 导入密卡</h3><button @click="showImportModal=false" class="close-btn">&times;</button></div>
        <div class="modal-body">
          <p class="hint" style="margin-bottom:12px">支持 CSV 格式（cardNo,cardPwd,faceValue,coinAmount,expireDays,category,tag）或 JSON 数组。每行一张密卡，最多5000张。</p>
          <textarea v-model="importText" placeholder="粘贴CSV或JSON数据..." class="import-textarea" rows="10"></textarea>
          <div style="margin-top:12px;display:flex;gap:8px">
            <button @click="downloadTemplate" class="action-btn outline" style="flex:1">📄 下载模板</button>
            <button @click="doImport" :disabled="importing" class="action-btn primary" style="flex:1">{{ importing ? '导入中...' : '📥 开始导入' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ============ 分类管理弹窗 ============ -->
  <div v-if="showCategoryModal" class="modal-overlay" @click.self="showCategoryModal=false">
    <div class="modal-content">
      <div class="modal-header">
        <h3>⚙️ 管理密卡分类</h3>
        <button @click="showCategoryModal=false" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="cat-form-inline">
          <input v-model="categoryForm.key" type="text" placeholder="分类Key" class="form-input" style="flex:1" />
          <input v-model="categoryForm.label" type="text" placeholder="名称" class="form-input" style="flex:1" />
          <input v-model="categoryForm.color" type="color" class="form-input color-picker" />
          <button @click="addCategory" class="cat-add-btn">{{ editingCatIndex >= 0 ? '保存修改' : '添加' }}</button>
        </div>
        <div class="cat-form-row">
          <div class="cat-fields">
            <label>面值（元）</label>
            <input v-model.number="categoryForm.faceValue" type="number" min="1" class="form-input" />
          </div>
          <div class="cat-fields">
            <label>兑换金币</label>
            <input v-model.number="categoryForm.coinAmount" type="number" min="1" class="form-input" />
          </div>
          <div class="cat-fields">
            <label>赠送金币</label>
            <input v-model.number="categoryForm.bonusCoins" type="number" min="0" class="form-input" />
          </div>
        </div>
        <table v-if="categories.length > 0" class="cat-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>名称</th>
              <th>颜色</th>
              <th>面值</th>
              <th>金币</th>
              <th>赠送</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(c, i) in categories" :key="c.key" :class="{ 'row-editing': editingCatIndex === i }">
              <td><code>{{ c.key }}</code></td>
              <td>{{ c.label }}</td>
              <td><span class="cat-color-dot" :style="{ background: c.color }"></span></td>
              <td>¥{{ c.faceValue }}</td>
              <td>{{ c.coinAmount }}</td>
              <td>{{ c.bonusCoins || 0 }}</td>
              <td>
                <button @click="editCategory(i)" class="row-btn edit">编辑</button>
                <button @click="deleteCategory(i)" class="row-btn del">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="hint" style="text-align:center;padding:20px">暂无分类，请添加</p>
      </div>
      <div class="modal-footer">
        <button @click="saveCategories" class="confirm-btn">保存分类</button>
        <button @click="showCategoryModal=false" class="cancel-btn">取消</button>
      </div>
    </div>
  </div>

  <!-- ============ 导出数量选择弹窗（支持多分类） ============ -->
  <div v-if="showExportModal" class="modal-overlay" @click.self="showExportModal=false">
    <div class="modal-content" style="width:440px">
      <div class="modal-header">
        <h3>📤 导出密卡</h3>
        <button @click="showExportModal=false" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <p class="hint" style="margin-bottom:12px">仅导出<strong>未使用</strong>的密卡。请选择要导出的分类（可多选）：</p>

        <!-- 分类多选（含各分类可用数量） -->
        <div class="export-cat-list">
          <label class="export-cat-item export-cat-all">
            <input type="checkbox" :checked="exportModalData.selectedCategories.length === categories.length && categories.length > 0" @change="toggleAllExportCat" />
            <span style="font-weight:600;color:#7c3aed">全部分类</span>
            <span class="cat-count-badge">{{ totalExportAvailable }} 张</span>
          </label>
          <label v-for="c in categories" :key="c.key" class="export-cat-item">
            <input type="checkbox" :checked="exportModalData.selectedCategories.includes(c.key)" @change="toggleExportCategory(c.key)" />
            <span class="clear-face-dot" :style="{ background: c.color }"></span>
            <span class="clear-face-label">{{ c.label }}</span>
            <span class="clear-face-value">¥{{ c.faceValue }} → {{ c.coinAmount }}金币</span>
            <span class="cat-count-badge" :class="{ 'cat-count-zero': (exportModalData.catCounts[c.key] || 0) === 0 }">{{ exportModalData.catCounts[c.key] || 0 }} 张</span>
          </label>
        </div>

        <div class="form-group" style="margin-top:14px">
          <label>可用数量（未使用）</label>
          <div class="avail-count">{{ exportModalData.availableCount }} 张</div>
        </div>
        <div class="form-group">
          <label>导出数量</label>
          <input v-model.number="exportModalData.quantity" type="number" :min="1" :max="exportModalData.availableCount" class="form-input" />
        </div>
      </div>
      <div class="modal-footer">
        <button @click="doExport()" :disabled="exportModalData.quantity < 1 || exportModalData.submitting" class="confirm-btn">
          {{ exportModalData.submitting ? '导出中...' : '确认导出' }}
        </button>
        <button @click="showExportModal=false" class="cancel-btn">取消</button>
      </div>
    </div>
  </div>

  <!-- ============ 清空密卡弹窗 ============ -->
  <div v-if="showClearModal" class="modal-overlay" @click.self="showClearModal=false">
    <div class="modal-content" style="width:420px">
      <div class="modal-header">
        <h3>🗑️ 清空密卡</h3>
        <button @click="showClearModal=false" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <p class="hint" style="margin-bottom:12px">选择要清空的面值，对应密卡将被永久删除：</p>
        <div class="clear-face-list">
          <label class="clear-face-item clear-all-item">
            <input type="checkbox" :checked="allFaceSelected" @change="toggleAllFace" />
            <span style="font-weight:600;color:#7c3aed">全选</span>
          </label>
          <label v-for="c in categories" :key="c.key" class="clear-face-item">
            <input type="checkbox" :value="c.faceValue" v-model="selectedFaceValues" />
            <span class="clear-face-dot" :style="{ background: c.color }"></span>
            <span class="clear-face-label">{{ c.label }}</span>
            <span class="clear-face-value">¥{{ c.faceValue }} → {{ c.coinAmount }}金币</span>
          </label>
        </div>
        <p v-if="selectedFaceValues.length === 0" class="hint" style="text-align:center;margin-top:8px">请至少选择一个面值</p>
      </div>
      <div class="modal-footer">
        <button @click="clearAllCards" class="confirm-btn del-btn">确认清空</button>
        <button @click="showClearModal=false" class="cancel-btn">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPost, apiPut, apiDelete, exportCSV, toast, confirm } = useAdmin()

// ============================================================
// 密卡系统统一数据字典
// ============================================================
// 本字典定义了密卡管理各模块间共享的字段规范，所有表单/表格/API
// 的数据字段都应与此保持一致。如需新增字段，请在以下三处同步更新。
// ============================================================
//
// 【卡片数据模型】— 后端存储 (DB / Mock)
//   id, cardNo, cardPwd, faceValue, coinAmount, status,
//   expireDays, category, tag, batchNo, remark,
//   createTime, useTime, useUserId
//
// 【分类定义】— 管理分类弹窗 (categories)
//   key, label, color, faceValue, coinAmount, bonusCoins
//
// 【映射规则】
//   分类 category.faceValue/coinAmount  → 自动填充至卡片（通过 applyCategoryDefaults）
//   分类 category.bonusCoins            → 卡片不存储，展示时从分类查（通过 getBonusCoins）
//   批量表单 batchForm.prefix           → API 映射为 cardNo
//   批量表单 batchForm.pwd              → API 映射为 cardPwd
//   前端表单 expireDays                 → 后端转为 expire_time 时间戳
// ============================================================

// 分类数据（从系统设置加载，可配置）
const categories = ref([
  { key: 'level1', label: '1元档', color: '#10b981', faceValue: 1, coinAmount: 10, bonusCoins: 0 },
  { key: 'level10', label: '10元档', color: '#3b82f6', faceValue: 10, coinAmount: 100, bonusCoins: 10 },
  { key: 'level50', label: '50元档', color: '#f59e0b', faceValue: 50, coinAmount: 500, bonusCoins: 60 },
  { key: 'level100', label: '100元档', color: '#7c3aed', faceValue: 100, coinAmount: 1000, bonusCoins: 150 },
  { key: 'vip', label: 'VIP专属', color: '#ef4444', faceValue: 200, coinAmount: 2000, bonusCoins: 300 },
  { key: 'newbie', label: '新手礼包', color: '#06b6d4', faceValue: 5, coinAmount: 50, bonusCoins: 10 },
  { key: 'activity', label: '活动福利', color: '#f97316', faceValue: 20, coinAmount: 200, bonusCoins: 30 },
  { key: 'general', label: '通用', color: '#6b7280', faceValue: 30, coinAmount: 300, bonusCoins: 0 }
])
const categoryMap = computed(() => {
  const m = {}; categories.value.forEach(c => { m[c.key] = c.label }); return m
})
const categoryColors = computed(() => {
  const m = {}; categories.value.forEach(c => { m[c.key] = c.color }); return m
})

// 当前选中分类的完整信息（用于生成/编辑弹窗中的分类参考卡片）
const selectedCategoryInfo = computed(() => getCategoryInfo(form.value.category))

// ========== 列表状态 ==========
const activeTab = ref('list')
const cardList = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const filterCategory = ref('')
const filterBatchNo = ref('')
const loading = ref(false)
const selectedIds = ref([])

// ========== 清空密卡 ==========
const showClearModal = ref(false)
const selectedFaceValues = ref([])

// ========== 分类管理 ==========
const showCategoryModal = ref(false)
const categoryForm = ref({ key: '', label: '', color: '#6366f1', faceValue: 1, coinAmount: 10, bonusCoins: 0 })
const categorySaving = ref(false)
const editingCatIndex = ref(-1)

// ========== 弹窗状态 ==========
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const showImportModal = ref(false)
const currentCard = ref({})
const editingCard = ref(null)
const submitting = ref(false)
const form = ref({ cardNo: '', cardPwd: '', faceValue: 100, coinAmount: 100, expireDays: 365, count: 1, category: '', tag: '', remark: '' })
const importText = ref('')
const importing = ref(false)

// ========== 导出数量选择弹窗 ==========
const showExportModal = ref(false)
const exportModalData = reactive({ quantity: 1, availableCount: 0, selectedCategories: [], catName: '', submitting: false, catCounts: {} })

// ========== 导出日志 ==========
const exportLogs = ref([])
const exportLogLoading = ref(false)

// ========== 统计状态 ==========
const statsLoading = ref(false)
const statsData = ref(null)

// ========== 计算属性 ==========
const isAllSelected = computed(() => cardList.value.length > 0 && cardList.value.every(c => c && selectedIds.value.includes(c.id)))

const trendMax = computed(() => {
  if (!statsData.value || !statsData.value.trendData) return 100
  const max = statsData.value.trendData.reduce((m, d) => Math.max(m, d.created, d.used), 0)
  return Math.max(max, 1)
})

const pieSegments = computed(() => {
  if (!statsData.value) return []
  const o = statsData.value.overview
  const items = [
    { label: '未使用', count: o.unusedCount, color: '#10b981' },
    { label: '已使用', count: o.usedCount, color: '#3b82f6' },
    { label: '已过期', count: o.expiredCount, color: '#f59e0b' },
    { label: '已禁用', count: o.disabledCount, color: '#9ca3af' }
  ].filter(i => i.count > 0)
  const total = items.reduce((s, i) => s + i.count, 0) || 1
  const circumference = 2 * Math.PI * 80
  let offset = 0
  return items.map(item => {
    const percent = item.count / total
    const dash = circumference * percent
    const seg = { ...item, dashArray: dash + ' ' + (circumference - dash), dashOffset: -offset }
    offset += dash
    return seg
  })
})

// ========== 辅助函数 ==========
const isExpired = (card) => card.status === 0 && card.expireTime > 0 && card.expireTime * 1000 < Date.now()

const getStatusClass = (card) => {
  if (card.status === 1) return 'used'
  if (card.status === 3) return 'disabled'
  if (isExpired(card)) return 'expired'
  return 'active'
}

const getBarWidth = (count) => {
  if (!statsData.value) return 0
  const max = Math.max(...statsData.value.categoryStats.map(i => i.count), 1)
  return Math.round(count / max * 100)
}

const getBarColor = (name) => categoryColors.value[name] || '#6366f1'

// 根据分类 key 获取完整分类信息
const getCategoryInfo = (catKey) => {
  if (!catKey) return null
  return categories.value.find(c => c.key === catKey) || null
}

// 根据卡片分类获取赠送金币数
const getBonusCoins = (card) => {
  const cat = getCategoryInfo(card?.category)
  return cat?.bonusCoins || 0
}

const formatNum = (n) => {
  if (n == null) return 0
  return Number(n).toLocaleString('zh-CN')
}

const resetFilters = () => {
  searchKeyword.value = ''
  filterStatus.value = ''
  filterCategory.value = ''
  filterBatchNo.value = ''
  page.value = 1
  loadCards()
}

// ========== 数据加载 ==========
const loadCards = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterStatus.value !== '') params.status = filterStatus.value
    if (filterCategory.value) params.category = filterCategory.value
    if (filterBatchNo.value) params.batchNo = filterBatchNo.value
    const res = await apiGet('/api/admin/cards', params)
    if (res.code === 200) {
      cardList.value = (res.data?.list || []).filter(Boolean)
      total.value = res.data?.pagination?.total || 0
      selectedIds.value = []
    }
  } catch (err) {
    console.error('加载密卡列表失败:', err)
    toast('加载密卡列表失败', 'error')
  } finally { loading.value = false }
}

const loadStats = async () => {
  statsLoading.value = true
  try {
    const res = await apiGet('/api/admin/cards/stats')
    if (res.code === 200) statsData.value = res.data
  } catch (err) {
    console.error('加载统计数据失败:', err)
    toast('加载统计数据失败', 'error')
  } finally { statsLoading.value = false }
}

const loadExportLogs = async () => {
  exportLogLoading.value = true
  try {
    const res = await apiGet('/api/admin/cards/export-logs', { page: 1, pageSize: 100 })
    if (res.code === 200) exportLogs.value = res.data?.list || []
  } catch (err) {
    console.error('加载导出记录失败:', err)
  } finally { exportLogLoading.value = false }
}

// ========== 选择逻辑 ==========
const toggleSelect = (id) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

const toggleAll = () => {
  if (isAllSelected.value) selectedIds.value = []
  else selectedIds.value = cardList.value.filter(Boolean).map(c => c.id)
}

const clearSelection = () => { selectedIds.value = [] }

// ========== CRUD操作 ==========
const viewCard = async (card) => {
  try {
    const res = await apiGet('/api/admin/cards/' + card.id)
    if (res.code === 200) { currentCard.value = res.data; showDetailModal.value = true }
  } catch { currentCard.value = { ...card }; showDetailModal.value = true }
}

const openCreateModal = () => {
  editingCard.value = null
  form.value = { cardNo: '', cardPwd: '', faceValue: 100, coinAmount: 100, expireDays: 365, count: 1, category: '', tag: '', remark: '' }
  showCreateModal.value = true
}

const openEditModal = (card) => {
  editingCard.value = card
  form.value = { cardNo: card.cardNo, cardPwd: '', faceValue: card.faceValue, coinAmount: card.coinAmount, expireDays: 0, count: 1, category: card.category || '', tag: card.tag || '', remark: card.remark || '' }
  showCreateModal.value = true
}

const openImportModal = () => { importText.value = ''; showImportModal.value = true }

const submitForm = async () => {
  if (!form.value.faceValue || form.value.faceValue <= 0) { toast('请输入有效面值', 'warning'); return }
  if (!form.value.coinAmount || form.value.coinAmount <= 0) { toast('请输入有效金币数', 'warning'); return }
  submitting.value = true
  try {
    if (editingCard.value) {
      const res = await apiPut('/api/admin/cards/' + editingCard.value.id, form.value)
      if (res.code === 200) { toast('密卡更新成功'); showCreateModal.value = false; loadCards() }
      else toast(res.message || '更新失败', 'error')
    } else {
      const res = await apiPost('/api/admin/cards', form.value)
      if (res.code === 200) { toast(res.message || `成功生成 ${res.data?.count || 0} 张密卡`); showCreateModal.value = false; page.value = 1; loadCards() }
      else toast(res.message || '生成失败', 'error')
    }
  } catch (err) { console.error(err); toast('操作失败', 'error') }
  finally { submitting.value = false }
}

const deleteCardItem = async (card) => {
  if (!(await confirm(`确定要删除「${card.cardNo}」吗？删除后不可恢复。`))) return
  try {
    const res = await apiDelete('/api/admin/cards/' + card.id)
    if (res.code === 200) { toast('密卡已删除'); loadCards() }
    else toast(res.message || '删除失败', 'error')
  } catch (err) { toast('删除失败', 'error') }
}

const allFaceSelected = computed(() => {
  return categories.value.length > 0 && categories.value.every(c => selectedFaceValues.value.includes(c.faceValue))
})
const toggleAllFace = () => {
  if (allFaceSelected.value) selectedFaceValues.value = []
  else selectedFaceValues.value = categories.value.map(c => c.faceValue)
}

const openClearModal = () => {
  selectedFaceValues.value = []
  showClearModal.value = true
}

const clearAllCards = async () => {
  const vals = selectedFaceValues.value
  if (vals.length === 0) { toast('请选择要清空的面值', 'warning'); return }
  if (!(await confirm(`确定要清空以下面值的所有密卡吗？\n${vals.map(v => v + '元').join('、')}\n此操作不可恢复！`))) return
  try {
    const res = await apiPost('/api/admin/cards/clear-by-face', { faceValues: vals })
    if (res.code === 200) { toast(res.message || `已清空 ${res.data?.deletedCount || 0} 张`); showClearModal.value = false; loadCards() }
    else toast(res.message || '清空失败', 'error')
  } catch { toast('清空失败', 'error') }
}

const toggleStatus = async (card, newStatus) => {
  const label = newStatus === 3 ? '禁用' : '启用'
  if (!(await confirm(`确定要${label}「${card.cardNo}」吗？`))) return
  try {
    const res = await apiPut('/api/admin/cards/' + card.id + '/status', { status: newStatus })
    if (res.code === 200) { toast(res.message || `密卡已${label}`); loadCards() }
    else toast(res.message || '操作失败', 'error')
  } catch { toast('操作失败', 'error') }
}

// ========== 批量操作 ==========
const batchEnable = async () => { await doBatchStatus(0); clearSelection() }
const batchDisable = async () => { await doBatchStatus(3); clearSelection() }
const batchDelete = async () => {
  if (selectedIds.value.length === 0) return
  if (!(await confirm(`确定要删除选中的 ${selectedIds.value.length} 张密卡吗？`))) return
  try {
    const res = await apiPost('/api/admin/cards/batch-delete', { ids: selectedIds.value })
    if (res.code === 200) { toast(res.message || `删除成功`); loadCards() }
    else toast(res.message || '删除失败', 'error')
  } catch { toast('操作失败', 'error') }
  clearSelection()
}

const doBatchStatus = async (status) => {
  if (selectedIds.value.length === 0) return
  const label = status === 0 ? '启用' : '禁用'
  try {
    const res = await apiPost('/api/admin/cards/batch-status', { ids: selectedIds.value, status })
    if (res.code === 200) { toast(res.message || `批量${label}成功`); loadCards() }
    else toast(res.message || '操作失败', 'error')
  } catch { toast('操作失败', 'error') }
}

// ========== 导入导出 ==========
// 构建 csv 并下载（带概要头部）
const buildCSVAndDownload = (list, summaryRows, filename) => {
  const detailsHeader = 'ID,卡号,面值,金币,赠送金币,分类,标签,批次号,备注,状态,使用者ID,密卡密码,过期时间,创建时间'
  const dataRows = list.map(row => {
    const bonus = getBonusCoins(row)
    const statusName = row.statusName || ''
    const catName = categoryMap.value[row.category] || row.category || ''
    const pwd = row.cardPwd || ''
    const expireStr = row.expireTime ? formatTime(row.expireTime) : ''
    const createStr = formatTime(row.createTime)
    // CSV 转义：含逗号/引号/换行的字段用引号包裹
    const esc = v => {
      const s = String(v ?? '')
      return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    return [
      esc(row.id), esc(row.cardNo), esc(row.faceValue), esc(row.coinAmount),
      esc(bonus), esc(catName), esc(row.tag || ''), esc(row.batchNo || ''),
      esc(row.remark || ''), esc(statusName), esc(row.useUserId || ''),
      esc(pwd), esc(expireStr), esc(createStr)
    ].join(',')
  }).join('\n')

  const bom = '\uFEFF'
  const csv = bom + summaryRows.map(r => r.join(',')).join('\n') + '\n' + detailsHeader + '\n' + dataRows
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename + '.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

const formatNow = () => {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const getDateRange = (list) => {
  if (!list || list.length === 0) return '-'
  const times = list.map(r => r.createTime).filter(t => t > 0).sort((a, b) => a - b)
  if (times.length === 0) return '-'
  return `${formatTime(times[0])} ~ ${formatTime(times[times.length - 1])}`
}

// 查询各分类的未使用密卡数量
const queryExportCatCounts = async () => {
  const catKeys = categories.value.map(c => c.key)
  const results = await Promise.allSettled(catKeys.map(key =>
    apiGet('/api/admin/cards', { page: 1, pageSize: 1, status: 0, categories: key })
  ))
  const counts = {}
  catKeys.forEach((key, i) => {
    counts[key] = results[i].status === 'fulfilled' ? (results[i].value.data?.pagination?.total || 0) : 0
  })
  exportModalData.catCounts = counts
}

// 打开导出数量选择弹窗（categories 为空数组表示全部）
const openExportModal = async (selectedKeys) => {
  const keys = Array.isArray(selectedKeys) ? selectedKeys : (selectedKeys ? [selectedKeys] : [])
  exportModalData.selectedCategories = keys
  exportModalData.submitting = false
  // 查询各分类和总可用数量
  await queryExportCatCounts()
  try {
    const params = { page: 1, pageSize: 1, status: 0 }
    if (keys.length > 0) params.categories = keys.join(',')
    else params.categories = categories.value.map(c => c.key).join(',')
    const res = await apiGet('/api/admin/cards', params)
    const total = res.data?.pagination?.total || 0
    exportModalData.availableCount = total
    exportModalData.quantity = total
    computeExportCatName()
    showExportModal.value = true
  } catch {
    toast('查询可用数量失败', 'error')
  }
}

// 计算导出弹窗中的分类名称显示
const computeExportCatName = () => {
  const keys = exportModalData.selectedCategories
  if (keys.length === 0) {
    exportModalData.catName = '全部'
  } else if (keys.length <= 2) {
    exportModalData.catName = keys.map(k => categoryMap.value[k] || k).join('、')
  } else {
    exportModalData.catName = keys.map(k => categoryMap.value[k] || k).join('、') + `（共${keys.length}类）`
  }
}

// 切换导出的分类选择
const toggleExportCategory = (key) => {
  const idx = exportModalData.selectedCategories.indexOf(key)
  if (idx >= 0) {
    exportModalData.selectedCategories.splice(idx, 1)
  } else {
    exportModalData.selectedCategories.push(key)
  }
  computeExportCatName()
  // 重新查询可用数量
  recheckExportAvailable()
}

const allExportCatKeys = computed(() => categories.value.map(c => c.key))
const totalExportAvailable = computed(() => {
  const counts = exportModalData.catCounts
  return Object.values(counts).reduce((s, v) => s + v, 0)
})

const toggleAllExportCat = () => {
  const allKeys = allExportCatKeys.value
  const isAll = allKeys.every(k => exportModalData.selectedCategories.includes(k))
  exportModalData.selectedCategories.splice(0)
  if (!isAll) {
    allKeys.forEach(k => exportModalData.selectedCategories.push(k))
  }
  computeExportCatName()
  recheckExportAvailable()
}

const recheckExportAvailable = async () => {
  const keys = exportModalData.selectedCategories
  await queryExportCatCounts()
  try {
    const params = { page: 1, pageSize: 1, status: 0 }
    if (keys.length > 0) params.categories = keys.join(',')
    else params.categories = categories.value.map(c => c.key).join(',')
    const res = await apiGet('/api/admin/cards', params)
    const total = res.data?.pagination?.total || 0
    exportModalData.availableCount = total
    if (exportModalData.quantity > total) exportModalData.quantity = total
  } catch {}
}

// 执行导出
const doExport = async () => {
  const qty = exportModalData.quantity
  const selectedKeys = exportModalData.selectedCategories
  const catName = exportModalData.catName
  if (qty < 1) { toast('导出数量必须大于0', 'warning'); return }
  exportModalData.submitting = true
  try {
    const params = { page: 1, pageSize: qty, status: 0 }
    if (selectedKeys.length > 0) params.categories = selectedKeys.join(',')
    const res = await apiGet('/api/admin/cards', params)
    const list = (res.data?.list || []).filter(Boolean)
    if (list.length === 0) { toast('没有可导出的未使用密卡', 'warning'); return }
    const now = formatNow()
    // 更新标签：记录导出时间
    const ids = list.map(c => c.id)
    await apiPost('/api/admin/cards/batch-tag', { ids, tag: `已导出: ${now}` }).catch(() => {})
    // 重新获取最新数据（含更新后的标签）
    const res2 = await apiGet('/api/admin/cards', { ...params })
    const list2 = (res2.data?.list || []).filter(Boolean)
    const filename = selectedKeys.length > 0 ? 'cards_export_multi' : 'cards_export_all'
    const dateRange = getDateRange(list2)
    const summaryRows = [
      ['导出密卡统计', ''],
      ['共计', `${list2.length} 张`],
      ['分类', catName],
      ['日期范围', dateRange],
      ['导出时间', now]
    ]
    buildCSVAndDownload(list2, summaryRows, filename)
    toast(`成功导出 ${list2.length} 条`)
    showExportModal.value = false
    await apiPost('/api/admin/cards/record-export', { count: list2.length, category: catName, scope: selectedKeys.length > 0 ? '按分类导出' : '全部' }).catch(() => {})
  } catch { toast('导出失败', 'error') }
  finally { exportModalData.submitting = false }
}

const downloadTemplate = () => {
  const header = 'cardNo,cardPwd,faceValue,coinAmount,expireDays,category,tag,remark'
  const sample = 'CARD001,abc12345,1,10,365,level1,1元档,\nCARD002,def67890,10,100,365,level10,10元档,春节活动'
  const csv = '\uFEFF' + header + '\n' + sample
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'cards_template.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

const parseImportData = (text) => {
  text = text.trim()
  if (!text) return []
  // 尝试 JSON
  if (text.startsWith('[')) {
    try { return JSON.parse(text) } catch { /* fall through */ }
  }
  // CSV 解析
  const lines = text.split('\n').filter(l => l.trim())
  // 检测是否有表头
  const firstLine = lines[0].toLowerCase()
  const hasHeader = firstLine.includes('cardno') || firstLine.includes('卡号')
  const dataLines = hasHeader ? lines.slice(1) : lines
  return dataLines.map(line => {
    const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
    return {
      cardNo: parts[0] || '',
      cardPwd: parts[1] || '',
      faceValue: parseFloat(parts[2]) || 100,
      coinAmount: parseInt(parts[3]) || 100,
      expireDays: parseInt(parts[4]) || 365,
      category: parts[5] || '',
      tag: parts[6] || '',
      remark: parts[7] || ''
    }
  }).filter(c => c.cardNo || c.cardPwd)
}

const doImport = async () => {
  const cards = parseImportData(importText.value)
  if (cards.length === 0) { toast('未解析到有效数据', 'warning'); return }
  if (cards.length > 5000) { toast('单次最多导入5000张', 'warning'); return }
  if (!(await confirm(`解析到 ${cards.length} 张密卡，确认导入？`))) return
  importing.value = true
  try {
    const res = await apiPost('/api/admin/cards/import', { cards })
    if (res.code === 200) {
      toast(res.message || `成功导入 ${res.data.successCount} 张`)
      showImportModal.value = false
      importText.value = ''
      page.value = 1
      loadCards()
    } else toast(res.message || '导入失败', 'error')
  } catch { toast('导入失败', 'error') }
  finally { importing.value = false }
}

// ========== 分类管理 ==========
const loadCategories = async () => {
  try {
    const res = await apiGet('/api/admin/settings')
    if (res.code === 200 && res.data && Array.isArray(res.data.cardCategories)) {
      categories.value = res.data.cardCategories
    }
  } catch {}
}

const saveCategories = async () => {
  categorySaving.value = true
  try {
    const res = await apiPut('/api/admin/settings', { cardCategories: categories.value })
    if (res.code === 200) {
      toast('分类保存成功')
      showCategoryModal.value = false
    } else toast(res.message || '保存失败', 'error')
  } catch { toast('保存失败', 'error') }
  finally { categorySaving.value = false }
}

const addCategory = () => {
  const f = categoryForm.value
  if (!f.key.trim() || !f.label.trim()) { toast('请输入Key和名称', 'warning'); return }
  const cat = { key: f.key.trim(), label: f.label.trim(), color: f.color || '#6366f1', faceValue: f.faceValue || 1, coinAmount: f.coinAmount || 10, bonusCoins: f.bonusCoins || 0 }
  if (editingCatIndex.value >= 0) {
    categories.value[editingCatIndex.value] = cat
    editingCatIndex.value = -1
  } else {
    if (categories.value.some(c => c.key === f.key.trim())) { toast('Key已存在', 'warning'); return }
    categories.value.push(cat)
  }
  categoryForm.value = { key: '', label: '', color: '#6366f1', faceValue: 1, coinAmount: 10, bonusCoins: 0 }
}

const editCategory = (index) => {
  const c = categories.value[index]
  categoryForm.value = { key: c.key, label: c.label, color: c.color, faceValue: c.faceValue, coinAmount: c.coinAmount, bonusCoins: c.bonusCoins || 0 }
  editingCatIndex.value = index
}

const deleteCategory = (index) => {
  if (editingCatIndex.value === index) {
    editingCatIndex.value = -1
    categoryForm.value = { key: '', label: '', color: '#6366f1', faceValue: 1, coinAmount: 10, bonusCoins: 0 }
  }
  categories.value.splice(index, 1)
}

// 选择分类时自动填充面值和金币
const applyCategoryDefaults = (catKey, target) => {
  if (!catKey) return
  const cat = categories.value.find(c => c.key === catKey)
  if (cat && cat.faceValue != null) {
    target.faceValue = cat.faceValue
    target.coinAmount = cat.coinAmount
  }
}

onMounted(() => {
  loadCards()
  loadCategories()
})
</script>

<style scoped>
/* ========== Tab导航 ========== */
.card-tabs {
  display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 20px;
}
.tab-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 20px; border: none; background: none;
  font-size: 14px; font-weight: 500; color: #6b7280;
  cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px;
  transition: all 0.2s;
}
.tab-btn:hover { color: #374151; }
.tab-btn.active { color: #7c3aed; border-bottom-color: #7c3aed; }
.tab-content { min-height: 400px; }

/* ========== 工具栏 ========== */
.search-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; flex: 1; }
.search-input, .search-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; outline: none; }
.search-input:focus, .search-select:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
.search-input { width: 180px; }
.search-select { width: 110px; }
.batch-input { width: 130px; }
.search-btn { padding: 8px 14px; background: #7c3aed; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
.search-btn:hover { background: #6d28d9; }
.reset-btn { padding: 8px 14px; background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; font-size: 13px; }
.reset-btn:hover { background: #e5e7eb; }
.toolbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.toolbar-actions { display: flex; gap: 8px; flex-shrink: 0; }

/* 按钮 */
.action-btn {
  padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;
}
.action-btn.primary { background: #7c3aed; color: #fff; }
.action-btn.primary:hover { background: #6d28d9; }
.action-btn.outline { background: #fff; color: #374151; border: 1px solid #d1d5db; }
.action-btn.outline:hover { background: #f9fafb; }
.action-btn.warn-btn { background: #f59e0b; color: #fff; }
.action-btn.warn-btn:hover { background: #d97706; }

/* 批量操作栏 */
.batch-bar {
  display: flex; align-items: center; gap: 8px; padding: 10px 16px;
  background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; margin-bottom: 16px;
}
.batch-info { font-size: 13px; color: #92400e; }
.batch-btn {
  padding: 5px 12px; border: none; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer;
}
.batch-btn.enable { background: #10b981; color: #fff; }
.batch-btn.disable { background: #f59e0b; color: #fff; }
.batch-btn.del { background: #ef4444; color: #fff; }
.batch-btn.cancel { background: #e5e7eb; color: #6b7280; }

/* 表格 */
.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; padding: 10px 8px; background: #f9fafb; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
.data-table td { padding: 10px 8px; border-bottom: 1px solid #f3f4f6; }
.data-table tbody tr:hover { background: #f9fafb; }
.data-table tbody tr.row-disabled { background: #fafafa; color: #9ca3af; }
.data-table tbody tr.row-expired { background: #fffbeb; }

.card-no { font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
.pwd-cell { font-family: monospace; font-size: 12px; color: #9ca3af; }
.cat-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #ede9fe; color: #7c3aed; font-weight: 500; }
.label-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #f0fdf4; color: #15803d; }
.bonus-badge { font-size: 11px; color: #059669; font-weight: 600; }
.bonus-text { color: #059669; font-weight: 600; }
.bonus-hint { margin: -4px 0 8px; font-size: 12px; text-align: center; }
.batch-code { font-size: 11px; background: #f1f5f9; padding: 1px 6px; border-radius: 3px; }

.status-badge {
  display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;
}
.status-badge.active { background: #f0fdf4; color: #15803d; }
.status-badge.used { background: #eff6ff; color: #1d4ed8; }
.status-badge.expired { background: #fffbeb; color: #b45309; }
.status-badge.disabled { background: #f3f4f6; color: #6b7280; }

.actions-cell { white-space: nowrap; }
.row-btn {
  padding: 4px 10px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 12px;
  background: #fff; color: #374151; cursor: pointer; margin-right: 4px; transition: all 0.15s;
}
.row-btn:hover { background: #f3f4f6; }
.row-btn.edit { color: #7c3aed; border-color: #c4b5fd; }
.row-btn.edit:hover { background: #f5f3ff; }
.row-btn.warn { color: #d97706; border-color: #fcd34d; }
.row-btn.warn:hover { background: #fffbeb; }
.row-btn.ok { color: #059669; border-color: #6ee7b7; }
.row-btn.ok:hover { background: #ecfdf5; }
.row-btn.del { color: #ef4444; border-color: #fecaca; }
.row-btn.del:hover { background: #fef2f2; }

/* 统计分析 */
.stats-panel { display: flex; flex-direction: column; gap: 20px; }
.stats-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px;
  position: relative; overflow: hidden;
}
.stat-value { font-size: 28px; font-weight: 700; color: #1f2937; }
.stat-value.green { color: #059669; }
.stat-value.blue { color: #2563eb; }
.stat-value.orange { color: #d97706; }
.stat-value.gray { color: #6b7280; }
.stat-value.purple { color: #7c3aed; }
.stat-value.teal { color: #0d9488; }
.stat-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
.stat-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 32px; opacity: 0.15; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.chart-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; }
.trend-box { grid-column: 1 / -1; }
.chart-title { font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
.chart-empty { text-align: center; padding: 40px; color: #9ca3af; }

.pie-chart { display: flex; align-items: center; gap: 24px; justify-content: center; }
.pie-svg { width: 180px; height: 180px; }
.pie-legend { display: flex; flex-direction: column; gap: 8px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #4b5563; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

.bar-chart { display: flex; flex-direction: column; gap: 12px; }
.bar-item { display: flex; align-items: center; gap: 8px; }
.bar-label { width: 80px; font-size: 12px; color: #6b7280; text-align: right; flex-shrink: 0; }
.bar-track { flex: 1; height: 22px; background: #f3f4f6; border-radius: 6px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 6px; transition: width 0.5s ease; min-width: 2px; }
.bar-count { width: 40px; font-size: 12px; color: #374151; font-weight: 500; }

.trend-chart { display: flex; gap: 8px; align-items: flex-end; height: 200px; }
.trend-y-axis { display: flex; flex-direction: column; justify-content: space-between; height: 100%; font-size: 10px; color: #9ca3af; padding-right: 4px; min-width: 30px; text-align: right; }
.trend-bars { display: flex; gap: 2px; align-items: flex-end; flex: 1; height: 100%; border-bottom: 1px solid #e5e7eb; overflow-x: auto; }
.trend-bar-group { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; flex: 1; min-width: 14px; height: 100%; gap: 1px; }
.trend-bar { width: 6px; border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.3s; }
.trend-bar.created { background: #7c3aed; }
.trend-bar.used-bar { background: #10b981; }
.trend-date { font-size: 9px; color: #9ca3af; transform: rotate(-45deg); margin-top: 4px; white-space: nowrap; }
.trend-legend { display: flex; gap: 16px; margin-top: 8px; font-size: 12px; color: #6b7280; }

/* 导入样式 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 9990; display: flex; align-items: center; justify-content: center; }
.modal-content { background: #fff; border-radius: 12px; width: 520px; max-width: 90vw; max-height: 85vh; overflow-y: auto; box-shadow: 0 8px 40px rgba(0,0,0,0.15); }
.modal-lg { width: 640px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid #f3f4f6; }
.modal-header h3 { font-size: 16px; font-weight: 600; color: #1f2937; }
.close-btn { background: none; border: none; font-size: 22px; color: #9ca3af; cursor: pointer; }
.close-btn:hover { color: #374151; }
.modal-body { padding: 20px 24px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #f3f4f6; display: flex; gap: 8px; justify-content: flex-end; }
.confirm-btn { padding: 8px 20px; background: #7c3aed; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.confirm-btn:hover { background: #6d28d9; }
.confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.cancel-btn { padding: 8px 20px; background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; font-size: 14px; }
.cancel-btn:hover { background: #e5e7eb; }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-item { font-size: 13px; }
.detail-label { color: #6b7280; display: block; font-size: 11px; margin-bottom: 2px; text-transform: uppercase; }
.pwd-full { font-family: monospace; letter-spacing: 2px; }

/* 通用 */
.form-group { margin-bottom: 12px; flex: 1; }
.form-group label { display: block; margin-bottom: 5px; font-size: 12px; color: #6b7280; font-weight: 500; }
.form-input { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; box-sizing: border-box; outline: none; }
.form-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
.form-row { display: flex; gap: 12px; }
.loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px 0; color: #9ca3af; font-size: 14px; }
.loading-spinner { width: 24px; height: 24px; border: 3px solid #e5e7eb; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 60px 0; color: #9ca3af; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 15px; }

/* 分页 */
.pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; flex-wrap: wrap; gap: 12px; }
.pagination-left, .pagination-right { display: flex; align-items: center; gap: 6px; }
.page-size-label { font-size: 13px; color: #6b7280; }
.page-size-select { padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 13px; }
.page-btn { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff; color: #374151; font-size: 12px; cursor: pointer; }
.page-btn:hover { background: #f3f4f6; }
.page-btn:disabled { color: #d1d5db; cursor: not-allowed; }
.page-active { background: #7c3aed; color: #fff; border-color: #7c3aed; }
.page-ellipsis { padding: 6px 4px; color: #9ca3af; }

/* 导出下拉菜单 */
.export-dropdown { position: relative; display: inline-block; }
.export-dropdown-menu {
  position: absolute; top: 100%; right: 0; margin-top: 4px;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12); min-width: 160px;
  z-index: 100; overflow: hidden;
}
.dropdown-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 10px 16px; border: none; background: none;
  font-size: 14px; color: #374151; cursor: pointer; text-align: left;
  transition: background 0.15s;
}
.dropdown-item:hover { background: #f3f4f6; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* 分类管理弹窗 */
.cat-form-inline { display: flex; gap: 8px; margin-bottom: 16px; align-items: flex-end; }
.color-picker { width: 50px !important; height: 38px; padding: 4px !important; cursor: pointer; }
.cat-add-btn { padding: 8px 16px; background: #7c3aed; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; white-space: nowrap; }
.cat-add-btn:hover { background: #6d28d9; }
.cat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cat-table th { text-align: left; padding: 8px; background: #f9fafb; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
.cat-table td { padding: 8px; border-bottom: 1px solid #f3f4f6; }
.cat-form-row { display: flex; gap: 8px; margin-bottom: 16px; }
.cat-fields { flex: 1; }
.cat-fields label { display: block; font-size: 11px; color: #6b7280; margin-bottom: 4px; }
.cat-table tbody tr:hover { background: #f9fafb; }
.cat-table tbody tr.row-editing { background: #fef3c7; outline: 2px solid #f59e0b; outline-offset: -2px; }
.cat-color-dot { display: inline-block; width: 20px; height: 20px; border-radius: 4px; border: 1px solid #e5e7eb; }

/* 创建弹窗中的分类参考卡片 */
.cat-ref-card {
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 14px 16px; margin-bottom: 14px;
}
.cat-ref-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: #1f2937; margin-bottom: 10px;
  padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;
}
.cat-ref-body {
  display: flex; gap: 20px; flex-wrap: wrap;
}
.cat-ref-item { display: flex; flex-direction: column; gap: 2px; }
.cat-ref-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
.cat-ref-value { font-size: 16px; font-weight: 700; color: #1f2937; }
.field-hint { display: inline; font-size: 10px; color: #9ca3af; font-weight: 400; margin-left: 4px; }

/* 清空密卡弹窗 */
.clear-face-list { display: flex; flex-direction: column; gap: 6px; max-height: 280px; overflow-y: auto; }
.clear-face-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: all 0.15s;
}
.clear-face-item:hover { background: #f9fafb; }
.clear-all-item { border-color: #c4b5fd; background: #f5f3ff; }
.clear-face-item input[type="checkbox"] { width: 16px; height: 16px; accent-color: #7c3aed; }
.clear-face-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.clear-face-label { font-size: 13px; color: #374151; font-weight: 500; }
.clear-face-value { font-size: 12px; color: #9ca3af; margin-left: auto; }
.del-btn { background: #ef4444 !important; }
.del-btn:hover { background: #dc2626 !important; }

/* 导出弹窗数量显示 */
.avail-count {
  font-size: 24px; font-weight: 700; color: #7c3aed;
  padding: 8px 0;
}

/* 导出弹窗分类多选 */
.export-cat-list {
  display: flex; flex-direction: column; gap: 6px;
  max-height: 240px; overflow-y: auto;
  margin: 4px 0 8px;
}
.export-cat-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: all 0.15s;
}
.export-cat-item:hover { background: #f9fafb; }
.export-cat-all { border-color: #c4b5fd; background: #f5f3ff; }
.export-cat-item input[type="checkbox"] { width: 16px; height: 16px; accent-color: #7c3aed; flex-shrink: 0; }
.cat-count-badge {
  margin-left: auto; font-size: 12px; background: #ede9fe; color: #6d28d9;
  padding: 2px 8px; border-radius: 10px; white-space: nowrap; flex-shrink: 0;
}
.cat-count-zero { background: #f3f4f6; color: #9ca3af; }

/* 导出记录表格 */
.export-log-box { margin-top: 24px; }
.export-log-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.export-log-header .chart-title { margin-bottom: 0; }
.refresh-btn { padding: 4px 12px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 12px; color: #6b7280; cursor: pointer; }
.refresh-btn:hover { background: #e5e7eb; }
.refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.export-log-table-wrap { max-height: 400px; overflow-y: auto; }
.export-log-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.export-log-table th { text-align: left; padding: 8px 10px; background: #f9fafb; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb; white-space: nowrap; }
.export-log-table td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; }
.export-log-table tbody tr:hover { background: #f9fafb; }

@media (max-width: 768px) {
  .stats-cards { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .form-row-3 { grid-template-columns: 1fr; }
  .import-methods { flex-direction: column; }
}
</style>
