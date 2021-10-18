// pages/schedule/schedule.js
const app = getApp();

Component({
  data: {
    customBarTitle: "个人规划",
    colorList: [
      'red',
      'orange',
      'yellow',
      'olive',
      'green',
      'cyan',
      'blue',
      'purple',
      'mauve',
      'pink',
      'brown'
    ],
    camps: [],
    campsForTimeline: [],
    showModal: false,
    startDate: '',
    endDate: '',
    curCollege: null,
    curIdx: -1,
    inCamp: false,
    weight: null,
  },

  methods: {
    getAppliedCampList: function () {
      // 获取所有信息列表
      wx.cloud.callFunction({
          name: 'getData',
          data: {
            order: 'deadline', // 之后修改成动态变量以便调节
            condition: {
              state: true
            }
          }
        })
        .then(res => {
          this.setData({
            camps: res.result.data
          });
        })
        .catch(err => {
          console.log('数据库请求失败', err);
          wx.showToast({
            title: '数据获取失败！',
            icon: 'error'
          });
        })
    },

    showModal: function (e) {
      let idx = e.currentTarget.dataset.idx;
      let camps = this.data.camps;
      let _in = typeof(camps[idx].qualified) == "boolean" && camps[idx].qualified;

      this.setData({
        showModal: true,
        curCollege: e.currentTarget.dataset.id,
        curIdx: idx,
        startDate: camps[idx].qualified? camps[idx].start_date: '',
        endDate: camps[idx].qualified? camps[idx].end_date: '',
        weight: camps[idx].qualified? camps[idx].weight: null,
        inCamp: _in,
      });
    },

    updateQualified: function (e) {
      let data = this.data;

      wx.cloud.callFunction({
        name: 'updateDataset',
        data: {
          id: data.curCollege,
          update: {
            qualified: !data.inCamp
          }
        }
      })
      .then(res => {
        data.camps[data.curIdx].qualified = !data.camps[data.curIdx].qualified;
        this.hideModal();
        this.computeWeightedInterval();
      })
    },

    hideModal: function () {
      this.setData({
        showModal: false,
        curCollege: null,
        curIdx: -1,
        inCamp:false,
        weight: null,
        startDate: '',
        endDate: ''
      });
    },

    modifyInfomation: function () {
      if (this.data.curCollege != null && this.data.startDate != '' &&
        this.data.endDate != '' && this.data.weight != null) {
        wx.cloud.callFunction({
            name: 'updateDataset',
            data: {
              id: this.data.curCollege,
              update: {
                start_date: this.data.startDate,
                end_date: this.data.endDate,
                weight: this.data.weight,
                qualified: true,
              }
            }
          })
          .then(res => {
            console.log('数据库更新成功！', res);
            // 计算加权调度问题的解
            this.computeWeightedInterval();

            // 在用户填写完信息后去掉 badge
            let modifyIdx='camps['+this.data.curIdx+'].qualified';
            this.setData({
              [modifyIdx]: true
            });
            this.hideModal();
          })
          .catch(err => {
            console.log('数据库更新失败！', err);
            wx.showToast({
              title: '保存失败！',
              icon: 'error'
            });
          });
        this.setData({
          showModal: false
        });
      } else {
        wx.showToast({
          title: '请将信息填写完整！',
          icon: 'none'
        })
      }
    },

    bindStartDateChange: function (e) {
      let startDate = new Date(e.detail.value);
      if (this.data.endDate != '') {
        let endDate = new Date(this.data.endDate);
        if (endDate - startDate < 0) {
          wx.showToast({
            title: '开始时间不得晚于结束时间',
            icon: 'none'
          });
        } else {
          this.setData({
            startDate: e.detail.value
          });
        }
      } else {
        this.setData({
          startDate: e.detail.value
        });
      }
    },

    bindEndDateChange: function (e) {
      let endDate = new Date(e.detail.value);
      if (this.data.startDate != '') {
        let startDate = new Date(this.data.startDate);
        if (endDate - startDate < 0) {
          wx.showToast({
            title: '结束时间不得早于开始时间',
            icon: 'none'
          });
        } else {
          this.setData({
            endDate: e.detail.value
          });
        }
      } else {
        this.setData({
          endDate: e.detail.value
        });
      }
    },

    bindWeightChange: function (e) {
      console.log(e.detail.value);
      this.setData({
        weight: e.detail.value
      });
    },

    computeWeightedInterval: function () {
      // 将数据库中所有选择清空
      wx.cloud.callFunction({
          name: 'updateDataset',
          data: {
            condition: {
              qualified: true
            },
            update: {
              selected: false
            }
          }
        })
        .then(res => {
          console.log('数据库清空选择成功！');
          // 获取通过申请的院校列表
          wx.cloud.callFunction({
              name: 'getData',
              data: {
                order: 'end_date', // 之后修改成动态变量以便调节
                condition: {
                  qualified: true,
                }
              }
            })
            .then(res => {
              console.log('获取通过申请的院校列表成功！');
              wx.cloud.callFunction({
                  name: 'weightedIntervalScheduling',
                  data: {
                    colleges: res.result.data
                  }
                })
                .then(res => {
                  console.log('加权区间调度算法运行成功！');
                  this.getCampsForTimeline();
                });
            })
            .catch(err => {
              console.log('获取通过申请的院校列表失败！');
            });
        })
        .catch(err => {
          console.log('数据库清空选择失败！');
        });

    },

    getCampsForTimeline: function () {
      // 获取所有信息列表
      wx.cloud.callFunction({
          name: 'getData',
          data: {
            order: 'end_date', // 之后修改成动态变量以便调节
            condition: {
              qualified: true,
              selected: true,
            }
          }
        })
        .then(res => {
          let data = res.result.data;
          console.log('调用 getCampsForTimeline()', data);
          for (let i = 0; i < data.length; i++) {
            if (data[i].weight) {
              data[i].start_date = data[i].start_date.substring(5);
              data[i].end_date = data[i].end_date.substring(5);
            }
          }

          this.setData({
            campsForTimeline: data
          });
        })
        .catch(err => {
          console.log('数据库请求失败', err);
          wx.showToast({
            title: '数据获取失败！',
            icon: 'error'
          });
        });

    },

  },

  lifetimes: {

    attached: function () {
      console.log('attached 生命周期！');
      this.getAppliedCampList();
      this.getCampsForTimeline();
    },

    detached: function () {
      this.computeWeightedInterval();
    }
  },

  pageLifetimes: {
    show: function () {
      console.log('show 生命周期！');
      this.getAppliedCampList();
      this.getCampsForTimeline();
    }
  },
})