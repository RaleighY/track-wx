import uploader from "./uploader.js";

const tools = {
  App,
  Page,
  Component,
  Behavior,
  lastScene: 0,
  lastCloseTime: 0,
  keepAlive: 3 * 1e3,
  sessionId: null,
  hook: function(fn, callback) {
    return function() {
      if (callback) {
        callback.apply(this, arguments);
      }
      fn.apply(this, arguments);
    };
  },
  AppCallback: {
    onShow(e) {
      // this -> App
      tools.scene = e.scene;

      if (
        tools.lastScene === e.scene &&
        Date.now().valueOf() - tools.lastCloseTime < tools.keepAlive
      ) {
        console.log("保持连接中");
      } else {
        tools.resetSessionId();

        uploader.upload({
          event: "session",
          scene: e.scene,
          sessionId: tools.sessionId
        });

        wx.getUserInfo({
          success(res) {
            uploader.upload({
              event: "userInfo",
              userInfo: res.userInfo,
              sessionId: tools.sessionId
            });
          }
        });

        wx.getNetworkType({
          success(res) {
            uploader.upload({
              event: "networkType",
              networkType: res.networkType,
              sessionId: tools.sessionId
            });
          }
        });

        wx.getSystemInfo({
          success(res) {
            uploader.upload({
              event: "systemInfo",
              systemInfo: res,
              sessionId: tools.sessionId
            });
          }
        });
      }
    },
    onHide() {
      // this -> App
      tools.lastScene = tools.scene;
      tools.lastCloseTime = Date.now();
    }
  },
  PageCallback: {
    onShow() {
      uploader.upload({
        event: "view",
        path: this.route,
        sessionId: tools.sessionId
      });
    },
    other(e) {
      if (e.type === "tap") {
        uploader.upload({
          event: "tap",
          id: e.currentTarget.id,
          hesitate: e.timeStamp,
          x: e.detail.x,
          y: e.detail.y,
          sessionId: tools.sessionId
        });
      } else if (e.type === "getphonenumber") {
        if (e.detail.errMsg.match("ok")) {
          uploader.upload({
            event: "phoneNumber",
            hesitate: e.timeStamp,
            encryptedData: e.detail.encryptedData,
            iv: e.detail.iv,
            sessionId: tools.sessionId
          });
        }
      } else if (e.type === "getuserinfo") {
        if (e.detail.errMsg.match("ok")) {
          uploader.upload({
            event: "userInfo",
            userInfo: e.detail.rawData,
            sessionId: tools.sessionId
          });
        }
      } else {
        uploader.upload({ e: e, sessionId: tools.sessionId });
      }
    }
  },
  createSessionId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(t) {
      var e = (16 * Math.random()) | 0;
      return (t == "x" ? e : (3 & e) | 8).toString(16);
    });
  },
  resetSessionId() {
    this.sessionId = tools.createSessionId();
  }
};

class TrackingIO {
  init() {
    const me = this;
    App = function(options) {
      options.isApp = true;
      return tools.App(me.decorate(options));
    };
    Page = function(options) {
      options.isPage = true;
      return tools.Page(me.decorate(options));
    };
  }

  decorate(options) {
    if (options.isApp) {
      options.onShow = tools.hook(
        options.onShow ? options.onShow : function() {},
        tools.AppCallback.onShow
      );

      options.onHide = tools.hook(
        options.onHide ? options.onHide : function() {},
        tools.AppCallback.onHide
      );
    }

    if (options.isPage) {
      options.onShow = tools.hook(
        options.onShow ? options.onShow : function() {},
        tools.PageCallback.onShow
      );

      for (let key in options) {
        if (typeof options[key] === "function") {
          if (key !== "onShow" && key !== "onLoad") {
            options[key] = tools.hook(options[key], tools.PageCallback.other);
          }
        }
      }
    }

    return options;
  }

  setIdentity(obj) {
    uploader.upload({
      event: "identity",
      unionId: obj.unionId,
      openId: obj.openId,
      sessionId: tools.sessionId
    });
  }
}

export default new TrackingIO();
