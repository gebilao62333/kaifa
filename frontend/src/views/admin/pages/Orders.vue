<template>
  <div>
<div class="order-list">
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
