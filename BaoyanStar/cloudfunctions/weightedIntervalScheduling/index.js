// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // env: cloud.DYNAMIC_CURRENT_ENV
  env: 'xiang-camps-2g3taqxv5b7540d0'
})

// 云函数入口函数
exports.main = async (event, context) => {
  // 将数据库中所有选择清空
  // cloud.database().collection('camps')
  //   .where({
  //     qualified: true
  //   })
  //   .update({
  //     data: {
  //       selected: false
  //     }
  //   });
  // cloud.callFunction({
  //   name: 'updateDataset',
  //   data: {
  //     condition: {
  //       qualified: true
  //     },
  //     update: {
  //       selected: false
  //     }
  //   }
  // });

  // cloud.database().collection('camps')
  //   .where({
  //     qualified: true
  //   })
  //   .orderBy('end_date', 'asc')
  //   .get()
  //   .then(res => {
  //     let intervals = res.data;
  //     console.log(intervals);

  //     // 计算 p[i]，即不与区间 i 冲突的区间的最大标号
  //     let p = new Array(intervals.length + 1);
  //     p[0] = 0;
  //     for (let i = 1; i < p.length; i++) {
  //       // 二分查找
  //       // let tmp = intervals.slice(0, i - 1).concat(intervals.slice(i, intervals.length));
  //       let tmp = intervals;
  //       let low = 0,
  //         high = intervals.length - 1;
  //       while (low <= high) {
  //         let mid = Math.floor(low + (high - low) / 2);
  //         if (intervals[i - 1].start_date < tmp[mid].end_date) {
  //           high = mid - 1;
  //           if (high <= low && low == 0) {
  //             low = -1;
  //             break;
  //           }
  //         } else if (intervals[i - 1].start_date > tmp[mid].end_date) {
  //           if (mid + 1 < p.length - 1 && intervals[i - 1].start_date <= tmp[mid + 1].end_date) {
  //             low = mid;
  //             break;
  //           }
  //           low = mid + 1;
  //         } else {
  //           high -= 1;
  //         }
  //       }
  //       p[i] = low + 1;
  //     }
  //     console.log('前序数组：', p);

  //     // 计算 dp
  //     let dp = new Array(p.length);
  //     dp[0] = 0;
  //     for (let i = 1; i < dp.length; i++) {
  //       dp[i] = Math.max(dp[i - 1], dp[p[i]] + parseInt(intervals[i - 1].weight));
  //     }
  //     console.log('动归数组：', dp);

  //     // 根据 dp 倒推应该做出的选择
  //     let choices = new Array();
  //     for (let i = dp.length - 1; i > 0; i--) {
  //       if (dp[i] != dp[i - 1]) {
  //         console.log('_id: ', intervals[i - 1]._id);
  //         choices.push(intervals[i - 1]._id);
  //         i = p[i] + 1;
  //       }
  //     }
  //     console.log('_id: ', intervals[i - 1]._id);

  //     const _ = cloud.database().command;
  //     cloud.database().collection('camps')
  //       .where({
  //         _id: _.in(choices)
  //       })
  //       .update({
  //         data: {
  //           selected: true
  //         }
  //       });
  //   })

  let intervals = event.colleges;
  console.log(intervals);

  // 计算 p[i]，即不与区间 i 冲突的区间的最大标号
  let p = new Array(intervals.length + 1);
  p[0] = 0;
  for (let i = 1; i < p.length; i++) {
    // 二分查找
    // let tmp = intervals.slice(0, i - 1).concat(intervals.slice(i, intervals.length));
    let tmp = intervals;
    let low = 0,
      high = intervals.length - 1;
    while (low <= high) {
      let mid = Math.floor(low + (high - low) / 2);
      if (intervals[i - 1].start_date < tmp[mid].end_date) {
        high = mid - 1;
        if (high <= low && low == 0) {
          low = -1;
          break;
        }
      } else if (intervals[i - 1].start_date > tmp[mid].end_date) {
        if (mid + 1 < p.length - 1 && intervals[i - 1].start_date <= tmp[mid + 1].end_date) {
          low = mid;
          break;
        }
        low = mid + 1;
      } else {
        high -= 1;
      }
    }
    p[i] = low + 1;
  }
  console.log('前序数组：', p);

  // 计算 dp
  let dp = new Array(p.length);
  dp[0] = 0;
  for (let i = 1; i < dp.length; i++) {
    dp[i] = Math.max(dp[i - 1], dp[p[i]] + parseInt(intervals[i - 1].weight));
  }
  console.log('动归数组：', dp);

  // 根据 dp 倒推应该做出的选择
  let choices = new Array();
  for (let i = dp.length - 1; i > 0; i--) {
    if (dp[i] != dp[i - 1]) {
      console.log('_id: ', intervals[i - 1]._id);
      choices.push(intervals[i - 1]._id);
      i = p[i] + 1;
    }
  }

  const _ = cloud.database().command;
  return await cloud.database().collection('camps')
    .where({
      _id: _.in(choices)
    })
    .update({
      data: {
        selected: true
      }
    });

}