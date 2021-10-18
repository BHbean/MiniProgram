// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  let rooms = [];
  let roomRes = await db.collection('mahjong_room').where({
    openid: event.openid
  }).get();
  // 将用户退出的房间号进行记录
  for (let i = 0; i < roomRes.data.length; i++) {
    const element = roomRes.data[i];
    rooms.push(element.roomId);
  }

  // 在数据库中删除该用户与房间相关的信息
  await db.collection('mahjong_room').where({
    openid: event.openid
  }).remove();

  // 判断是否为该房间存在的最后一个用户，是的话则把房间设置为空
  let res = await db.collection('mahjong_room').where({
    roomId: _.in(rooms)
  }).get();
  let data = res.data;
  // 过滤掉所有有人的房间
  rooms.filter(function (item) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].roomId == item) {
        return false;
      }
    }
    return true;
  })
  console.log('roomId List:', rooms);

  return await cloud.callFunction({
    name: 'changeRoomState',
    data: {
      roomId: rooms,
      update: {
        empty: true
      }
    }
  })

}