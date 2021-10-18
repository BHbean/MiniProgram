// pages/detail/detail.js
//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    customBarTitle: '详细信息',
    info: null,
    btnBlock: false,
    btnLoading: false,
    btnColor: null,
    btnText: null,
    article: {},
    loadProgress: 0, // 加载进度条
    allowPoint: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadProgress(80, 25);
    wx.cloud.database().collection('camps').doc(options.id).get()
      .then(res => {
        console.log('详细信息数据请求成功！', res);
        let data = res.data;
        // data.content = data.content.replace(/\\n/g, '\n');
        data.deadline = this.toSimpleDateString(data.deadline);
        this.setData({
          info: data,
          btnColor: data.state ? 'grey' : 'green',
          btnText: data.state ? '已报名' : '未报名'
        });

        // 解析 Markdown 文本并显示
        app.getText(data.content, res => {
          let obj = app.towxml(res.data, 'markdown', {
          });

          this.setData({
            article: obj,
            isLoading: false
          });
        });

        this.loadProgress(100, 10);

      })
      .catch(err => {
        console.log('详细信息数据请求失败！', err);
        wx.showToast({
          title: '信息获取失败！',
          icon: 'error'
        });
        this.setData({
          loadProgress: 0,
          allowPoint: false,
          transparent: true
        });
      })
  },

  // 截止日期的格式转换函数
  toSimpleDateString: function (dateFromDb) {
    let date = new Date(dateFromDb);
    let ret = '';
    ret += date.getFullYear() + '年'; // 年
    ret += (date.getMonth() + 1) + '月'; // 月
    ret += date.getDate() + '日 '; // 日
    ret += (date.getHours() > 9 ? '' : '0') + date.getHours() + ':'; // 小时
    ret += (date.getMinutes() > 9 ? '' : '0') + date.getMinutes(); // 分钟

    return ret;
  },

  // 报名按钮的点击事件
  signUp: function (e) {
    this.setData({
      btnBlock: true,
      btnLoading: true
    });

    wx.cloud.database().collection('camps')
      .doc(this.data.info._id)
      .update({
        data: {
          state: !this.data.info.state
        }
      })
      .then(res => {
        console.log('状态改变成功！');
        this.data.info.state = !this.data.info.state;
        this.setData({
          btnBlock: false,
          btnLoading: false,
          btnColor: this.data.info.state ? 'grey' : 'green',
          btnText: this.data.info.state ? '已报名' : '未报名'
        });
      })
  },

  loadProgress(threshold, timer) {
    this.setData({
      loadProgress: this.data.loadProgress + 3
    });
    if (this.data.loadProgress < threshold) {
      setTimeout(() => {
        this.loadProgress(threshold, timer)
      }, timer);
    } else {
      if (this.data.loadProgress >= 100) {
        this.setData({
          loadProgress: 0,
          allowPoint: true
        });
      }
    }
  },

  // 长按复制
  longPressCopyUrl: function (e) {
    wx.setClipboardData({
      data: this.data.info.url,
    });
  },

  longPressCopyArticleUrl: function (e) {
    wx.setClipboardData({
      data: this.data.info.article_url,
    });
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