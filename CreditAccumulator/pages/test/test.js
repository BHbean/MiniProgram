// pages/test/test.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nickName: '',
    avatarUrl: '',
    hasLogin: false,
    numBird: [0, 1, 2, 3, 4, 5 ,6]
  },

  login: function () {
    wx.getUserProfile({
        desc: '请授权以继续'
      })
      .then(res => {
        console.log('success', res.userInfo);
        wx.setStorageSync('user', res.userInfo);
        this.setData({
          nickName: res.userInfo.nickName,
          avatarUrl: res.userInfo.avatarUrl,
          hasLogin: true
        });
      })
      .catch(err => {
        console.log('fail', err);
      });
  },

  logOut: function () {
    this.setData({
      hasLogin: false
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})