$ErrorActionPreference = "Continue"
$base = "http://localhost"
$pass = 0; $fail = 0

function t($method, $path, $body, $token, $expect=200, $desc="") {
  try {
    $h = @{"Content-Type"="application/json"}
    if ($token) { $h["Authorization"] = "Bearer $token" }
    $uri = "$base$path"
    if ($method -eq "GET") {
      $r = Invoke-WebRequest -Uri $uri -Method GET -Headers $h -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
    } else {
      $j = if ($body) { $body | ConvertTo-Json -Compress -Depth 10 } else { "{}" }
      $r = Invoke-WebRequest -Uri $uri -Method POST -Headers $h -Body $j -ContentType "application/json" -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
    }
    $c = [int]$r.StatusCode
    $ec = if ($expect -is [array]) { $expect } else { @($expect) }
    $ok = $c -in $ec
    if ($ok) { $script:pass++; Write-Host "  [PASS] $desc (HTTP $c)" -ForegroundColor Green }
    else { $script:fail++; Write-Host "  [FAIL] $desc (HTTP $c, expected $expect)" -ForegroundColor Red }
    return @{ok=$ok; data=$r.Content; code=$c}
  } catch {
    $c = 0
    if ($_.Exception.Response) { $c = [int]$_.Exception.Response.StatusCode.value__ }
    $ec = if ($expect -is [array]) { $expect } else { @($expect) }
    $ok = $c -in $ec
    $d = ""
    try { $s = $_.Exception.Response.GetResponseStream(); $r2 = New-Object System.IO.StreamReader($s); $d = $r2.ReadToEnd() } catch {}
    if ($ok) { $script:pass++; Write-Host "  [PASS] $desc (HTTP $c)" -ForegroundColor Green }
    else { $script:fail++; Write-Host "  [FAIL] $desc (HTTP $c, expected $expect)" -ForegroundColor Red }
    return @{ok=$ok; data=$d; code=$c}
  }
}

Write-Host "`n*** Duoke Full Test - All Modules (58 Users in DB) ***" -ForegroundColor Cyan

# ============ 1. Auth ============
Write-Host "`n--- Auth ---" -ForegroundColor Yellow
$ar = t POST "/api/admin/login" @{username="admin";password="admin123"} $null 200 "Admin Login"
$at = ""; if ($ar.ok) { $d = $ar.data | ConvertFrom-Json; $at = $d.data.token }

$u1 = t POST "/api/user/login" @{username="13810000100";password="123456"} $null 200 "User1 Login"
$t1 = ""; $id1 = ""; if ($u1.ok) { $d = $u1.data | ConvertFrom-Json; $t1 = $d.data.accessToken; $id1 = $d.data.userId }

$u2 = t POST "/api/user/login" @{username="13810000101";password="123456"} $null 200 "User2 Login"
$t2 = ""; $id2 = ""; if ($u2.ok) { $d = $u2.data | ConvertFrom-Json; $t2 = $d.data.accessToken; $id2 = $d.data.userId }
Write-Host "  Tokens: admin=$($at.Length) u1=$id1 u2=$id2" -ForegroundColor DarkGray

# ============ 2. Profile ============
Write-Host "`n--- User Profile ---" -ForegroundColor Yellow
t GET "/api/user/get" $null $t1 200 "Get Profile"
t POST "/api/user/update" @{nickname="TestNew";city="Beijing";sex=1} $t1 200 "Update Profile"

# ============ 3. Follow ============
Write-Host "`n--- Follow ---" -ForegroundColor Yellow
t POST "/api/user/follow" @{targetUserId=$id2} $t1 200 "Follow User2"
t GET "/api/user/follows?page=1&pageSize=10" $null $t1 200 "My Follows"
t GET "/api/user/fans?page=1&pageSize=10" $null $t2 200 "User2 Fans"

# ============ 4. Chat ============
Write-Host "`n--- Chat ---" -ForegroundColor Yellow
t GET "/api/chat/list" $null $t1 200 "Chat List"
t POST "/api/chat/send" @{toId=$id2;content="Hello test!";type="text"} $t1 @(200,201,400) "Send Message"

# ============ 5. Circle ============
Write-Host "`n--- Circle ---" -ForegroundColor Yellow
$pr = t POST "/api/circle/create" @{content="Test post #game";images="";type="text"} $t1 @(200,201) "Create Post"
$postId = ""; if ($pr.ok) { try { $dd = $pr.data | ConvertFrom-Json; $postId = $dd.data.postId; if (!$postId) { $postId = $dd.data.id } } catch {} }
t GET "/api/circle/posts?page=1&pageSize=10" $null $null 200 "Post List"
t GET "/api/circle/my-posts" $null $t1 200 "My Posts"
if ($postId) { t POST "/api/circle/like" @{postId=$postId} $t1 200 "Like Post" }
if ($postId) { t POST "/api/circle/comment" @{postId=$postId;content="Nice!"} $t2 @(200,201) "Comment" }
if ($postId) { t GET "/api/circle/comments?postId=$postId&page=1&pageSize=10" $null $null 200 "Get Comments" }

# ============ 6. Gift ============
Write-Host "`n--- Gift ---" -ForegroundColor Yellow
t GET "/api/gift/list" $null $null 200 "Gift List"
t GET "/api/gift/bag" $null $t1 200 "Gift Bag"
t POST "/api/gift/send" @{giftId=1;targetUserId=$id2;count=1} $t1 @(200,201,400) "Send Gift"

# ============ 7. Reserve (correct params) ============
Write-Host "`n--- Reserve ---" -ForegroundColor Yellow
$today = (Get-Date).ToString("yyyy-MM-dd")
$ts = (Get-Date).AddHours(1).ToString("HH:mm:ss")
$ts2 = (Get-Date).AddHours(4).ToString("HH:mm:ss")
$rnd = Get-Random -Minimum 1000 -Maximum 9999

# batch slots: API expects {slots:[{date, time}]}
$sr = t POST "/api/reserve/slots/batch" @{slots=@(@{date=$today;time=$ts})} $t2 @(200,201) "Create Slots"
# create reserve: API expects {companionId, gameId, date, time}
t POST "/api/reserve/create" @{companionId=$id2;gameId=0;date=$today;time=$ts} $t1 @(200,201) "Create Reservation"
t GET "/api/reserve/list?page=1&pageSize=10" $null $t1 200 "Reserve List"

# ============ 8. Demand (correct params) ============
Write-Host "`n--- Demand ---" -ForegroundColor Yellow
# API expects: {serviceType, game, date, startTime, endTime, duration, budget}
$dr = t POST "/api/demand/create" @{serviceType="online";game="Honor of Kings";date=$today;startTime=$ts2;endTime=(Get-Date).AddHours(6).ToString("HH:mm:ss");duration=2;budget=50;remark="Need carry"} $t1 @(200,201) "Create Demand"
$did = ""; if ($dr.ok) { try { $dd = $dr.data | ConvertFrom-Json; $did = $dd.data.demandId; if (!$did) { $did = $dd.data.id } } catch {} }
t GET "/api/demand/list?page=1&pageSize=10" $null $t1 200 "Demand List"
if ($did) { t GET "/api/demand/detail?demandId=$did" $null $t1 200 "Demand Detail" }

# ============ 9. Pay ============
Write-Host "`n--- Pay ---" -ForegroundColor Yellow
t GET "/api/pay/packages" $null $null 200 "Packages"
t POST "/api/pay/create-order" @{packageId=1;payType="alipay"} $t1 @(200,201) "Create Order"
t GET "/api/pay/wallet/balance" $null $t1 200 "Balance"

# ============ 10. VIP ============
Write-Host "`n--- VIP ---" -ForegroundColor Yellow
t GET "/api/vip/packages" $null $null 200 "VIP Packages"
t GET "/api/vip/info" $null $t1 200 "VIP Info"
t POST "/api/vip/order" @{packageId=1;payType="alipay"} $t1 @(200,201) "VIP Order"

# ============ 11. Public APIs ============
Write-Host "`n--- Public APIs ---" -ForegroundColor Yellow
t GET "/api/search/hot" $null $null 200 "Hot Words"
t GET "/api/region/provinces" $null $null 200 "Provinces"
t GET "/api/notice/list" $null $null 200 "Notices"
t GET "/api/games/categories" $null $null 200 "Game Categories"
t GET "/api/config/home" $null $null 200 "Home Config"
t GET "/api/circle/tags" $null $null 200 "Circle Tags"

# ============ 12. Tags ============
Write-Host "`n--- Tags ---" -ForegroundColor Yellow
$tr = t POST "/api/tag/" @{name="ProGamer$rnd";code="progamer$rnd";category="skill";color="#FF6B6B"} $t1 @(200,201) "Create Tag"
$tid = ""; if ($tr.ok) { try { $dd = $tr.data | ConvertFrom-Json; $tid = $dd.data.id } catch {} }
t GET "/api/tag/" $null $t1 200 "All Tags"
t GET "/api/tag/recommend" $null $t1 200 "Recommend Tags"
if ($tid) { t POST "/api/tag/assign" @{virtualUserId=$id1;tagId=$tid} $t1 @(200,201,400,422) "Assign Tag" }

# ============ 13. Card (correct params) ============
Write-Host "`n--- Card ---" -ForegroundColor Yellow
# API expects: {faceValue, coinAmount, count}
$cr = t POST "/api/admin/cards" @{faceValue=100;coinAmount=100;count=1;remark="Test"} $at @(200,201) "Create Card"
$cno = ""; if ($cr.ok) { try { $dd = $cr.data | ConvertFrom-Json; $cnol = $dd.data.list; if ($cnol) { $cno = $cnol[0].cardNo } } catch {} }
if ($cno) { t POST "/api/pay/validate-card" @{cardCode=$cno} $null @(200,201) "Validate Card" }
if ($cno) { t POST "/api/pay/use-card" @{cardCode=$cno} $t1 @(200,201) "Use Card" }

# ============ 14. Admin ============
Write-Host "`n--- Admin ---" -ForegroundColor Yellow
t GET "/api/admin/dashboard" $null $at 200 "Dashboard"
t GET "/api/admin/banners" $null $at 200 "Banners"
t GET "/api/admin/cards" $null $at 200 "Cards List"
t GET "/api/admin/vip-packages" $null $at 200 "VIP Mgmt"
t GET "/api/admin/gifts" $null $at 200 "Gifts Mgmt"
t GET "/api/admin/settings" $null $at 200 "Settings"
t GET "/api/admin/games" $null $at 200 "Games"
t GET "/api/admin-manage/roles" $null $at 200 "Roles"
t GET "/api/admin-manage/permissions" $null $at 200 "Permissions"
t GET "/api/admin/withdraws?page=1&pageSize=10" $null $at 200 "Withdraws"
t GET "/api/admin/posts?page=1&pageSize=10" $null $at 200 "Posts"
t GET "/api/admin/reports?page=1&pageSize=10" $null $at 200 "Reports"
t GET "/api/admin/recharges?page=1&pageSize=10" $null $at 200 "Recharges"
t GET "/api/admin/users?page=1&pageSize=10" $null $at 200 "Users"
t GET "/api/admin/orders?page=1&pageSize=10" $null $at 200 "Orders"

# ============ Summary ============
Write-Host ""
$total = $pass + $fail
$rate = if ($total -gt 0) { [math]::Round($pass/$total*100,1) } else { 0 }
Write-Host "========================================" -ForegroundColor Cyan
if ($rate -eq 100) {
  Write-Host "  FINAL: Total=$total  Pass=$pass  Fail=$fail  Rate=${rate}%  ALL PASSED!" -ForegroundColor Green
} else {
  Write-Host "  FINAL: Total=$total  Pass=$pass  Fail=$fail  Rate=${rate}%" -ForegroundColor Cyan
}
Write-Host "========================================" -ForegroundColor Cyan
