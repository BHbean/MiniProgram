// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})


const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event, context) => {
  let info = event.info;
  let factor = event.withdraw? -1: 1;
  // 计算基础分数
  let score = 0;
  if (typeof(info.birdNum) != 'undefined') {
    let bird = info.birdNum;
    score = bird == 0? 6: bird == 6? 12: bird;
  }
  switch (info.type) {
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
  // 提取需要扣分的玩家的 openid
  let loserNum = info.losers.length;
  let loserOpenid = [];
  for (let i = 0; i < info.losers.length; i++) {
    const element = info.losers[i];
    loserOpenid.push(element.openid);
  }

  // 扣分
  db.collection('mahjong_room').where({
    openid: _.in(loserOpenid)
  }).update({
    data: {
      credit: _.inc(-score * factor)
    }
  })
  // 加分
  return await db.collection('mahjong_room').where({
    openid: info.winner.openid
  }).update({
    data: {
      credit: _.inc(score * loserNum * factor)
    }
  })

}