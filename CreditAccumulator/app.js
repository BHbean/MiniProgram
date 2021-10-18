//app.js
App({
  onLaunch: function () {
    console.log('app.js running!');
    // wx.showLoading({
    //   title: '获取登录信息中...',
    //   mask: true
    // });

    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'credits-controller-6dezu832737ac', // 云开发环境 id
        traceUser: true,
      });
    }

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

  onShow: function () {

  },

  getOpenid: async function (key) {
    let res = await wx.cloud.callFunction({
      name: 'login'
    });
    wx.setStorageSync('openid', res.result.openid);
    this.globalData.openid = res.result.openid;
    wx.setStorageSync('userInfo', res.result.queryResult.data[0]);
    this.globalData.userInfo = res.result.queryResult.data[0];
    switch (key) {
      case 'openid':
        return res.result.openid;
      case 'userInfo':
        return res.result.queryResult.data[0];
    }
  },

  getUserInfo: async function () {
    const db = wx.cloud.database();

    let res = await wx.getUserProfile({
      desc: '请授权以继续使用小程序相关功能',
    });

    console.log('用户授权成功!', res.userInfo);
    let userInfo = res.userInfo;
    userInfo.openid = this.globalData.openid || await this.getOpenid('openid');
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
    this.globalData.hasUserInfo = true;

    let result = await db.collection('users').where({
      openid: this.globalData.openid
    }).get();
    if (result.data.length > 0) {
      wx.showToast({
        title: '用户已授权！',
      });
    } else {

      // 将用户数据存入数据库
      wx.cloud.callFunction({
          name: 'addEntry',
          data: {
            collection: 'users',
            object: userInfo
          }
        })
        .then(res => {
          console.log('新用户添加成功！', res);
        })
        .catch(err => {
          console.log('新用户添加失败！', err);
        })
    }
  },

  globalData: {
    userInfo: '',
    // openid: 'oegrU4uPldAY7wvbN0Uik-eQ0zrw',
    openid: null,
    hasUserInfo: false,
  }
})