export default {
  q: [],
  timer: null,

  upload(obj) {
    obj.timestamp = Date.now().valueOf();
    this.q.push(obj);

    this.timer ||
      (this.timer = setTimeout(() => {
        this.flush();
      }, 1e3));
  },

  flush() {
    if (this.q.length > 0) {
      console.log(this.q.shift());
      // wx.request({})

      setTimeout(() => {
        this.flush();
      }, 1e3);
    } else {
      this.timer = null;
    }
  }
};
