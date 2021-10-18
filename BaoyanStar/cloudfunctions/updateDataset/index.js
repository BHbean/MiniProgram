// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  let condition = {};
  if (typeof (event.condition) != "undefined") {
    condition = event.condition;
  }

  if (typeof (event.id) != "undefined") {
    return await cloud.database().collection('camps')
      .doc(event.id)
      .update({
        data: event.update
      })
  } else {
    return await cloud.database().collection('camps')
      .where(condition)
      .update({
        data: event.update
      })
  }

}