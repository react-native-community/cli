const promise = require('adbkit/bluebird');
const adb = require('adbkit/lib/adb');
const client = adb.createClient();

//packageName begins with 'com.projectName'
export function listFiles(packageName: string) {
  client
    .listDevices()
    .then(function(devices: any) {
      return promise.map(devices, function(device: any) {
        //adb shell
        //List files in the directory /data/user/0/packageName
        return client
          .shell(
            device.id,
            `run-as ${packageName} ls data/user/0/${packageName}/cache`,
          )
          .then(function(files: any) {
            files.forEach(function(file: any) {
              if (file.isFile()) {
                console.log('[%s] Found file "%s"', device.id, file.name);
              }
            });
          });
      });
    })
    .then(function() {
      console.log(
        'Done checking /data/user/0/packageName files on connected devices',
      );
    })
    .catch(function(err: any) {
      console.error('Something went wrong:', err.stack);
    });
}
