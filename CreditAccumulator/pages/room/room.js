const app = new getApp();
const db = wx.cloud.database();
const _ = db.command;
const MAHJONG_NUM = 4;


const TYPE_DICT = {
  0: '自摸',
  1: '点炮',
  2: '自摸杠',
  3: '碰后杠',
  4: '普通杠'
};

Page({

  /**
   * 页面的初始数据
   */
  data: {
    roomId: '',
    userList: [],
    players: [],
    waiters: [],
    others: [], // 除自己外的所有玩家
    myInfo: null,
    hasUserInfo: true,
    openid: '',
    invitationImage: 'https://6372-credits-controller-6dezu832737ac-1305327447.tcb.qcloud.la/images/icon/add.png',
    // openid: 'oegrU4uPldAY7wvbN0Uik-eQ0zrw',
    // 按钮状态
    readyBtnLoading: false,
    readyBtnText: '',
    // 透明 mask 层
    transparent: false,
    isPlaying: false,
    birdNumList: [0, 1, 2, 3, 4, 5, 6],
    // 存储“胡”时的各项信息
    isOwnDraw: true,
    birdNum: 0,
    // shooter: null, // 放炮者 or 被杠者
    shooterIdx: 0, // 放炮者 or 被杠者下标
    // 存储“杠”时的各项信息
    isSelfGang: true, // 是否为自摸杠
    isAfterPeng: false, // 是否为碰后杠
    // 存储历史对局信息
    historyList: [],
    // 记录的类型与数字的对应关系
    TYPE_DICT: {
      0: '自摸',
      1: '点炮',
      2: '自摸杠',
      3: '碰后杠',
      4: '普通杠'
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this.setData({
      transparent: true
    });

    console.log('options:', options);
    let roomId = options.id;
    this.setData({
      roomId: roomId,
      openid: app.globalData.openid || wx.getStorageSync('openid') || await app.getOpenid('openid'),
    });

    // 如果是通过邀请进入房间且数据库中没有该用户的信息
    let userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || await app.getOpenid('userInfo');
    if (options.invited && !userInfo) {
      this.setData({
        hasUserInfo: false,
        transparent: false
      });
    } else {
      this.setWatchers();
      this.setData({
        transparent: false
      });
    }

  },

  setWatchers: function () {
    // 开启实时数据监听器
    const that = this
    const allWatcher = db.collection('mahjong_room').where({
        roomId: this.data.roomId
      })
      .watch({
        onChange: function (snapshot) {
          let players = snapshot.docs;
          console.log('users after the event: ', players)
          that.setData({
            userList: snapshot.docs
          });
        },
        onError: function (err) {
          console.error('监听因错误停止', err)
        }
      });

    const playersWatcher = db.collection('mahjong_room')
      .where({
        roomId: this.data.roomId,
        onTable: true
      })
      .watch({
        onChange: function (snapshot) {
          let players = snapshot.docs;
          console.log('players after the event: ', players)
          // if (players.length >= MAHJONG_NUM) {
          //   allWatcher.close();
          // }
          that.setData({
            players: players,
            isPlaying: players.length >= MAHJONG_NUM
          });
        },
        onError: function (err) {
          console.error('监听因错误停止', err)
        }
      });

    const waitersWatcher = db.collection('mahjong_room').where({
        roomId: this.data.roomId,
        onTable: false
      })
      .watch({
        onChange: function (snapshot) {
          console.log('waiters after the event: ', snapshot.docs);
          that.setData({
            waiters: snapshot.docs,
          });
        },
        onError: function (err) {
          console.error('监听因错误停止', err)
        }
      });

    const myWatcher = db.collection('mahjong_room').where({
        roomId: this.data.roomId,
        openid: this.data.openid
      })
      .watch({
        onChange: function (snapshot) {
          console.log('myInfo after the event: ', snapshot.docs);
          let myInfo = snapshot.docs[0];
          if (myInfo.rejectedPositionExchange) {
            wx.showToast({
              title: '对方拒绝了您的请求！',
              icon: 'none',
              mask: true,
            });
            wx.cloud.callFunction({
              name: 'updateState',
              data: {
                update: {
                  rejectedPositionExchange: false
                },
                changers: [myInfo.openid]
              }
            });
          } else {
            that.setData({
              myInfo: snapshot.docs[0],
            });
          }
        },
        onError: function (err) {
          console.error('监听因错误停止', err)
        }
      });

    // 将监听器存入 data 域中，以便退出页面时关闭监听
    this.setData({
      allWatcher: allWatcher,
      playersWatcher: playersWatcher,
      waitersWatcher: waitersWatcher,
      myWatcher: myWatcher
    });
  },

  // 点击返回键离开房间
  leaveRoom: function () {
    console.log(app.globalData.openid);
    wx.cloud.callFunction({
        name: 'leaveRoom',
        data: {
          openid: app.globalData.openid,
        }
      })
      .then(res => {
        console.log('退出房间成功！', res);
      })
      .catch(er => {
        console.log('退出房间失败！', err);
      });
    wx.redirectTo({
      url: '/pages/index/index',
    });
  },

  // 点击准备触发的事件
  getReady: function () {
    this.setData({
      readyBtnLoading: true
    });

    wx.cloud.callFunction({
        name: 'updateState',
        data: {
          update: {
            onTable: !this.data.myInfo.onTable
          },
          changers: [this.data.openid]
        }
      })
      .then(res => {
        console.log('状态变为准备！', res);
        this.setData({
          readyBtnLoading: false,
        });
      })
      .catch(err => {
        console.log('准备状态更新失败！', err);
        this.setData({
          readyBtnLoading: false
        });
      })
  },

  // Modal 的显示与隐藏
  showModal(e) {
    let target = e.currentTarget.dataset.target;
    if (target == "hu" || target == "gang" || target == "WithdrawModal") {
      if (target != "WithdrawModal") {
        this.setData({
          others: this.getOtherPlayers(0)
        });
      }
      // 在计算加减分时禁止其余用户的页面互动
      wx.cloud.callFunction({
          name: 'updateState',
          data: {
            update: {
              waiting: true
            },
            changers: this.getOtherPlayers(1)
          }
        })
        .then(res => {
          console.log('状态改变成功！', res);
        })
        .catch(err => {
          console.log('状态改变失败！', err);
        });
    } else if (target == 'viewHistory') {
      this.getHistoryList();
    }

    this.setData({
      modalName: target
    });
  },
  hideModal(e) {
    let target = typeof (e) == 'undefined' ? e : e.currentTarget.dataset.target;
    if (target != "viewWaitingList" && target != "viewHistory") {
      // 在计算分数结束后允许其余用户的页面互动
      wx.cloud.callFunction({
          name: 'updateState',
          data: {
            update: {
              waiting: false
            },
            changers: this.getOtherPlayers(1)
          }
        })
        .then(res => {
          console.log('状态改变成功！', res);
        })
        .catch(err => {
          console.log('状态改变失败！', err);
        });
    }

    this.setData({
      modalName: null,
      isOwnDraw: true,
      isSelfGang: true,
      isAfterPeng: false,
      shooterIdx: 0
    });
  },

  // 获取 Modal 的相关数据
  getHuType: function (e) {
    this.setData({
      isOwnDraw: e.detail.value
    });
  },
  getGangType: function (e) {
    this.setData({
      isSelfGang: e.detail.value
    });
  },
  getGangAfterPeng: function (e) {
    this.setData({
      isAfterPeng: e.detail.value
    });
  },
  getBirdNum: function (e) {
    this.setData({
      birdNum: e.detail.value[0]
    });
  },
  getShooter: function (e) {
    console.log(e.detail.value[0]);
    let idx = e.detail.value[0];
    this.setData({
      // shooter: this.data.players[idx].openid,
      shooterIdx: idx
    });
  },

  // 将本次操作添加进历史记录并更新每位玩家的分数
  addHistoryEntry: function (e) {
    wx.showLoading({
      title: '更新分数中...',
      mask: true
    });

    let type = e.currentTarget.dataset.type;
    let record = this.createRecord(type);

    // 添加记录
    wx.cloud.callFunction({
        name: 'addEntry',
        data: {
          collection: 'history',
          object: record
        }
      })
      .then(res => {
        console.log('添加历史数据成功！', res);
      })
      .catch(err => {
        console.log('添加历史数据失败！', err);
      });
    // 计算分数
    wx.cloud.callFunction({
        name: 'calculateCredits',
        data: {
          info: record,
          withdraw: false
        }
      })
      .then(res => {
        console.log('修改分数成功！', res);
        wx.hideLoading({
          success: (res) => {},
        });
        this.hideModal();
      })
      .catch(err => {
        console.log('修改分数失败！', err);
        wx.hideLoading({
          success: (res) => {},
        });
        wx.showToast({
          title: '出现一点小问题...',
          icon: 'error'
        });
      });

  },
  // 用于创建传入云函数作为参数的对象
  createRecord: function (type) {
    let record = new Object();
    // // 记录除自己外其他桌上的玩家
    // let losers = this.getOtherPlayers(0);
    // 计算加分的种类等信息
    if (type == "hu") {
      if (this.data.isOwnDraw) {
        record['type'] = 0;
        record['losers'] = this.data.others;
      } else {
        record['type'] = 1;
        record['losers'] = [this.data.others[this.data.shooterIdx]];
      }
      record['birdNum'] = this.data.birdNum;
    } else if (type == "gang") {
      if (this.data.isSelfGang) {
        if (this.data.isAfterPeng) {
          record['type'] = 3;
        } else {
          record['type'] = 2;
        }
        record['losers'] = this.data.others;
      } else {
        record['type'] = 4;
        record['losers'] = [this.data.others[this.data.shooterIdx]];
      }
    }
    record['winner'] = this.data.myInfo;
    record['roomId'] = this.data.roomId;
    record['time'] = new Date();
    return record;
  },
  // 获取除本人外的桌上玩家信息
  getOtherPlayers: function (info, all) {
    let others = [];
    for (let i = 0; i < this.data.players.length; i++) {
      const player = this.data.players[i];
      if (player.openid == this.data.openid) {
        if (all) {} else {
          continue;
        }
      }
      switch (info) {
        case 0: // 全部信息
          others.push(player);
          break;
        case 1: // 获取 openid 信息
          others.push(player.openid);
          break;
      }
    }
    return others;
  },

  // 撤回记录的操作
  withdrawRecord: function () {
    db.collection('history').where({
        roomId: this.data.roomId
      }).orderBy('time', 'desc').get()
      .then(res => {
        console.log('查询历史记录成功！', res.data);
        let record = res.data[0];
        if (!record) {
          wx.showToast({
            title: '历史记录为空哟~',
            icon: 'none'
          });
          this.hideModal();
        } else if (record.winner.openid != this.data.openid) {
          wx.showToast({
            title: '上一条记录并非由您创建，因此您无法进行撤回操作哟~',
            icon: 'none'
          });
          this.hideModal();
        } else {
          // 显示 Loading
          wx.showLoading({
            title: '撤回中...',
            mask: true
          });
          // 删除历史记录
          wx.cloud.callFunction({
              name: 'removeEntry',
              data: {
                collection: 'history',
                condition: {
                  _id: record._id
                }
              }
            })
            .then(res => {
              console.log('记录删除成功！', res);
            })
            .catch(err => {
              console.log('记录删除失败！', err);
              wx.showToast({
                title: '记录无法删除！',
                icon: 'error'
              });
            });
          // 计算撤销前的分数
          wx.cloud.callFunction({
              name: 'calculateCredits',
              data: {
                info: record,
                withdraw: true
              }
            })
            .then(res => {
              console.log('撤销后分数计算成功！', res);
              wx.hideLoading();
              this.hideModal();
            })
            .catch(err => {
              console.log('撤销后分数计算失败！', res);
              wx.hideLoading();
              this.hideModal();
            })
        }
      })
      .catch(err => {
        console.log('查询历史记录失败！', err);
        this.hideModal();
      });
  },

  getHistoryList: function () {
    db.collection('history').where({
        roomId: this.data.roomId
      }).orderBy('time', 'asc').get()
      .then(res => {
        console.log('历史记录获取成功！', res.data);
        let data = res.data;
        let lst = [];
        let tmp = [];
        for (let i = 0; i < data.length; i++) {
          let element = data[i];
          element.score = this.getBasicScore(element);
          tmp.push(element);
          if (element.type == 0 || element.type == 1) {
            lst.push(tmp);
            tmp = [];
          }
        }
        if (tmp.length > 0) {
          lst.push(tmp);
        }

        this.setData({
          historyList: lst
        });
      })
      .catch(err => {
        console.log('历史记录获取失败！', err);
      })
  },
  // 根据 type 类型计算基础分数
  getBasicScore: function (record) {
    let score = 0;
    if (typeof (record.birdNum) != 'undefined') {
      let bird = record.birdNum;
      score = bird == 0 ? 6 : bird == 6 ? 12 : bird;
    }
    switch (record.type) {
      case 0:
      case 2: {
        score += 2;
        break;
      }
      case 1:
      case 3: {
        score += 1;
        break;
      }
      case 4: {
        score += 3;
        break;
      }
      default:
        break;
    }
    return score;
  },

  // 发起交换位置的请求
  exchangePosition: function (e) {
    wx.showLoading({
      title: '正在发起请求...',
      mask: true
    });
    // 将游戏中用户全部变为等待状态
    let lst = this.getOtherPlayers(1);
    lst.push(this.data.openid);
    wx.cloud.callFunction({
        name: 'updateState',
        data: {
          update: {
            waiting: true
          },
          changers: lst
        }
      })
      .then(res => {
        wx.hideLoading();
      })
      .catch(err => {
        wx.hideLoading();
      });
    // 向目标用户发送交换位置的请求
    let target = e.currentTarget.dataset.id;
    wx.cloud.callFunction({
      name: 'updateState',
      data: {
        update: {
          invitedPositionExchange: true,
          inviter: this.data.openid
        },
        changers: [target]
      }
    });
  },
  // 处理位置交换请求
  processPositionExchange: function (e) {
    let accept = (e.currentTarget.dataset.type == 'confirm');
    console.log('accept: ', accept);
    wx.showLoading({
      title: '处理请求中...',
      mask: true
    });
    // 取消所有人的等待状态
    wx.cloud.callFunction({
      name: 'updateState',
      data: {
        update: {
          waiting: false
        },
        changers: this.getOtherPlayers(1, true)
      }
    }).then(res => {
      // 更改本人状态
      wx.cloud.callFunction({
        name: 'updateState',
        data: {
          update: {
            onTable: accept,
            invitedPositionExchange: false,
            inviter: null
          },
          changers: [this.data.openid]
        }
      });
      // 更改邀请者状态
      wx.cloud.callFunction({
          name: 'updateState',
          data: {
            update: {
              onTable: !accept,
              rejectedPositionExchange: !accept
            },
            changers: [this.data.myInfo.inviter]
          }
        })
        .then(res => {
          wx.hideLoading();
        })
        .catch(err => {
          wx.hideLoading();
        });
    }).catch(err => {
      wx.hideLoading()
    });
  },

  // 点击授权登录按钮之后进入房间
  invitedToEnterRoom: async function () {
    try {
      // 通过点击事件获取用户信息
      await app.getUserInfo();

      try {
        // 向数据库中添加数据，表示用户进入房间
        await wx.cloud.callFunction({
          name: 'enterRoom',
          data: {
            userInfo: app.globalData.userInfo,
            roomId: this.data.roomId
          }
        });

        // 设置监听器
        this.setWatchers();

        this.setData({
          hasUserInfo: true
        });
      } catch (error) {
        console.log('something wrong when login!');
      }
    } catch (err) {
      wx.showToast({
        title: '用户拒绝授权！',
        icon: 'error',
        mask: true
      });
    }
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
    // if (!app.globalData.openid) { // 如果邀请进来的用户之前并未注册
    //   // 跳转到主页以进行注册登记的操作
    //   wx.reLaunch({
    //     url: '/pages/index/index',
    //   });
    // } else {
    //   console.log('当前用户的 openid 为', this.data.openid);

    // }
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
    this.data.allWatcher.close();
    this.data.playersWatcher.close();
    this.data.waitersWatcher.close();
    this.data.myWatcher.close();
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
  onShareAppMessage: function (ops) {
    return {
      title: '您的好友邀请您加入房间啦~',
      path: 'pages/room/room?id=' + this.data.roomId + '&invited=true', // 路径，传递参数到指定页面。
      imageUrl: 'cloud://credits-controller-6dezu832737ac.6372-credits-controller-6dezu832737ac-1305327447/images/cover/share-cover.jpg', // 分享的封面图
      success: function (res) {
        // 转发成功
        console.log("转发成功:" + JSON.stringify(res));
      },
      fail: function (res) {
        // 转发失败
        console.log("转发失败:" + JSON.stringify(res));
      }
    }
  }
})