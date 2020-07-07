const promise = require('adbkit/bluebird');
const fs = require('fs');
const adb = require('adbkit/lib/adb');
const client = adb.createClient();

export function pullFile(dstPath: string) {
  client
    .listDevices()
    .then(function(devices) {
      return promise.map(devices, function(device) {
        return client
          .pull(devices.id, '/sdcard/latest.cpuprofile')
          .then(function(transfer) {
            return new Promise(function(resolve, reject) {
              transfer.on('progress', function(stats) {
                console.log(
                  '[%s] Pulled %d bytes so far',
                  device.id,
                  stats.bytesTransferred,
                );
              });
              transfer.on('end', function() {
                console.log('[%s] Pull complete', device.id);
                resolve(device.id);
              });
              transfer.on('error', reject);
              transfer.pipe(fs.createWriteStream(dstPath));
            });
          });
      });
    })
    .then(function() {
      console.log('Done pulling /system/build.prop from all connected devices');
    })
    .catch(function(err) {
      console.error('Something went wrong:', err.stack);
    });
}
