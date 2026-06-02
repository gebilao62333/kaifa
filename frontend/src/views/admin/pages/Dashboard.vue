<template>
  <div>
<div class="dashboard">
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
