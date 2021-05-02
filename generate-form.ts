import crypto from 'crypto-js';
import Hex from 'crypto-js/enc-hex';
import fs from 'fs';

const msPerDay = 24 * 60 * 60 * 1000;
const awsAccessKeyId = process.env.AWS_ACCESS_KEY;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.BUCKET_NAME;
const region = process.env.REGION;
const expiration = new Date(Date.now() + msPerDay).toISOString();
const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const credentials = `${awsAccessKeyId}/${date}/${region}/s3/aws4_request`;

const policy = {
  expiration,
  conditions: [
    { bucket: bucketName },
    ['starts-with', '$key', 'uploads/'],
    { acl: 'public-read' },
    ['starts-with', '$Content-Type', 'image/png'],
    ['starts-with', '$success_action_status', ''],
    { 'x-amz-credential': credentials },
    { 'x-amz-algorithm': 'AWS4-HMAC-SHA256' },
    { 'x-amz-date': `${date}T000000Z` },
  ],
};

const getSignatureKey = (key, dateStamp, regionName, serviceName) => {
  const kDate = crypto.HmacSHA256(dateStamp, `AWS4${key}`);
  const kRegion = crypto.HmacSHA256(regionName, kDate);
  const kService = crypto.HmacSHA256(serviceName, kRegion);
  const kSigning = crypto.HmacSHA256('aws4_request', kService);
  return kSigning;
}

const bucketUrl = `https://${bucketName}.s3.amazonaws.com`;
const policyB64 = Buffer.from(JSON.stringify(policy), 'utf-8').toString('base64');
const sigKey = getSignatureKey(awsSecretAccessKey, date, region, 's3');
const signature = Hex.stringify(crypto.HmacSHA256(policyB64, sigKey));

fs.readFile('frontend/index.template.html', 'utf8', (err, input) => {
  if (err) {
    console.log(err);
  }

  const data = input
    .replace(/%BUCKET_URL%/g, bucketUrl)
    .replace(/%POLICY_BASE64%/g, policyB64)
    .replace(/%CREDENTIAL%/g, credentials)
    .replace(/%DATE%/g, `${date}T000000Z`)
    .replace(/%SIGNATURE%/g, signature);

  fs.writeFile('frontend/index.html', data, 'utf8', (e) => {
    if (e) {
      console.log(e);
    }
  });
});
