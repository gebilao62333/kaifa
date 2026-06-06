<template>
  <div class="admin-cards">
    <!-- Tab导航 -->
    <div class="card-tabs">
      <button :class="['tab-btn', { active: activeTab === 'list' }]" @click="activeTab = 'list'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        卡片列表
      </button>
      <button :class="['tab-btn', { active: activeTab === 'stats' }]" @click="activeTab = 'stats'; loadStats()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        统计分析
      </button>
      <button :class="['tab-btn', { active: activeTab === 'batch' }]" @click="activeTab = 'batch'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
        批量操作
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
            <option value="vip">VIP专属</option>
            <option value="newbie">新人礼包</option>
            <option value="activity">活动赠送</option>
            <option value="general">通用</option>
          </select>
          <input v-model="filterBatchNo" @keyup.enter="loadCards" type="text" placeholder="批次号" class="search-input batch-input" />
          <button @click="loadCards" class="search-btn">🔍 搜索</button>
          <button @click="resetFilters" class="reset-btn">重置</button>
        </div>
        <div class="toolbar-actions">
          <button @click="openCreateModal()" class="action-btn primary">+ 生成密卡</button>
          <button @click="openImportModal()" class="action-btn outline">📥 导入</button>
          <button @click="exportAllData" class="action-btn outline">📤 导出全部</button>
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
            <tr v-for="card in cardList" :key="card.id" :class="{ 'row-disabled': card.status === 3, 'row-expired': card.status === 0 && isExpired(card) }">
              <td><input type="checkbox" :checked="selectedIds.includes(card.id)" @change="toggleSelect(card.id)" /></td>
              <td>{{ card.id }}</td>
              <td><code class="card-no">{{ card.cardNo }}</code></td>
              <td class="pwd-cell">{{ card.cardPwd }}</td>
              <td>¥{{ card.faceValue }}</td>
              <td>{{ card.coinAmount }}</td>
              <td><span class="cat-tag">{{ CATEGORY_MAP[card.category] || card.category || '-' }}</span></td>
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
                <span class="bar-label">{{ CATEGORY_MAP[item.name] || item.name }}</span>
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
      </div>
    </div>

    <!-- ============ 批量操作 Tab ============ -->
    <div v-if="activeTab === 'batch'" class="tab-content">
      <div class="batch-panel">
        <!-- 批量生成 -->
        <div class="batch-card">
          <h3 class="batch-card-title">📦 批量生成密卡</h3>
          <div class="batch-form">
            <div class="form-row-3">
              <div class="form-group">
                <label>卡号前缀</label>
                <input v-model="batchForm.prefix" type="text" placeholder="如: VIP2026" class="form-input" />
              </div>
              <div class="form-group">
                <label>面值（元）</label>
                <input v-model.number="batchForm.faceValue" type="number" placeholder="100" min="1" class="form-input" />
              </div>
              <div class="form-group">
                <label>兑换金币数</label>
                <input v-model.number="batchForm.coinAmount" type="number" placeholder="100" min="1" class="form-input" />
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label>有效期（天，0=永久）</label>
                <input v-model.number="batchForm.expireDays" type="number" placeholder="365" min="0" class="form-input" />
              </div>
              <div class="form-group">
                <label>生成数量</label>
                <input v-model.number="batchForm.count" type="number" placeholder="100" min="1" max="1000" class="form-input" />
              </div>
              <div class="form-group">
                <label>分类</label>
                <select v-model="batchForm.category" class="form-input">
                  <option value="">通用</option>
                  <option value="vip">VIP专属</option>
                  <option value="newbie">新人礼包</option>
                  <option value="activity">活动赠送</option>
                  <option value="general">通用</option>
                </select>
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>标签</label>
                <input v-model="batchForm.tag" type="text" placeholder="如: 春节活动,周年庆" class="form-input" />
              </div>
              <div class="form-group">
                <label>密码（留空随机）</label>
                <input v-model="batchForm.pwd" type="text" placeholder="8位随机密码" class="form-input" />
              </div>
            </div>
            <button @click="batchGenerate" :disabled="batchGenerating" class="action-btn primary" style="width:100%;margin-top:8px">
              {{ batchGenerating ? '生成中...' : '🚀 批量生成' }}
            </button>
          </div>
        </div>

        <!-- 批量导入 -->
        <div class="batch-card">
          <h3 class="batch-card-title">📥 批量导入密卡</h3>
          <div class="batch-form">
            <div class="import-methods">
              <div class="import-method">
                <h4>粘贴 CSV / JSON 数据</h4>
                <p class="hint">支持格式：cardNo,cardPwd,faceValue,coinAmount,expireDays,category,tag（逗号分隔，每行一张）</p>
                <p class="hint">或 JSON 数组：[{"cardNo":"CARD001","cardPwd":"abc123","faceValue":100,...}]</p>
                <textarea v-model="importText" placeholder="粘贴CSV或JSON数据..." class="import-textarea" rows="8"></textarea>
                <button @click="doImport" :disabled="importing" class="action-btn primary" style="margin-top:8px">
                  {{ importing ? '导入中...' : '📥 导入数据' }}
                </button>
              </div>
              <div class="import-divider">
                <span>或</span>
              </div>
              <div class="import-method">
                <h4>下载模板填写</h4>
                <p class="hint">下载标准 CSV 模板文件，按格式填写后粘贴到左侧文本框导入</p>
                <button @click="downloadTemplate" class="action-btn outline">📄 下载CSV模板</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量状态操作 -->
        <div class="batch-card">
          <h3 class="batch-card-title">⚡ 按条件批量操作</h3>
          <div class="batch-form">
            <div class="form-row-2">
              <div class="form-group">
                <label>筛选条件</label>
                <select v-model="batchOps.filterStatus" class="form-input">
                  <option value="">不筛选</option>
                  <option value="0">未使用</option>
                  <option value="2">已过期</option>
                  <option value="3">已禁用</option>
                </select>
              </div>
              <div class="form-group">
                <label>目标操作</label>
                <select v-model="batchOps.targetStatus" class="form-input">
                  <option value="3">禁用</option>
                  <option value="0">启用</option>
                </select>
              </div>
            </div>
            <button @click="batchOpsExecute" :disabled="batchOpsRunning" class="action-btn warn-btn" style="width:100%;margin-top:8px">
              {{ batchOpsRunning ? '执行中...' : '⚡ 执行批量操作' }}
            </button>
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
          <div class="form-group"><label>卡号前缀（留空自动生成）</label><input v-model="form.cardNo" type="text" placeholder="如: VIP2026" class="form-input" :disabled="!!editingCard" /></div>
          <div class="form-group"><label>密码（留空随机生成）</label><input v-model="form.cardPwd" type="text" placeholder="8位随机密码" class="form-input" /></div>
          <div class="form-row">
            <div class="form-group"><label>面值（元）</label><input v-model.number="form.faceValue" type="number" placeholder="100" min="1" class="form-input" /></div>
            <div class="form-group"><label>兑换金币数</label><input v-model.number="form.coinAmount" type="number" placeholder="100" min="1" class="form-input" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>有效期（天，0=永久）</label><input v-model.number="form.expireDays" type="number" placeholder="365" min="0" class="form-input" /></div>
            <div class="form-group" v-if="!editingCard"><label>生成数量（1~1000）</label><input v-model.number="form.count" type="number" placeholder="1" min="1" max="1000" class="form-input" /></div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>分类</label>
              <select v-model="form.category" class="form-input">
                <option value="">通用</option>
                <option value="vip">VIP专属</option>
                <option value="newbie">新人礼包</option>
                <option value="activity">活动赠送</option>
                <option value="general">通用</option>
              </select>
            </div>
            <div class="form-group"><label>标签</label><input v-model="form.tag" type="text" placeholder="如: 春节活动" class="form-input" /></div>
          </div>
          <div class="form-group"><label>备注</label><input v-model="form.remark" type="text" placeholder="可选备注" class="form-input" /></div>
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
          <div class="detail-item"><span class="detail-label">分类</span>{{ CATEGORY_MAP[currentCard.category] || currentCard.category || '-' }}</div>
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
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPost, apiPut, apiDelete, exportCSV, toast, confirm } = useAdmin()

// 常量
const CATEGORY_MAP = { vip: 'VIP专属', newbie: '新人礼包', activity: '活动赠送', general: '通用' }
const CATEGORY_COLORS = { vip: '#7c3aed', newbie: '#10b981', activity: '#f59e0b', general: '#3b82f6' }

// ========== 列表状态 ==========
const activeTab = ref('list')
const cardList = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const filterCategory = ref('')
const filterBatchNo = ref('')
const loading = ref(false)
const selectedIds = ref([])

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

// ========== 统计状态 ==========
const statsLoading = ref(false)
const statsData = ref(null)

// ========== 批量操作状态 ==========
const batchGenerating = ref(false)
const batchOpsRunning = ref(false)
const batchForm = reactive({ prefix: '', faceValue: 100, coinAmount: 100, expireDays: 365, count: 100, category: '', tag: '', pwd: '' })
const batchOps = reactive({ filterStatus: '', targetStatus: '3' })

// ========== 计算属性 ==========
const isAllSelected = computed(() => cardList.value.length > 0 && cardList.value.every(c => selectedIds.value.includes(c.id)))

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

const getBarColor = (name) => CATEGORY_COLORS[name] || '#6366f1'

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
      cardList.value = res.data?.list || []
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

// ========== 选择逻辑 ==========
const toggleSelect = (id) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

const toggleAll = () => {
  if (isAllSelected.value) selectedIds.value = []
  else selectedIds.value = cardList.value.map(c => c.id)
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
      if (res.code === 200) { toast(res.message || `成功生成 ${res.data?.count || 0} 张密卡`); showCreateModal.value = false; loadCards() }
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
  if (!(await confirm(`确定要删除选中的 ${selectedIds.value.length} 张密卡吗？已使用的不会被删除。`))) return
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
const exportAllData = async () => {
  try {
    const res = await apiGet('/api/admin/cards', { page: 1, pageSize: 99999 })
    const list = res.data?.list || []
    if (list.length === 0) { toast('暂无数据可导出', 'warning'); return }
    exportCSV(list, [
      { label: 'ID', key: 'id' },
      { label: '卡号', key: 'cardNo' },
      { label: '面值', key: 'faceValue' },
      { label: '金币', key: 'coinAmount' },
      { label: '分类', key: row => CATEGORY_MAP[row.category] || row.category || '' },
      { label: '标签', key: 'tag' },
      { label: '批次号', key: 'batchNo' },
      { label: '状态', key: 'statusName' },
      { label: '使用者ID', key: row => row.useUserId || '' },
      { label: '创建时间', key: row => formatTime(row.createTime) }
    ], 'cards_export')
    toast(`成功导出 ${list.length} 条数据`)
  } catch { toast('导出失败', 'error') }
}

const downloadTemplate = () => {
  const header = 'cardNo,cardPwd,faceValue,coinAmount,expireDays,category,tag'
  const sample = 'VIP2026001,abc12345,100,100,365,newbie,新人礼包\nVIP2026002,def67890,200,200,365,activity,春节活动'
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
      tag: parts[6] || ''
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
      loadCards()
    } else toast(res.message || '导入失败', 'error')
  } catch { toast('导入失败', 'error') }
  finally { importing.value = false }
}

// ========== 批量生成 ==========
const batchGenerate = async () => {
  if (!batchForm.faceValue || batchForm.faceValue <= 0) { toast('请输入有效面值', 'warning'); return }
  if (!batchForm.coinAmount || batchForm.coinAmount <= 0) { toast('请输入有效金币数', 'warning'); return }
  if (!batchForm.count || batchForm.count <= 0 || batchForm.count > 1000) { toast('生成数量需在1~1000之间', 'warning'); return }
  batchGenerating.value = true
  try {
    const res = await apiPost('/api/admin/cards', {
      cardNo: batchForm.prefix,
      cardPwd: batchForm.pwd,
      faceValue: batchForm.faceValue,
      coinAmount: batchForm.coinAmount,
      expireDays: batchForm.expireDays,
      count: batchForm.count,
      category: batchForm.category,
      tag: batchForm.tag
    })
    if (res.code === 200) toast(res.message || `成功生成 ${res.data?.count || 0} 张密卡`)
    else toast(res.message || '生成失败', 'error')
  } catch { toast('生成失败', 'error') }
  finally { batchGenerating.value = false }
}

// ========== 按条件批量操作 ==========
const batchOpsExecute = async () => {
  if (!batchOps.filterStatus) { toast('请选择筛选条件', 'warning'); return }
  batchOpsRunning.value = true
  try {
    // 先获取符合条件的密卡ID列表
    const res = await apiGet('/api/admin/cards', { page: 1, pageSize: 99999, status: batchOps.filterStatus })
    const ids = (res.data?.list || []).map(c => c.id)
    if (ids.length === 0) { toast('没有符合条件的密卡', 'warning'); batchOpsRunning.value = false; return }
    const label = batchOps.targetStatus === '3' ? '禁用' : '启用'
    if (!(await confirm(`找到 ${ids.length} 张密卡，确认全部${label}？`))) { batchOpsRunning.value = false; return }
    const r2 = await apiPost('/api/admin/cards/batch-status', { ids, status: parseInt(batchOps.targetStatus) })
    if (r2.code === 200) toast(r2.message || `成功${label} ${r2.data.count} 张密卡`)
    else toast(r2.message || '操作失败', 'error')
  } catch { toast('操作失败', 'error') }
  finally { batchOpsRunning.value = false }
}

onMounted(() => { loadCards() })
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

/* 批量操作面板 */
.batch-panel { display: flex; flex-direction: column; gap: 20px; }
.batch-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; }
.batch-card-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
.batch-form { display: flex; flex-direction: column; gap: 12px; }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.import-methods { display: flex; gap: 20px; }
.import-method { flex: 1; }
.import-method h4 { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
.hint { font-size: 12px; color: #9ca3af; margin-bottom: 4px; line-height: 1.5; }
.import-textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 12px; font-family: monospace; resize: vertical; box-sizing: border-box; outline: none; }
.import-textarea:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
.import-divider { display: flex; align-items: center; color: #d1d5db; font-size: 13px; }
.import-divider::before, .import-divider::after { content: ''; flex: 1; border-top: 1px solid #e5e7eb; }

/* 弹窗 */
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

@media (max-width: 768px) {
  .stats-cards { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .form-row-3 { grid-template-columns: 1fr; }
  .import-methods { flex-direction: column; }
}
</style>
