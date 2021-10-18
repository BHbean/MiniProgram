// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  let openid = wxContext.OPENID;

  await cloud.database().collection('users').where({
    openid: openid
  }).get()

  return {
    openid: openid,
    queryResult: await cloud.database().collection('users').where({
      openid: openid
    }).get()
  };
}