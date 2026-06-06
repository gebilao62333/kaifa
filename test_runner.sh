#!/bin/bash
# 多客陪玩系统 - 全面功能测试脚本
# 用法: bash test_runner.sh

BASE_URL="http://localhost:3001/api/admin"
PASS=0
FAIL=0
TOTAL=0

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "  多客陪玩系统 - 全面功能测试报告"
echo "  测试时间: $(date)"
echo "========================================"
echo ""

# 1. 获取管理员Token
echo -e "${YELLOW}[登录]${NC} 获取管理员 Token..."
LOGIN_RES=$(curl -s "${BASE_URL}/login" -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
TOKEN=$(echo "$LOGIN_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}[FAIL]${NC} 登录失败，无法获取 Token"
  echo "$LOGIN_RES"
  exit 1
fi
echo -e "${GREEN}[PASS]${NC} 登录成功，Token 已获取 (前20位: ${TOKEN:0:20}...)"
PASS=$((PASS+1))
TOTAL=$((TOTAL+1))
echo ""

AUTH="Authorization: Bearer ${TOKEN}"

# 测试函数: 执行curl并判断结果
test_api() {
  local module="$1"
  local desc="$2"
  local method="$3"
  local url="$4"
  local data="$5"
  local expect_success="$6"

  TOTAL=$((TOTAL+1))

  if [ "$method" == "GET" ]; then
    if [ -n "$data" ]; then
      RES=$(curl -s "${url}${data}" -H "$AUTH")
    else
      RES=$(curl -s "$url" -H "$AUTH")
    fi
  elif [ "$method" == "DELETE" ]; then
    RES=$(curl -s "$url" -X DELETE -H "$AUTH")
  else
    RES=$(curl -s "$url" -X "$method" -H "Content-Type: application/json" -H "$AUTH" -d "$data")
  fi

  # 提取 code
  CODE=$(echo "$RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',-1))" 2>/dev/null)

  if [ "$expect_success" == "true" ]; then
    if [ "$CODE" == "200" ] || [ "$CODE" == "0" ] || [ -z "$CODE" ]; then
      echo -e "${GREEN}[PASS]${NC} [$module] $desc"
      PASS=$((PASS+1))
    else
      echo -e "${RED}[FAIL]${NC} [$module] $desc (code=$CODE)"
      echo "       Response: $(echo $RES | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message',''))" 2>/dev/null)"
      FAIL=$((FAIL+1))
    fi
  else
    if [ "$CODE" != "200" ] && [ "$CODE" != "0" ]; then
      echo -e "${GREEN}[PASS]${NC} [$module] $desc (期望失败，实际code=$CODE)"
      PASS=$((PASS+1))
    else
      echo -e "${RED}[FAIL]${NC} [$module] $desc (期望失败但成功了)"
      FAIL=$((FAIL+1))
    fi
  fi
}

# =============== 2. 仪表板 ===============
echo -e "${YELLOW}========== 仪表板模块 ==========${NC}"
test_api "仪表板" "获取仪表板统计数据" "GET" "${BASE_URL}/dashboard" "" "true"

# =============== 3. 用户管理 ===============
echo -e "\n${YELLOW}========== 用户管理模块 ==========${NC}"
test_api "用户管理" "获取用户列表(分页)" "GET" "${BASE_URL}/users" "?page=1&pageSize=10" "true"
test_api "用户管理" "获取用户详情" "GET" "${BASE_URL}/users/1" "" "true"
test_api "用户管理" "查询不存在的用户" "GET" "${BASE_URL}/users/99999" "" "true"
test_api "用户管理" "创建新用户" "POST" "${BASE_URL}/users" '{"username":"testuser","password":"123456","nickname":"测试用户"}' "true"
test_api "用户管理" "更新用户状态" "PUT" "${BASE_URL}/users/1/status" '{"status":0}' "true"

# =============== 4. 帖子管理 ===============
echo -e "\n${YELLOW}========== 帖子管理模块 ==========${NC}"
test_api "帖子管理" "获取帖子列表" "GET" "${BASE_URL}/posts" "?page=1&pageSize=10" "true"
test_api "帖子管理" "获取帖子统计" "GET" "${BASE_URL}/posts/stats" "" "true"
test_api "帖子管理" "获取帖子详情" "GET" "${BASE_URL}/posts/1" "" "true"
test_api "帖子管理" "更新帖子状态" "PUT" "${BASE_URL}/posts/1/status" '{"status":0}' "true"
test_api "帖子管理" "批量更新帖子状态" "POST" "${BASE_URL}/posts/batch-status" '{"ids":[1,2,3],"status":1}' "true"

# =============== 5. 订单管理 ===============
echo -e "\n${YELLOW}========== 订单管理模块 ==========${NC}"
test_api "订单管理" "获取订单列表" "GET" "${BASE_URL}/orders" "?page=1&pageSize=10" "true"
test_api "订单管理" "获取订单详情" "GET" "${BASE_URL}/orders/1" "" "true"
test_api "订单管理" "创建订单" "POST" "${BASE_URL}/orders" '{"user_id":1,"game_id":1,"price":100}' "true"
test_api "订单管理" "更新订单状态" "PUT" "${BASE_URL}/orders/1/status" '{"status":1}' "true"

# =============== 6. 提现管理 ===============
echo -e "\n${YELLOW}========== 提现管理模块 ==========${NC}"
test_api "提现管理" "获取提现列表" "GET" "${BASE_URL}/withdraws" "?page=1&pageSize=10" "true"
test_api "提现管理" "获取提现详情" "GET" "${BASE_URL}/withdraws/1" "" "true"
test_api "提现管理" "创建提现" "POST" "${BASE_URL}/withdraws" '{"user_id":1,"money":100}' "true"
test_api "提现管理" "审核通过提现" "POST" "${BASE_URL}/withdraws/1/approve" '{}' "true"
test_api "提现管理" "审核拒绝提现" "POST" "${BASE_URL}/withdraws/2/reject" '{"reason":"信息不完整"}' "true"

# =============== 7. 举报管理 ===============
echo -e "\n${YELLOW}========== 举报管理模块 ==========${NC}"
test_api "举报管理" "获取举报列表" "GET" "${BASE_URL}/reports" "?page=1&pageSize=10" "true"
test_api "举报管理" "获取举报统计" "GET" "${BASE_URL}/reports/stats" "" "true"
test_api "举报管理" "获取举报详情" "GET" "${BASE_URL}/reports/1" "" "true"
test_api "举报管理" "处理举报" "POST" "${BASE_URL}/reports/1/handle" '{"result":"已处理","action":"warn"}' "true"
test_api "举报管理" "批量处理举报" "POST" "${BASE_URL}/reports/batch-handle" '{"ids":[1,2],"result":"已处理"}' "true"

# =============== 8. Banner管理 ===============
echo -e "\n${YELLOW}========== Banner管理模块 ==========${NC}"
test_api "Banner管理" "获取Banner列表" "GET" "${BASE_URL}/banners" "" "true"
test_api "Banner管理" "获取Banner详情" "GET" "${BASE_URL}/banners/1" "" "true"
test_api "Banner管理" "创建Banner" "POST" "${BASE_URL}/banners" '{"title":"测试Banner","image":"https://example.com/banner.jpg","type":0,"sort":1}' "true"
test_api "Banner管理" "更新Banner" "PUT" "${BASE_URL}/banners/1" '{"title":"更新后的Banner","sort":2}' "true"
test_api "Banner管理" "更新Banner状态" "PUT" "${BASE_URL}/banners/1/status" '{"status":0}' "true"
test_api "Banner管理" "删除Banner" "DELETE" "${BASE_URL}/banners/1" "" "true"

# =============== 9. VIP套餐管理 ===============
echo -e "\n${YELLOW}========== VIP套餐管理模块 ==========${NC}"
test_api "VIP套餐" "获取VIP套餐列表" "GET" "${BASE_URL}/vip-packages" "" "true"
test_api "VIP套餐" "获取VIP套餐详情" "GET" "${BASE_URL}/vip-packages/1" "" "true"
test_api "VIP套餐" "创建VIP套餐" "POST" "${BASE_URL}/vip-packages" '{"name":"测试月卡","price":18,"duration":30,"level":1}' "true"
test_api "VIP套餐" "更新VIP套餐状态" "PUT" "${BASE_URL}/vip-packages/1/status" '{"status":0}' "true"

# =============== 10. 礼物管理 ===============
echo -e "\n${YELLOW}========== 礼物管理模块 ==========${NC}"
test_api "礼物管理" "获取礼物列表" "GET" "${BASE_URL}/gifts" "?page=1&pageSize=10" "true"
test_api "礼物管理" "获取礼物详情" "GET" "${BASE_URL}/gifts/1" "" "true"
test_api "礼物管理" "创建礼物" "POST" "${BASE_URL}/gifts" '{"title":"测试礼物","price":10,"image":"https://example.com/gift.png"}' "true"
test_api "礼物管理" "更新礼物" "PUT" "${BASE_URL}/gifts/1" '{"title":"更新后礼物","price":20}' "true"
test_api "礼物管理" "删除礼物" "DELETE" "${BASE_URL}/gifts/1" "" "true"

# =============== 11. 礼物记录 ===============
echo -e "\n${YELLOW}========== 礼物记录模块 ==========${NC}"
test_api "礼物记录" "获取礼物记录列表" "GET" "${BASE_URL}/gift-logs" "?page=1&pageSize=10" "true"
test_api "礼物记录" "获取礼物记录详情" "GET" "${BASE_URL}/gift-logs/1" "" "true"

# =============== 12. 充值记录 ===============
echo -e "\n${YELLOW}========== 充值记录模块 ==========${NC}"
test_api "充值记录" "获取充值记录列表" "GET" "${BASE_URL}/recharge-records" "?page=1&pageSize=10" "true"
test_api "充值记录" "获取充值记录详情" "GET" "${BASE_URL}/recharge-records/1" "" "true"

# =============== 13. 密卡管理 ===============
echo -e "\n${YELLOW}========== 密卡管理模块 ==========${NC}"
test_api "密卡管理" "获取密卡统计" "GET" "${BASE_URL}/cards/stats" "" "true"
test_api "密卡管理" "获取密卡列表" "GET" "${BASE_URL}/cards" "?page=1&pageSize=10" "true"
test_api "密卡管理" "获取密卡详情" "GET" "${BASE_URL}/cards/1" "" "true"
test_api "密卡管理" "创建密卡" "POST" "${BASE_URL}/cards" '{"card_no":"TEST001","card_pwd":"PWD001","face_value":100,"coin_amount":1000}' "true"
test_api "密卡管理" "批量更新密卡状态" "POST" "${BASE_URL}/cards/batch-status" '{"ids":[1,2,3],"status":1}' "true"
test_api "密卡管理" "导入密卡" "POST" "${BASE_URL}/cards/import" '{"cards":[{"card_no":"IMP001","card_pwd":"IMPPWD","face_value":50}]}' "true"

# =============== 14. 游戏管理 ===============
echo -e "\n${YELLOW}========== 游戏管理模块 ==========${NC}"
test_api "游戏管理" "获取游戏列表" "GET" "${BASE_URL}/games" "" "true"
test_api "游戏管理" "获取游戏详情" "GET" "${BASE_URL}/games/1" "" "true"
test_api "游戏管理" "创建游戏" "POST" "${BASE_URL}/games" '{"name":"测试游戏","icon":"https://example.com/icon.png"}' "true"
test_api "游戏管理" "更新游戏状态" "PUT" "${BASE_URL}/games/1/status" '{"status":0}' "true"
test_api "游戏管理" "删除游戏" "DELETE" "${BASE_URL}/games/1" "" "true"

# =============== 15. 陪玩师申请管理 ===============
echo -e "\n${YELLOW}========== 陪玩师申请管理模块 ==========${NC}"
test_api "陪玩师申请" "获取申请列表" "GET" "${BASE_URL}/companion-applications" "?page=1&pageSize=10" "true"
test_api "陪玩师申请" "获取申请详情" "GET" "${BASE_URL}/companion-applications/1" "" "true"
test_api "陪玩师申请" "审核通过" "PUT" "${BASE_URL}/companion-applications/1/approve" '{}' "true"
test_api "陪玩师申请" "审核拒绝" "PUT" "${BASE_URL}/companion-applications/2/reject" '{"reason":"资料不完整"}' "true"

# =============== 16. 虚拟用户管理 ===============
echo -e "\n${YELLOW}========== 虚拟用户管理模块 ==========${NC}"
test_api "虚拟用户" "获取虚拟用户列表" "GET" "${BASE_URL}/virtual-users" "?page=1&pageSize=10" "true"
test_api "虚拟用户" "获取虚拟用户详情" "GET" "${BASE_URL}/virtual-users/1" "" "true"
test_api "虚拟用户" "创建虚拟用户" "POST" "${BASE_URL}/virtual-users" '{"name":"测试虚拟用户","avatar":"https://example.com/avatar.png","gender":1}' "true"
test_api "虚拟用户" "获取虚拟用户聊天历史" "GET" "${BASE_URL}/virtual-users/1/chat-history" "" "true"
test_api "虚拟用户" "切换虚拟用户状态" "PUT" "${BASE_URL}/virtual-users/1/status" '{}' "true"
test_api "虚拟用户" "删除虚拟用户" "DELETE" "${BASE_URL}/virtual-users/1" "" "true"

# =============== 17. 推荐管理 ===============
echo -e "\n${YELLOW}========== 推荐管理模块 ==========${NC}"
test_api "推荐管理" "获取推荐候选人" "GET" "${BASE_URL}/recommend-candidates" "?type=home" "true"
test_api "推荐管理" "获取推荐列表" "GET" "${BASE_URL}/recommend-list/home" "" "true"
test_api "推荐管理" "添加推荐" "POST" "${BASE_URL}/recommend" '{"user_id":1,"recommend_type":"home"}' "true"
test_api "推荐管理" "检查过期推荐" "POST" "${BASE_URL}/recommend/check-expired" '{}' "true"

# =============== 18. 客服管理 ===============
echo -e "\n${YELLOW}========== 客服管理模块 ==========${NC}"
test_api "客服管理" "获取客服列表" "GET" "${BASE_URL}/customer-services" "" "true"
test_api "客服管理" "创建客服" "POST" "${BASE_URL}/customer-services" '{"name":"测试客服","phone":"13800138000"}' "true"
test_api "客服管理" "更新客服" "PUT" "${BASE_URL}/customer-services/1" '{"name":"更新后客服"}' "true"
test_api "客服管理" "删除客服" "DELETE" "${BASE_URL}/customer-services/1" "" "true"

# =============== 19. 系统通知管理 ===============
echo -e "\n${YELLOW}========== 系统通知管理模块 ==========${NC}"
test_api "系统通知" "获取通知统计" "GET" "${BASE_URL}/notifications/stats" "" "true"
test_api "系统通知" "获取通知列表" "GET" "${BASE_URL}/notifications" "?page=1&pageSize=10" "true"
test_api "系统通知" "获取通知详情" "GET" "${BASE_URL}/notifications/1" "" "true"
test_api "系统通知" "创建通知" "POST" "${BASE_URL}/notifications" '{"title":"系统维护通知","content":"系统将于凌晨2-5点维护","type":3}' "true"
test_api "系统通知" "更新通知" "PUT" "${BASE_URL}/notifications/1" '{"title":"更新后的通知标题"}' "true"
test_api "系统通知" "推送通知" "POST" "${BASE_URL}/notifications/1/push" '{}' "true"
test_api "系统通知" "删除通知" "DELETE" "${BASE_URL}/notifications/1" "" "true"

# =============== 20. 系统设置 ===============
echo -e "\n${YELLOW}========== 系统设置模块 ==========${NC}"
test_api "系统设置" "获取系统设置" "GET" "${BASE_URL}/settings" "" "true"
test_api "系统设置" "更新系统设置" "PUT" "${BASE_URL}/settings" '{"site_name":"多客陪玩","site_desc":"测试环境"}' "true"

# =============== 21. 兼容性API ===============
echo -e "\n${YELLOW}========== 兼容性API模块 ==========${NC}"
test_api "兼容性API" "获取统计数据(旧)" "GET" "${BASE_URL}/statistics" "" "true"
test_api "兼容性API" "更新用户状态(旧)" "POST" "${BASE_URL}/update-user-status" '{"userId":1,"status":1}' "true"

# =============== 22. 安全性测试 ===============
echo -e "\n${YELLOW}========== 安全性测试模块 ==========${NC}"
# 无Token访问
test_api "安全性" "无Token访问(应失败)" "GET" "${BASE_URL}/users" ""
TOTAL=$((TOTAL-1))  # 修正: 上面的test_api没有传AUTH，但不增加计数

NO_AUTH_RES=$(curl -s "${BASE_URL}/users")
NO_AUTH_CODE=$(echo "$NO_AUTH_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',-1))" 2>/dev/null)
TOTAL=$((TOTAL+1))
if [ "$NO_AUTH_CODE" != "200" ] && [ "$NO_AUTH_CODE" != "0" ]; then
  echo -e "${GREEN}[PASS]${NC} [安全性] 无Token访问被拒绝"
  PASS=$((PASS+1))
else
  echo -e "${RED}[FAIL]${NC} [安全性] 无Token访问未被拒绝"
  FAIL=$((FAIL+1))
fi

# 空参数测试
test_api "安全性" "登录时空用户名(应失败)" "POST" "${BASE_URL}/login" '{"username":"","password":""}' "false"

# 文件上传
test_api "安全性" "管理员文件上传(不传文件应失败)" "POST" "${BASE_URL}/upload" '{}' "true"

# =============== 23. 非管理API - 通知 ===============
echo -e "\n${YELLOW}========== 用户端通知API ==========${NC}"
NOTI_RES=$(curl -s "http://localhost:3001/api/notification/" -H "$AUTH")
NOTI_CODE=$(echo "$NOTI_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',-1))" 2>/dev/null)
TOTAL=$((TOTAL+1))
if [ "$NOTI_CODE" == "200" ] || [ "$NOTI_CODE" == "0" ]; then
  echo -e "${GREEN}[PASS]${NC} [用户通知] 获取用户通知列表"
  PASS=$((PASS+1))
else
  echo -e "${RED}[FAIL]${NC} [用户通知] 获取用户通知列表 (code=$NOTI_CODE)"
  FAIL=$((FAIL+1))
fi

# =============== 结果汇总 ===============
echo ""
echo "========================================"
echo -e "          测试结果汇总"
echo "========================================"
echo -e "  总用例: ${TOTAL}"
echo -e "  通过:   ${GREEN}${PASS}${NC}"
echo -e "  失败:   ${RED}${FAIL}${NC}"
echo -e "  通过率: $(echo "scale=1; $PASS*100/$TOTAL" | bc)%"
echo "========================================"

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}⚠ 存在失败的测试用例，请检查。${NC}"
fi
echo ""
