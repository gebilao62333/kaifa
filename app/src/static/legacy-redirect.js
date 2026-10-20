(function () {
  var path = location.pathname || '/'
  if (path.indexOf('/pages/') === 0) return
  var exact = {"/login":"/pages/Login","/home":"/pages/Home","/search":"/pages/Search","/square":"/pages/Square","/preferred":"/pages/Preferred","/mine":"/pages/Mine","/friend":"/pages/ChatUsers","/companion-apply":"/pages/CompanionApply","/companion-list":"/pages/CompanionList","/publish-post":"/pages/PublishPost","/publish-demand":"/pages/PublishDemand","/recharge":"/pages/Recharge","/vip-center":"/pages/VipCenter","/game-index":"/pages/GameIndex","/paidan":"/pages/Paidan","/my-services":"/pages/MyServices","/wallet":"/pages/Wallet","/card-recharge":"/pages/CardRecharge","/my-order":"/pages/MyOrder","/my-dynamic":"/pages/MyDynamic","/income-records":"/pages/IncomeRecords","/expense-records":"/pages/ExpenseRecords","/withdraw-records":"/pages/WithdrawRecords","/withdraw":"/pages/Withdraw","/payment-gateway":"/pages/PaymentGateway","/likes-records":"/pages/LikesRecords","/visitors-records":"/pages/VisitedRecords","/edit-profile":"/pages/EditProfile","/settings":"/pages/Settings","/my-album":"/pages/MyAlbum","/my-reserve":"/pages/MyReserve","/my-reports":"/pages/MyReports","/real-name":"/pages/RealName","/feedback":"/pages/Feedback","/about-us":"/pages/AboutUs","/follows":"/pages/Follows","/fans":"/pages/Fans","/customer-service":"/pages/CustomerService","/level-acceleration":"/pages/LevelAcceleration","/identity-badge":"/pages/IdentityBadge","/avatar-frame":"/pages/AvatarFrame","/stealth-visit":"/pages/StealthVisit","/priority-matching":"/pages/PriorityMatching","/skin-shop":"/pages/SkinShop","/ai-chat":"/pages/VirtualUserList","/tag-manager":"/pages/TagManager","/records-center":"/pages/RecordsCenter"};
  var dyn = [{"re":"/post-detail/([^/]+)","page":"/pages/PostDetail","keys":["id"]},{"re":"/chat-room/([^/]+)","page":"/pages/ChatRoom","keys":["id"]},{"re":"/user/([^/]+)","page":"/pages/UserProfile","keys":["id"]},{"re":"/call/([^/]+)/video","page":"/pages/VideoCall","keys":["id"]},{"re":"/call/([^/]+)/audio","page":"/pages/AudioCall","keys":["id"]},{"re":"/ai-chat/([^/]+)","page":"/pages/AIChat","keys":["id"]}];
  var target = path === '/' ? '/pages/Home' : exact[path]
  if (!target) {
    for (var i = 0; i < dyn.length; i++) {
      var match = path.match(new RegExp('^' + dyn[i].re + '/?$'))
      if (match) {
        var qs = []
        for (var k = 0; k < dyn[i].keys.length; k++) qs.push(dyn[i].keys[k] + '=' + encodeURIComponent(match[k + 1]))
        target = dyn[i].page + (qs.length ? '?' + qs.join('&') : '')
        break
      }
    }
  }
  if (target) {
    var sep = target.indexOf('?') >= 0 ? '&' : '?'
    var extra = location.search ? sep + location.search.slice(1) : ''
    history.replaceState(null, '', target + extra + location.hash)
  }
})()
