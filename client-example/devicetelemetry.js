const request_promise = require('request-promise');
const fs = require('fs');
const crypto = require('crypto');
const colors = require('colors');
const Mock = require('mockjs');

const API_BASE = 'https://52.194.213.64:3040';

const ca = fs.readFileSync('./certs/ca.crt');
const cert = fs.readFileSync('./certs/device_cert.crt');
const key = fs.readFileSync('./certs/device_cert.key');

const deviceId1 = 'xz-dev-0614-4';
const deviceId2 = 'test-device-id-2';
const modelNumber = 'test-model';

function printOptions(options) {
  const options_copy = Object.assign({}, options);
  delete options_copy.cert;
  delete options_copy.key;
  delete options_copy.rejectUnauthorized;
  delete options_copy.json;
  console.log(`${JSON.stringify(options_copy, null, 2)}`.gray);
}

function getMockBusinessData() {
  return Mock.mock({
    wt: '@integer(40000, 100000)',
    bmi: '@integer(150, 300)',
    fat: '@integer(50, 400)',
    bm: '@integer(1200, 2000)',
    mus: '@integer(5000, 50000)',
    ts: Math.ceil(Date.now() / 1000)
  })
}

async function test() {
  // Ref: https://stackoverflow.com/questions/51252713/how-to-get-the-same-fingerprint-that-aws-uses-from-x-509-with-node-forge
  let baseString = cert.toString().match(/-----BEGIN CERTIFICATE-----\s*([\s\S]+?)\s*-----END CERTIFICATE-----/i);
  let rawCert = Buffer.from(baseString[1], 'base64');
  let shaSum = crypto.createHash('sha256').update(rawCert).digest('hex');

  // Device1 direct send
  let options = {
    uri: API_BASE + `/devicetelemetry/${deviceId1}`,
    method: 'POST',
    body: getMockBusinessData(),
    cert: cert,
    key: key,
    ca: ca,
    rejectUnauthorized: true,
    json: true,
    headers: {
      // 'APIKeyName': 'APIKeyValue'
    }
  }

  console.log(`Device telemetry request:`);
  printOptions(options)
  console.log(`Device1 sending telemetry data with signed device cert ${shaSum}`);
  let resp = await request_promise(options).catch(err => {
    console.log(err);
  });
  console.log(`Device telemetry response:`);
  console.log(`${JSON.stringify(resp, null, 2)}`.gray);
}

test()