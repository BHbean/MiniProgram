Page({
  data: {
    PageCur: 'list'
  },
  NavChange(e) {
    this.setData({
      PageCur: e.currentTarget.dataset.cur
    });
  }
})