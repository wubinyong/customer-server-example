const request_promise = require('request-promise');
const fs = require('fs');

const API_BASE = 'https://localhost:3030';

const ca = fs.readFileSync('./certs/ca.crt');
const cert = fs.readFileSync('./certs/client_cert.crt');
const key = fs.readFileSync('./certs/client_cert.key');

const deviceId = 'test-device-id';
const modelNumber = 'test-model';

async function test() {
  let options = {
    uri: API_BASE + '/devicecert',
    method: 'POST',
    body: {
      deviceId: deviceId,
      modelNumber: modelNumber,
    },
    cert: cert,
    key: key,
    // ca: ca,
    rejectUnauthorized: false,
    json: true
  }

  let resp = await request_promise(options);
  console.log(resp)

  resp.deviceId = deviceId;
  resp.modelNumber = modelNumber;

  options = {
    uri: API_BASE + '/syncdevicecert',
    method: 'POST',
    body: resp,
    cert: cert,
    key: key,
    // ca: ca,
    rejectUnauthorized: false,
    json: true
  }

  resp = await request_promise(options);
  console.log(resp)


  options = {
    uri: API_BASE + '/forwardtelemetry',
    method: 'POST',
    body: {
      deviceId: deviceId,
      createdAt: Math.floor(Date.now() / 1000),
      data: {
        testKey: 'testValue'
      }
    },
    cert: cert,
    key: key,
    // ca: ca,
    rejectUnauthorized: false,
    json: true
  }

  resp = await request_promise(options);
  console.log(resp)
}

test()