/**
 * 前端 Mock 数据生成器
 * 用于 API 失败时降级展示，返回 camelCase 格式的数据
 */

const mockUsers = [
  { userId: 1, nickName: '游戏达人小王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m1', level: 25, vip: true },
  { userId: 2, nickName: '电竞少女', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m2', level: 18, vip: true },
  { userId: 3, nickName: '王者大神', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m3', level: 30, vip: false },
  { userId: 4, nickName: '明天会更好', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m4', level: 12, vip: false },
  { userId: 5, nickName: '上分找我', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m5', level: 22, vip: true },
  { userId: 6, nickName: '低调的玩家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m6', level: 15, vip: false },
  { userId: 7, nickName: '峡谷探险家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m7', level: 28, vip: true },
  { userId: 8, nickName: '快乐小鱼', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m8', level: 10, vip: false },
  { userId: 9, nickName: '不赢不下线', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m9', level: 20, vip: false },
  { userId: 10, nickName: '喵了个咪', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m10', level: 16, vip: true }
]

const mockContents = [
  '今天开黑三连胜，队友配合太默契了！🎮',
  '有没有一起上分的小伙伴？钻石段位求组队',
  '新赛季冲王者，有没有一起的？',
  '终于抽到了心仪的角色，太开心了！',
  '分享一波最新操作集锦，大佬勿喷~',
  '今晚8点直播间不见不散，一起上分！',
  '打了一天终于上王者了，累但值得',
  '新人报道，求大佬带带🙏',
  '这个版本的平衡性感觉比上赛季好多了',
  '周末通宵上分的有吗？私信滴滴',
  '刚买的新皮肤，手感真好！',
  '有人知道这个英雄怎么出装吗？求教学',
  '连胜之后必连败，这就是命吗...',
  '推荐一个冷门但很强的英雄，亲测好用',
  '今天遇到一个超友好的队友，感恩~',
  '赛季末冲分，有没有固定车队招人？',
  '单排太难了，来几个靠谱的队友吧',
  '分享一下我的键位设置，适合新手上路'
]

const mockTags = [
  '游戏', '开黑', '交友', '攻略', '灌水',
  '手游', '端游', '组队', '活动', '赛事'
]

const mockImages = [
  ['https://picsum.photos/400/300?random=101', 'https://picsum.photos/400/300?random=102', 'https://picsum.photos/400/300?random=103'],
  ['https://picsum.photos/400/300?random=201', 'https://picsum.photos/400/300?random=202'],
  ['https://picsum.photos/400/300?random=301'],
  null,
  ['https://picsum.photos/400/300?random=401', 'https://picsum.photos/400/300?random=402'],
  null,
  ['https://picsum.photos/400/300?random=501'],
  ['https://picsum.photos/400/300?random=601', 'https://picsum.photos/400/300?random=602', 'https://picsum.photos/400/300?random=603'],
  null,
  ['https://picsum.photos/400/300?random=701', 'https://picsum.photos/400/300?random=702']
]

export function generateMockPosts(count = 10) {
  const posts = []
  for (let i = 0; i < count; i++) {
    const user = mockUsers[i % mockUsers.length]
    const content = mockContents[i % mockContents.length]
    const tagName = mockTags[i % mockTags.length]
    const images = mockImages[i % mockImages.length]
    const postId = 1000 + i

    posts.push({
      postId,
      userId: user.userId,
      nickName: user.nickName,
      avatar: user.avatar,
      level: user.level,
      vip: user.vip,
      content,
      images: images || [],
      tagName,
      likes: Math.floor(Math.random() * 200) + 10,
      comments: Math.floor(Math.random() * 50) + 1,
      isLike: Math.random() > 0.5,
      isFollow: Math.random() > 0.6,
      gameName: ['王者荣耀', '和平精英', '原神', '崩坏星穹铁道', '英雄联盟手游'][i % 5],
      createTime: Date.now() - Math.floor(Math.random() * 7 * 86400000) - Math.floor(Math.random() * 86400000)
    })
  }
  return posts
}
