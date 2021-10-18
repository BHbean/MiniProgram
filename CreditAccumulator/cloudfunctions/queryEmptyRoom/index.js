// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  // 获取空闲房间
  let res = await db.collection('available_rooms')
    .where({
      empty: true
    }).get();
  let data = res.data;
  console.log('data', data);
  if (data.length == 0) {       // 如果空闲房间的数量为 0
    return -1;
  } else {                      // 存在空闲房间
    // 随机选择房间
    let rand = Math.floor(Math.random() * data.length);
    let id = data[rand]._id;
    // 将对应房间号状态设置为满
    await db.collection('available_rooms')
      .doc(id)
      .update({
        data: {
          empty: false
        }
      });

    // 向 mahjong_room 集合中插入用户信息
    await cloud.callFunction({
      name: 'enterRoom',
      data: {
        userInfo: event.userInfo,
        roomId: id
      }
    });
    // await db.collection('mahjong_room').add({
    //   data: {
    //     openid: event.userInfo.openid,
    //     avatarUrl: event.userInfo.avatarUrl,
    //     nickName: event.userInfo.nickName,
    //     roomId: id,
    //     state: 0
    //   }
    // })
    
    return id;
  }
}