import { request } from '../common/common'
import { validateParams } from '../common/common'

const circleService = {
  async getTags() {
    return request('/api/circle/tags', 'GET')
  },

  async getPosts(params = {}) {
    const { tag, page = 1, pageSize = 20, sort = 'default' } = params
    const data = { page, pageSize }
    if (tag) data.tag = tag
    if (sort) data.sort = sort
    return request('/api/circle/posts', 'GET', data)
  },

  async getPostDetail(postId) {
    validateParams({ postId }, {
      postId: { required: true, label: '帖子ID', type: 'number' }
    })
    return request(`/api/circle/post/${postId}`, 'GET')
  },

  async getMyPosts(params = {}) {
    const { page = 1, pageSize = 20 } = params
    return request('/api/circle/my-posts', 'GET', { page, pageSize })
  },

  async getComments(postId, params = {}) {
    validateParams({ postId }, {
      postId: { required: true, label: '帖子ID', type: 'number' }
    })
    const { page = 1, pageSize = 20 } = params
    return request('/api/circle/comments', 'GET', { postId, page, pageSize })
  },

  async createPost(params) {
    validateParams(params, {
      content: { required: true, label: '内容', type: 'string', maxLength: 500 }
    })
    return request('/api/circle/create', 'POST', params)
  },

  async likePost(postId) {
    validateParams({ postId }, {
      postId: { required: true, label: '帖子ID', type: 'number' }
    })
    return request('/api/circle/like', 'POST', { postId })
  },

  async unlikePost(postId) {
    validateParams({ postId }, {
      postId: { required: true, label: '帖子ID', type: 'number' }
    })
    return request('/api/circle/unlike', 'POST', { postId })
  },

  async commentPost(postId, content, replyId = null) {
    validateParams({ postId, content }, {
      postId: { required: true, label: '帖子ID', type: 'number' },
      content: { required: true, label: '评论内容', type: 'string', maxLength: 200 }
    })
    return request('/api/circle/comment', 'POST', { postId, content, replyId })
  },

  async deletePost(postId) {
    validateParams({ postId }, {
      postId: { required: true, label: '帖子ID', type: 'number' }
    })
    return request('/api/circle/delete', 'POST', { postId })
  },

  async unlockPost(postId, password = '') {
    validateParams({ postId }, {
      postId: { required: true, label: '帖子ID', type: 'number' }
    })
    return request('/api/circle/unlock', 'POST', { postId, password })
  },

  async sharePost(postId) {
    validateParams({ postId }, {
      postId: { required: true, label: '帖子ID', type: 'number' }
    })
    return request('/api/circle/share', 'POST', { postId })
  },

  async reportPost(postId, reason, description = '') {
    validateParams({ postId, reason }, {
      postId: { required: true, label: '帖子ID', type: 'number' },
      reason: { required: true, label: '举报原因', type: 'string' }
    })
    return request('/api/report', 'POST', { type: 'post', targetId: postId, reason, description })
  }
}

export default circleService
