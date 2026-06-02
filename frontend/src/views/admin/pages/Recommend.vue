<template>
  <div>
<div class="recommend-page">
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
