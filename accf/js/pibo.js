/**
 * Circulus Client API 20200224 - MQTT
 * 20220325
 * 20200224
 * 20190918
 * 20180917
 * 20140819
 * 20150627
 */

function loadScript(url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
  
    script.onload = callback;
    head.appendChild(script);
  }
  
  pibo = {
    _id: undefined,
    _topic: undefined,
    _client: undefined,
    _timeout: 10000,
    _callback: {},
    _isConnect: false,
    onload: (mode) => {
      const iot_url =  `${mode.toLowerCase().charAt(0)}-proxy.circul.us:8443`;
      alert(iot_url)
  
      //pibo._client = mqtt.connect('ws://13.124.144.67:8888')
      //pibo._client = mqtt.connect('ws://127.0.0.1:8888')
      //pibo._client = mqtt.connect('wss://dev-log.circul.us:57602')
      //pibo._client = mqtt.connect('wss://ops-log.circul.us:8443',{ keepalive : 5 })
  
      if(pibo._client && pibo._client.disconnect )
        pibo._client.disconnect()
  
      pibo._client = mqtt.connect(`wss://${iot_url}`, {
        keepalive: 5,
      }); // magic number // 3
      //pibo._client = mqtt.connect('wss://tmp-log.circul.us:8443',{ keepalive : 5 })
  
      pibo._client.on('connect', () => {
        pibo._isConnect = true;
        //alert('mqtt connected complete 1');
      });
  
      pibo._client.on('reconnect', () => {
        pibo._isConnect = true;
      });
  
      pibo._client.on('offline', () => {
        pibo._isConnect = false;
      });
  
      // 끊어진 경우 명령어 forwording 수행
      pibo._client.on('close', function () {
        pibo._isConnect = false;
        //alert('close');
      });
  
      pibo._client.on('message', function (topic, message) {
        console.log(topic, message.toString());
        //console.log(pibo._topic,pibo._topic.length)
        console.log(topic == pibo._topic, topic.toString() == pibo._topic);
        if (topic == pibo._topic) {
          try {
            const data = JSON.parse(message.toString());
            console.log(pibo._callback);
            if (data.key && pibo._callback[data.key]) {
              console.info(topic, data);
              clearTimeout(pibo._callback[data.key].to);
              console.log(pibo._callback[data.key]);
              if (pibo._callback[data.key].cb instanceof Function)
                pibo._callback[data.key].cb(data.value);
              else console.log(data.key, 'No callback?');
            } else {
              console.warn(topic, message.toString());
            }
          } catch (e) {
            console.error(topic, message.toString());
          }
        } else {
          console.warn(topic, message.toString());
        }
      });
    },
    init: (id) => {
      pibo._id = `m_${id}`;
      pibo._topic = `r_${id}`;
      pibo._client.subscribe(pibo._topic);
    },
    debug: (id, mode) => {
      pibo.onload(mode);
      pibo._id = `m_${id}`;
      pibo._topic = `c_${id}`;
      pibo._client.subscribe(pibo._topic);
    },
    send: (key, value, cb) => {
      let timeout = pibo._timeout;
  
      if (pibo._callback[key] && pibo._callback[key].to)
        // 중복 요청시 겹치는 문제가 있으므로 기존 콜 제거
        clearTimeout(pibo._callback[key].to);
  
      if (['wifi_change'].indexOf(key) > -1) {
        timeout = timeout * 3;
      }
  
      const to = setTimeout(() => {
        if (pibo._callback[key].cb instanceof Function)
          pibo._callback[key].cb(false);
      }, timeout);
  
      pibo._callback[key] = { cb, to };
      console.log('>>>>>' + key, cb);
      console.log(value);
      pibo._client.publish(pibo._id, JSON.stringify({ key, value }));
    },
    receive: (key, cb) => {
      //alert(pibo._callback);
      console.error('receive', key);
      pibo._callback[key] = { cb };
    },
  };
  
  const funcs = {
    f_2_cb: ['message'],
    f_2: [
      'motion',
      'extend',
      'simulator',
      'speak',
      'play',
      'action',
      'speak',
      'eye',
      'bot',
      'mode',
    ],
    f_1_cb: [
      'candidate',
      'removeMessage',
      'talk',
      'event',
      'wifi_change',
      'change',
      'voice',
      'listen',
      'volume',
      'geo',
    ],
    f_1: ['$_setup', 'env', 'plug'],
    f_0_cb: [
      'wifi_list',
      'version',
      'compliment',
      'camera',
      'wifi_reset',
      'reset',
      'info',
      'refreshBots',
    ],
    f_0: ['kill', 'stop', 'halt', 'mute'],
  };
  
  Object.keys(funcs).forEach((key) => {
    funcs[key].forEach((item) => {
      console.log(key, item);
      switch (key) {
        case 'f_2_cb':
          pibo[item] = (_, data, cb) => {
            pibo.send(item, { _, data }, cb);
          };
          break;
        case 'f_2':
          pibo[item] = (_, data) => {
            pibo.send(item, { _, data });
          };
          break;
        case 'f_1':
          pibo[item] = (_, data) => {
            pibo.send(item, { _, data });
          };
          break;
        case 'f_1_cb':
          pibo[item] = (_, cb) => {
            pibo.send(item, { _ }, cb);
          };
          break;
        case 'f_0_cb':
          pibo[item] = (cb) => {
            pibo.send(item, {}, cb);
          };
          break;
        case 'f_0':
          pibo[item] = () => {
            pibo.send(item);
          };
          break;
      }
    });
  });
  
  console.log('PIBO Enroll', Object.keys(pibo));
  //console.log(pibo._callback)
  
  window.onload = function () {
    var self = this;
    loadScript('https://unpkg.com/mqtt@3.0.0/dist/mqtt.min.js', function () {
      self.pibo.onload('OPS');
  
      if (self.pibo.ready) {
        self.pibo.ready();
      } else {
        alert('Not defined - pibo.ready function');
      }
    });
  };