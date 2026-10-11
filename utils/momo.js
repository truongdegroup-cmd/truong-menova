const crypto = require('crypto');
const https = require('https');

function signHmacSha256(data, key) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

function createPaymentRequest({ orderCode, amount, orderInfo }) {
  return new Promise((resolve, reject) => {
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const endpoint = process.env.MOMO_ENDPOINT;
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;

    const requestId = `${orderCode}-${Date.now()}`;
    const requestType = 'captureWallet';
    const extraData = '';

    const rawSignature =
      `accessKey=${accessKey}&amount=${Math.round(amount)}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}&orderId=${orderCode}&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = signHmacSha256(rawSignature, secretKey);

    const body = JSON.stringify({
      partnerCode,
      accessKey,
      requestId,
      amount: Math.round(amount),
      orderId: orderCode,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    });

    const url = new URL(endpoint);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 10000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Momo request timed out')));
    req.write(body);
    req.end();
  });
}

function verifyIpnSignature(payload) {
  const secretKey = process.env.MOMO_SECRET_KEY;
  const {
    accessKey = process.env.MOMO_ACCESS_KEY,
    amount,
    extraData,
    message,
    orderId,
    orderInfo,
    orderType,
    partnerCode,
    payType,
    requestId,
    responseTime,
    resultCode,
    transId,
    signature,
  } = payload;

  const rawSignature =
    `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
    `&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}` +
    `&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}` +
    `&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const checkSignature = signHmacSha256(rawSignature, secretKey);
  return checkSignature === signature;
}

module.exports = { createPaymentRequest, verifyIpnSignature };
