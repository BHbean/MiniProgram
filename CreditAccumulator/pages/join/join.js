const db = wx.cloud.database();
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputLen: 4,
    iptValue: "",
    isFocus: false,
    loadModal: false
  },

  /*
  他人代码思路：
    1.页面+样式准备
　　  设置验证码输入框样式，设置disabled 使其不可输入。
　　  另外设置一个输入框隐藏其样式，使其不可见。
　　  设置隐藏输入框的最大长度。
    2.点击验证码输入框，使隐藏输入框为聚焦状态
    3.使用bindinput事件 监听输入状态 获取value。
    4.将value赋值到验证码输入框中
  */
  onFocus: function (e) {
    var that = this;
    that.setData({
      isFocus: true
    });
  },

  setValue: function (e) {
    var that = this;
    that.setData({
      iptValue: e.detail.value
    });
  },

  moveFocus: function (e) {
    let num = e.detail.value;
    this.setData({
      value: this.data.value + num
    });
  },

  enterRoom: function () {
    let roomId = this.data.iptValue;
    if (roomId.length != this.data.inputLen) {
      wx.showToast({
        title: '请将房间号填写完整哟~',
        icon: 'none'
      });
    } else {
      // 展示模态框
      this.setData({
        loadModal: true
      });
      // 查询并进入房间
      db.collection('available_rooms').doc(roomId).get()
        .then(res => {
          if (res.data.empty) {
            wx.showToast({
              title: '您要进入的房间不存在哟~',
              icon: 'none'
            });
            this.setData({
              loadModal: false
            });
          } else {
            wx.cloud.callFunction({
                name: 'enterRoom',
                data: {
                  userInfo: app.globalData.userInfo,
                  roomId: roomId
                }
              })
              .then(res => {
                console.log('加入房间成功！', res);
                wx.navigateTo({
                  url: '/pages/room/room?id=' + roomId + '&openid=' + app.globalData.openid,
                });
                this.setData({
                  loadModal: false
                });
              })
              .catch(err => {
                console.log('加入房间失败！', err);
                this.setData({
                  loadModal: false
                });
              });
          }
        })
        .catch(err => {
          console.log('加入房间失败！', err);
        })
    }
  },

  goBack: function () {
    wx.navigateBack({
      delta: 1,
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