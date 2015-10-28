'use strict';

(function (exports) {

  function PinAppItem(index) {
    if (index === null || index === undefined){
      return false;
    }
    this.index = index;
    //creating pin app element
    var pinElem = document.createElement('div');
    pinElem.className = 'pin-app-item';
    pinElem.setAttribute('data-index', this.index);
    //console.log(this);
    //pinElem.setAttribute('id', 'pin-app-' + this.name);
    pinElem.innerHTML = "<img class='pin-app-icon'><br></img>" +
            "<span class='title'></span>" +
            "<div class='unread_notif'></div>";
    var pinList = document.getElementById('pin-apps-list');
    var moreAppsLi = document.getElementById('moreApps');
    pinList.insertBefore(pinElem, moreAppsLi);

    this.element = pinElem;
    this.icon = this.element.querySelector('.pin-app-icon');
    this.title = this.element.querySelector('.title');
  }

  PinAppItem.prototype = {
    entry: null,

    bindEntry: function(entry) {
      if (!entry){
        return;
      }
      this.clear();
      this.entry = entry;
      this.entry.index = this.index;
      this.targetApp = app.getAppByURL(this.entry.manifestURL);
      this.render();
    },

    render: function() {
      this.element.removeEventListener("click", this);
      if(this.targetApp) {
        this.icon.style.visibility = "visible";
        this.title.style.visibility = "visible";
        this.element.dataset.manifesturl = this.entry.manifestURL;
        if(this.entry.icon) {
          this.icon.src = this.entry.icon;
          this.element.addEventListener("click", this);
        }
        if(this.entry.name) {
          this.title.textContent = this.entry.name;
        }
      } else {
          this.icon.style.visibility = "hidden";
          this.title.style.visibility = "hidden";
      }
    },

    clear: function() {
      this.entry = {
        entry_point: null,
        name: null,
        manifest: null,
        index: this.index
      };
      this.element.removeEventListener("click", this);
      this.targetApp = null;
    },

    launch: function() {
      if(!this.targetApp) return;

      if(this.entry.entry_point) {
        this.targetApp.launch(this.entry.entry_point);
      } else {
        this.targetApp.launch();
      }
    },

    setEntry: function(entry) {
      this.bindEntry(entry);
    },

    getEntry: function() {
      return this.entry;
    },

    save: function() {
      app.savePinAppItem(this.entry);
    },

    handleEvent: function(e) {
      this.launch();
    }
  };

  function PinAppManager() {
    //do nothing
  }

  PinAppManager.prototype = {
    items: [],
    // proto impl of Notifications counters per app basis
    STORE_NAME: 'notifications_count',
    _storeRef: null,

    init: function () {
      this.onLoadSettings();
      var self = this;
      this.initStore().then(store => {
        store.onchange = function ds_onChange(e) {
          // not sure, if we really need to distinguish events by operation.
          switch (e.operation) {
          case 'added':
            self.debug('added notification for new target');
          case 'updated':
            self.debug('UPDATED notification for existing target');
          }

          self._storeRef.get(e.id).then(function(obj){
            self.debug('loaded value == ' + obj + ' for ID = ' + e.id);
            ShowNotifBubble(e.id, obj);
          }, function(err) {
            console.warn('[el][PinAppManager] error loading notifications count. err = ' + JSON.stringify(err));
          });
        }
      }, err => {
        console.warn('[el][PinAppManager] Problem opening \'notifications_count\' storage| err = ' + JSON.stringify(err));
      });
    },

    onLoadSettings: function() {
      var pinAppsList = app.getPinAppList();
      for (var i = 0; i < pinAppsList.length; i++) {
        this.items[i] = new PinAppItem(i);
        this.items[i].bindEntry(pinAppsList[i]);
      }
    },

    handleEvent: function(e) {
    },

    debug: function ns_debug(msg) {
      console.log('[el] ' + msg);
    },

    initStore: function ns_initStore() {
      var self = this;
      return new Promise(resolve => {
        if (self._storeRef) {
          return resolve(self._storeRef);
        }
        navigator.getDataStores(self.STORE_NAME).then(stores => {
          self._storeRef = stores[0];
          //TODO: need to iterate through obtained store, to read initial values for notifications.
          return resolve(this._storeRef);
        }, function (err) {
          self.debug('ERROR '+ JSON.stringify(err));
          return reject(err);
        });
      });
    },

  };

  exports.PinAppManager = PinAppManager;

  function ShowNotifBubble(appId,notifCount){

      var els = document.getElementsByTagName('div');
      var i = 0;

      for (i = 0; i < els.length; i++) {
        if (els[i].hasAttribute('data-manifesturl')) {
          if (els[i].getAttribute('data-manifesturl') == appId) {

            var unreadNotif = els[i].getElementsByClassName('unread_notif')[0];

            /* start test part */
//            var notifCountBase = parseInt(unreadNotif.innerHTML || 0);
//            notifCountBase += notifCount;

//            if(notifCountBase > 999){
//              notifCountBase = 0;
//            }
            /* end test part */

            /* uncomment for real life */
             var notifCountBase;
             notifCountBase = parseInt(notifCount);
            /* /uncomment for real life */

            if(notifCountBase > 0 || notifCountBase){
              unreadNotif.style.display = "block";
              unreadNotif.innerHTML = notifCountBase;
            }
            else{
              unreadNotif.style.display = "none";
              unreadNotif.innerHTML = 0;
            }
          }

        }
      }
  };

window.addEventListener("keydown", function(e){

  switch(e.keyCode){
    case 49:
      ShowNotifBubble('app://communications.gaiamobile.org/manifest.webapp',1);
    break;

    case 50:
      ShowNotifBubble('app://sms.gaiamobile.org/manifest.webapp',1);
    break;

     case 51:
      ShowNotifBubble('app://camera.gaiamobile.org/manifest.webapp',1);
    break;

     case 52:
      ShowNotifBubble('app://settings.gaiamobile.org/manifest.webapp',1);
    break;

    default:
      return;
    break;
  }

});

})(window);
