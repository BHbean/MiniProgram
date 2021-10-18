//index.js
//获取应用实例
const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    userInfo: {
      avatarUrl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',
      nickName: '微信用户'
    },
    hasUserInfo: false
  },

  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onLoad: async function () {
    // 登录（同时会检查数据库中是否存在该用户的 openid，即其是否已注册）
    let openid = wx.getStorageSync('openid') || await app.getOpenid('openid');
    let userInfo = wx.getStorageSync('userInfo') || await app.getOpenid('userInfo');

    app.globalData.openid = openid;
    console.log('app.globalData.openid', app.globalData.openid);

    if (userInfo) {
      app.globalData.userInfo = userInfo;
      console.log('app.globalData.userInfo', app.globalData.userInfo);
      app.globalData.hasUserInfo = true;
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    }

  },

  getUserInfo: async function (e) {
    try {
      await app.getUserInfo();

      this.setData({
        hasUserInfo: app.globalData.hasUserInfo,
        userInfo: app.globalData.userInfo
      });
    } catch (err) {
      wx.showToast({
        title: '用户拒绝授权！',
        icon: 'error',
        mask: true
      });
    }
  },

  // 创建房间
  createRoom: async function () {
    if (!app.globalData.hasUserInfo) {
      this.getUserInfo();
    } else {
      if (await this.detectUserInRoom()) return;

      wx.showLoading({
        title: '创建房间中...',
        mask: true
      });
      console.log('创建房间中！');
      wx.cloud.callFunction({
          name: 'queryEmptyRoom',
          data: {
            userInfo: app.globalData.userInfo
          }
        })
        .then(res => {
          let roomId = res.result;
          if (roomId == -1) {
            wx.showToast({
              title: '目前暂无空余房间，请等待一段时间后使用~',
            });
          } else {
            wx.navigateTo({
              url: '/pages/room/room?id=' + roomId + '&openid=' + app.globalData.openid,
            });
          }
          wx.hideLoading();
        })
        .catch(err => {
          console.log(err);
          wx.showToast({
            title: '数据库访问失败',
            icon: 'error'
          });
          wx.hideLoading();
        });
    }
  },

  // 加入房间
  joinRoom: async function () {
    if (!app.globalData.hasUserInfo) {
      this.getUserInfo();
    } else {
      if (await this.detectUserInRoom()) { return; }

      console.log('加入房间中！');
      wx.navigateTo({
        url: '/pages/join/join',
      })
    }
  },

  // 检测玩家是否存在于其他房间中
  detectUserInRoom: async function() {
    try {
      let res = await db.collection('mahjong_room').where({
        openid: app.globalData.openid
      }).get();
      
      if (res.data.length > 0) {
        wx.showToast({
          title: '您正在其他房间中，请退出后再进行操作！',
          icon: 'none'
        });
        return true;
      }
    } catch (error) {
      wx.showToast({
        title: '数据库访问出错',
        icon: 'error'
      });
    }

    return false;
  },

  // 帮助用户退出已进入的房间
  quitRoom: async function () {
    if (!app.globalData.hasUserInfo) {
      this.getUserInfo();
    } else {
      wx.showLoading({
        title: '退出房间中...',
        mask: true
      });

      wx.cloud.callFunction({
        name: 'leaveRoom',
        data: {
          openid: app.globalData.openid
        }
      })
      .then(res => {
        wx.hideLoading({
          success: (res) => {
            wx.showToast({
              title: '退出房间成功！',
            });
          },
        })
      })
      .catch(err => {
        console.log(err);
        wx.hideLoading({
          success: (res) => {
            wx.showToast({
              title: '云函数调用失败',
              icon: 'error'
            });
          },
        })
      })
    }
  }
})