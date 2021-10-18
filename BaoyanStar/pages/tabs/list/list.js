//index.js
//获取应用实例
const app = getApp()

Component({
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    customBarTitle: '信息列表',
    orderMethod: '截止时间',
    infoList: [],
    loadProgress: 0, // 加载进度条
    allowPoint: false,
    transparent: true
  },

  methods: {

    //事件处理函数
    bindViewTap: function () {
      wx.navigateTo({
        url: '../logs/logs'
      })
    },

    getUserInfo: function (e) {
      console.log(e)
      app.globalData.userInfo = e.detail.userInfo
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
    },

    getInfoList: function () {
      // 设置透明遮罩层
      this.setData({
        transparent: true
      });
      this.loadProgress(80, 25);

      wx.cloud.callFunction({
          name: 'getData',
          data: {
            order: 'deadline' // 之后修改成动态变量以便调节
          }
        })
        .then(res => {
          console.log('数据库请求成功', res.result.data);
          console.log('列表长度', res.result.data.length);
          this.setData({
            infoList: this.prettifyList(res.result.data)
          });
          this.loadProgress(100, 10);
          // console.log(this.data.infoList);
        })
        .catch(err => {
          console.log('数据库请求失败', err);
          this.setData({
            loadProgress: 0,
            allowPoint: false,
            transparent: true
          });
          wx.showToast({
            title: '数据获取失败！',
            icon: 'error'
          });
        });
    },

    // 对数据库获得的数据做进一步处理
    prettifyList: function (list) {
      let len = list.length;

      for (let i = 0; i < len; i++) {
        // 将 date 类型的对象转化为字符串
        let date = new Date(list[i].deadline);
        // 计算显示颜色
        let curDate = new Date();
        let diff = date - curDate;
        if (diff <= 0 || list[i].state) { // 截止报名时间已过或已完成报名
          let ele = { // 复制元素
            _id: list[i]._id,
            article_url: list[i].article_url,
            college: list[i].college,
            content: list[i].content,
            deadline: null,
            logo: list[i].logo,
            state: list[i].state,
            title: list[i].title,
            url: list[i].url,
            textColor: 'grey',
            icon: list[i].state ? 'roundcheck' : 'roundclose',
            iconColor: list[i].state ? 'green' : 'red'
          };
          // 将截止报名时间已过的院所加到数组末尾
          list.push(ele);
          // 在数组中删除该元素
          delete list[i];
        } else if (diff <= 86400000) { // 剩余 1 天显示红色
          list[i].deadline = this.toDeadlineStr(list[i].deadline);
          list[i].textColor = 'red';
        } else if (diff <= 259200000) { // 剩余 3 天显示黄色
          list[i].deadline = this.toDeadlineStr(list[i].deadline);
          list[i].textColor = 'yellow'
        } else { // 否则显示黑色
          list[i].deadline = this.toDeadlineStr(list[i].deadline);
          list[i].textColor = 'black';
        }
      }


      return list;
    },

    // 转换截止时间字符串
    toDeadlineStr: function (ddl) {
      let date = new Date(ddl);
      return (date.getMonth() + 1) + '.' + date.getDate() + ' ' +
        (date.getHours() > 9 ? '' : '0') + date.getHours() + ':' +
        (date.getMinutes() > 9 ? '' : '0') + date.getMinutes();
    },

    // 跳转到详情页
    goDetail: function (e) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id
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
            allowPoint: true,
            transparent: false
          });
        }
      }
    }
  },

  lifetimes: {
    attached: function () {
      this.getInfoList();
    }
  },
  
  pageLifetimes: {
    show: function () {
      this.getInfoList();
    }
  },
})

// Page({
//   data: {
//     StatusBar: app.globalData.StatusBar,
//     CustomBar: app.globalData.CustomBar,
//     customBarTitle: '信息列表',
//     orderMethod: '截止时间',
//     infoList: [],
//     loadProgress: 0, // 加载进度条
//     allowPoint: false,
//     transparent: true
//   },
//   //事件处理函数
//   bindViewTap: function () {
//     wx.navigateTo({
//       url: '../logs/logs'
//     })
//   },
//   onLoad: function () {
//     // this.getInfoList();
//   },
//   onShow: function () {
//     this.getInfoList();
//   },
//   getUserInfo: function (e) {
//     console.log(e)
//     app.globalData.userInfo = e.detail.userInfo
//     this.setData({
//       userInfo: e.detail.userInfo,
//       hasUserInfo: true
//     })
//   },
//   getInfoList: function () {
//     // 设置透明遮罩层
//     this.setData({
//       transparent: true
//     });
//     this.loadProgress(80, 25);

//     wx.cloud.callFunction({
//         name: 'getData',
//         data: {
//           order: 'deadline' // 之后修改成动态变量以便调节
//         }
//       })
//       .then(res => {
//         console.log('数据库请求成功', res.result.data);
//         console.log('列表长度', res.result.data.length);
//         this.setData({
//           infoList: this.prettifyList(res.result.data)
//         });
//         this.loadProgress(100, 10);
//         // console.log(this.data.infoList);
//       })
//       .catch(err => {
//         console.log('数据库请求失败', err);
//         this.setData({
//           loadProgress: 0,
//           allowPoint: false,
//           transparent: true
//         });
//         wx.showToast({
//           title: '数据获取失败！',
//           icon: 'error'
//         });
//       });
//   },
//   // 对数据库获得的数据做进一步处理
//   prettifyList: function (list) {
//     let len = list.length;

//     for (let i = 0; i < len; i++) {
//       // 将 date 类型的对象转化为字符串
//       let date = new Date(list[i].deadline);
//       // 计算显示颜色
//       let curDate = new Date();
//       let diff = date - curDate;
//       if (diff <= 0 || list[i].state) { // 截止报名时间已过或已完成报名
//         let ele = { // 复制元素
//           _id: list[i]._id,
//           article_url: list[i].article_url,
//           college: list[i].college,
//           content: list[i].content,
//           deadline: null,
//           logo: list[i].logo,
//           state: list[i].state,
//           title: list[i].title,
//           url: list[i].url,
//           textColor: 'grey',
//           icon: list[i].state ? 'roundcheck' : 'roundclose',
//           iconColor: list[i].state ? 'green' : 'red'
//         };
//         // 将截止报名时间已过的院所加到数组末尾
//         list.push(ele);
//         // 在数组中删除该元素
//         delete list[i];
//       } else if (diff <= 86400000) { // 剩余 1 天显示红色
//         list[i].deadline = this.toDeadlineStr(list[i].deadline);
//         list[i].textColor = 'red';
//       } else if (diff <= 259200000) { // 剩余 3 天显示黄色
//         list[i].deadline = this.toDeadlineStr(list[i].deadline);
//         list[i].textColor = 'yellow'
//       } else { // 否则显示黑色
//         list[i].deadline = this.toDeadlineStr(list[i].deadline);
//         list[i].textColor = 'black';
//       }
//     }


//     return list;
//   },
//   // 转换截止时间字符串
//   toDeadlineStr: function (ddl) {
//     let date = new Date(ddl);
//     return (date.getMonth() + 1) + '.' + date.getDate() + ' ' +
//       (date.getHours() > 9 ? '' : '0') + date.getHours() + ':' +
//       (date.getMinutes() > 9 ? '' : '0') + date.getMinutes();
//   },
//   // 跳转到详情页
//   goDetail: function (e) {
//     wx.navigateTo({
//       url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id
//     })
//   },
//   loadProgress(threshold, timer) {
//     this.setData({
//       loadProgress: this.data.loadProgress + 3
//     });
//     if (this.data.loadProgress < threshold) {
//       setTimeout(() => {
//         this.loadProgress(threshold, timer)
//       }, timer);
//     } else {
//       if (this.data.loadProgress >= 100) {
//         this.setData({
//           loadProgress: 0,
//           allowPoint: true,
//           transparent: false
//         });
//       }
//     }
//   }
// })