// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  return await db.collection('mahjong_room').add({
    data: {
      openid: event.userInfo.openid,
      avatarUrl: event.userInfo.avatarUrl,
      nickName: event.userInfo.nickName,
      roomId: event.roomId,
      credit: 0,
      onTable: false,
      waiting: false,
      invitedPositionExchange: false,
      rejectedPositionExchange: false,
      inviter: null
    }
  })
}