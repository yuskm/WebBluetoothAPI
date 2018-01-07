/**
 * サービス UUID
 * @type {string}
 */
const SERVICE_UUID = "ffffffff-ffff-ffff-ffff-fffffffffff0";

/**
 * キャラクタリスティック UUID
 * @type {string}
 */
const CH0_CHARACTERISTIC_UUID = "ffffffff-ffff-ffff-ffff-fffffffffff3";
const CH1_CHARACTERISTIC_UUID = "ffffffff-ffff-ffff-ffff-fffffffffff4";
const TEST_CHARACTERISTIC_UUID = "ffffffff-ffff-ffff-ffff-fffffffffff5";

let gCh0Characteristic;
let gCh1Characteristic;
let gTestCharacteristic;


/**
 *  DOM
 */
let gMainView;
//ymiya [ 2018/01/07
let gDataView = [null, null, null];
//ymiya]
////////////////////////////////////////////////////////////////////////////////
function Init() {
    gMainView = document.querySelector("#mainView");
    gDataView[0] = document.querySelector("#ch0Data");
    gDataView[1] = document.querySelector("#ch1Data");
    gDataView[2] = document.querySelector("#testData");
}

////////////////////////////////////////////////////////////////////////////////
// - Web Bluetooth APIで BLE peripheral に接続

function OnConnectClick() {
  // loading表示
  navigator.bluetooth.requestDevice({
    filters: [
      {
        services: [
          SERVICE_UUID
        ]
      }
    ]
  }).then(device => {
      console.log("デバイスを選択しました。接続します。");
      console.log("デバイス名 : " + device.name);
      console.log("ID : " + device.id);

      // 選択したデバイスに接続
      return device.gatt.connect();
    }).then(server => {
      console.log("デバイスへの接続に成功しました。サービスを取得します。");

      // UUIDに合致するサービス(機能)を取得
      return server.getPrimaryService(SERVICE_UUID);
    }).then(service => {
      console.log("サービスの取得に成功しました。キャラクタリスティックを取得します。");

      // UUIDに合致するキャラクタリスティック(サービスが扱うデータ)を取得
      return Promise.all([
        service.getCharacteristic(CH0_CHARACTERISTIC_UUID),
        service.getCharacteristic(CH1_CHARACTERISTIC_UUID),
        service.getCharacteristic(TEST_CHARACTERISTIC_UUID)
      ]);
    }).then(characteristic => {
      gCh0Characteristic = characteristic[0];
      gCh1Characteristic = characteristic[1];
      gTestCharacteristic = characteristic[2];

      console.log("BLE接続が完了しました。");

      loadSensorValue();    // センサーの値を読み込み
    })
    .catch(error => {
      console.log("Error : " + error);
    });
}

////////////////////////////////////////////////////////////////////////////////
// - センサー値 読み込み

let renewValue = function (data, dom) {
    let count = data.byteLength;
    let valInt = 0;
    for (let i = count - 1; i >= 0; i--) {
        valInt <<= 8;
        valInt += data.getUint8(i);                // integer でやりとりする場合
        console.log( "valInt =" + valInt );
        console.log( "value.getUint8(" + i  + ") =" + data.getUint8(i) );
     }
     let valStrArray = new Uint8Array(data.buffer);
     let dataLen = valStrArray.byteLength;
     console.log("receive data length : " + dataLen
     + " | string : "+  String.fromCharCode.apply(null, valStrArray)
     + " | int : " + valInt);

     dom.innerHTML = valInt;
}

// - 1秒 毎にセンサー値 読み取り
function loadSensorValue() {
    let characteristics = [
        gCh0Characteristic,
        gCh1Characteristic,
        gTestCharacteristic
    ];
    let chCount = 0;
    let chN = characteristics.length;

    setInterval(function () {
        characteristics[chCount].readValue()
        .then(function(data) {
            renewValue(data, gDataView[chCount]);
            if ( ++chCount >= 3 ) {
                chCount = 0;
            }
        })
        .catch(error => {
            console.log("Error : " + error);
        });
    }, 1000);
}
window.addEventListener("load", Init);
