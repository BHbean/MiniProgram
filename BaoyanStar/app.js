//app.js

App({
  // 引入`towxml3.0`解析方法
  towxml: require('/towxml/index'),

  //声明一个数据请求方法
  getText: (url, callback) => {
    wx.request({
      url: url,
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: (res) => {
        if (typeof callback === 'function') {
          callback(res);
        };
      }
    });
  },

  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        env: 'xiang-camps-2g3taqxv5b7540d0', // 云开发环境 id
        traceUser: true,
      });
      // wx.cloud.init({
      //   env: 'cloud3-9g57c2c1a4df118e' // 云开发环境 id
      // });
    }
    wx.cloud.callFunction({
      name: "login",
    }).then(res => {
      this.globalData.openid = res.result.openid
      if (res.result.openid == 'oAUMu4-3QxJ973ggQ9XdJr6ttqeE' ||
        res.result.openid == 'oAUMu40_iAbH4mhVbxtEgU8JvCPQ') {
        wx.redirectTo({
          url: '/pages/index/index',
        });
      }
      console.log(res.result)
    }).catch(err => {
      console.log(err)
    });

    // this.computeWeightedInterval();

    // 获取系统状态栏信息
    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight;
        let capsule = wx.getMenuButtonBoundingClientRect();
        if (capsule) {
          this.globalData.Custom = capsule;
          this.globalData.CustomBar = capsule.bottom + capsule.top - e.statusBarHeight;
        } else {
          this.globalData.CustomBar = e.statusBarHeight + 50;
        }
      }
    })
  },
  globalData: {
    userInfo: null,
    openid: "",
    haslogin: true, // 只登录一次
  },
})