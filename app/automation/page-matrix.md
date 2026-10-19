# 页面迁移矩阵（自动生成）

- 生成时间：2026-10-19T03:50:22.460Z
- 冒烟报告：smoke-20261019-115001.json

| 页面 | 原路径 | 鉴权 | H5 冒烟 | 截图 |
|---|---|---|---|---|
| Login | /login | 否 | OK | Login.png |
| Home | /home | 否 | OK | Home.png |
| Search | /search | 否 | OK | Search.png |
| Square | /square | 否 | OK | Square.png |
| Preferred | /preferred | 否 | OK | Preferred.png |
| Mine | /mine | 否 | OK | Mine.png |
| Friend | /friend | 否 | OK | Friend.png |
| CompanionApply | /companion-apply | 是 | OK | CompanionApply.png |
| CompanionList | /companion-list | 是 | OK | CompanionList.png |
| PostDetail | /post-detail/:id | 否 | OK | PostDetail.png |
| PublishPost | /publish-post | 是 | OK | PublishPost.png |
| PublishDemand | /publish-demand | 是 | OK | PublishDemand.png |
| ChatRoom | /chat-room/:id | 是 | OK | ChatRoom.png |
| Recharge | /recharge | 是 | OK | Recharge.png |
| VipCenter | /vip-center | 是 | OK | VipCenter.png |
| GameIndex | /game-index | 是 | OK | GameIndex.png |
| Paidan | /paidan | 是 | OK | Paidan.png |
| MyServices | /my-services | 是 | OK | MyServices.png |
| Wallet | /wallet | 是 | OK | Wallet.png |
| CardRecharge | /card-recharge | 是 | OK | CardRecharge.png |
| MyOrder | /my-order | 是 | OK | MyOrder.png |
| MyDynamic | /my-dynamic | 是 | OK | MyDynamic.png |
| IncomeRecords | /income-records | 是 | OK | IncomeRecords.png |
| ExpenseRecords | /expense-records | 是 | OK | ExpenseRecords.png |
| WithdrawRecords | /withdraw-records | 是 | OK | WithdrawRecords.png |
| Withdraw | /withdraw | 是 | OK | Withdraw.png |
| PaymentGateway | /payment-gateway | 是 | OK | PaymentGateway.png |
| LikesRecords | /likes-records | 是 | OK | LikesRecords.png |
| VisitedRecords | /visitors-records | 是 | OK | VisitedRecords.png |
| EditProfile | /edit-profile | 是 | OK | EditProfile.png |
| Settings | /settings | 是 | OK | Settings.png |
| MyAlbum | /my-album | 是 | OK | MyAlbum.png |
| MyReserve | /my-reserve | 是 | OK | MyReserve.png |
| MyReports | /my-reports | 是 | OK | MyReports.png |
| RealName | /real-name | 是 | OK | RealName.png |
| Feedback | /feedback | 是 | OK | Feedback.png |
| AboutUs | /about-us | 是 | OK | AboutUs.png |
| Follows | /follows | 是 | OK | Follows.png |
| Fans | /fans | 是 | OK | Fans.png |
| UserProfile | /user/:id | 是 | OK | UserProfile.png |
| VideoCall | /call/:id/video | 是 | OK | VideoCall.png |
| AudioCall | /call/:id/audio | 是 | OK | AudioCall.png |
| CustomerService | /customer-service | 是 | OK | CustomerService.png |
| LevelAcceleration | /level-acceleration | 是 | OK | LevelAcceleration.png |
| IdentityBadge | /identity-badge | 是 | OK | IdentityBadge.png |
| AvatarFrame | /avatar-frame | 是 | OK | AvatarFrame.png |
| StealthVisit | /stealth-visit | 是 | OK | StealthVisit.png |
| PriorityMatching | /priority-matching | 是 | OK | PriorityMatching.png |
| SkinShop | /skin-shop | 是 | OK | SkinShop.png |
| VirtualUserList | /ai-chat | 是 | OK | VirtualUserList.png |
| AIChat | /ai-chat/:id | 是 | OK | AIChat.png |
| TagManager | /tag-manager | 是 | OK | TagManager.png |
| NotFound | - | 否 | OK | NotFound.png |

## 旧路径兼容
- post-detail/1 → http://127.0.0.1:5174/pages/PostDetail?id=1（OK）
- chat-room/1 → http://127.0.0.1:5174/pages/ChatRoom?id=1（OK）
- user/1 → http://127.0.0.1:5174/pages/UserProfile?id=1（OK）
- call/1/audio?incoming=1&mode=webrtc → http://127.0.0.1:5174/pages/AudioCall?id=1&incoming=1&mode=webrtc（OK）

## 404
- OK：http://127.0.0.1:5174/pages/NotFound
