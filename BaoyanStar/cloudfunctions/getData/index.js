// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  let condition = {};
  if (typeof(event.condition) != "undefined") {
    condition = event.condition;
  }
  let method = 'asc';
  if (typeof(event.method) != "undefined") {
    method = event.method;
  }

  return await cloud.database().collection('camps')
  .where(condition)
  .orderBy(event.order, method)
  // .skip(event.page)
  // .limit(event.entryNum)
  .get()
}