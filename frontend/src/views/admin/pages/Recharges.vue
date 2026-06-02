<template>
  <div>
<div class="recharge-list">
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
