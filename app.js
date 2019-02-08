const { Credentials, SimpleSigner } = require('uport-credentials');
const JWT = require('did-jwt');
const { transport } = require('uport-transports');
const express = require('express');
const qrcode = require('qrcode-terminal');
const bodyParser = require('body-parser');
const message = require('uport-transports').message.util;
const decodeJWT = require('did-jwt').decodeJWT


const CONFIG2 = {
  HOST: 'https://58f987a0.ngrok.io', //add your ngrok
  ADDRESS: 'did:ethr:0x2a63bf05dc1895f6c0f4124a76071b7aede6b21f',
  PVT_KEY: 'e09a759ac1abff62d0d3003e0b81189743634a0c3e4d73e3ba5771e8dc70860a',
};

const app = express();
app.use(bodyParser());

/**
 * uPort initializations
 */
const credentials = new Credentials({
  appName: 'SAFBC SSI APP',
  did: CONFIG2.ADDRESS,
  privateKey: CONFIG2.PVT_KEY,
});

/**
 * Methods
 */
const generateRequest = async () => {
  const req = {
    requested: ['name', 'country'],
    verified: ['Attended_SAFBC_Stand'],
    callbackUrl: `${CONFIG2.HOST}/receive`,
    notifications: true,
  };

  try {
    const token = await credentials.createDisclosureRequest(req);
    console.log(decodeJWT(token))  //log request token to console
    const uri = message.paramsToQueryString(message.messageToURI(token), {callback_type: 'post'})
//    const uri = `me.uport:me?requestToken=${token}&callback_type=post`;
    qrcode.generate(uri, { small: true });
    console.log(uri);
  } catch (error) {
    console.error(error);
  }
};

const sendPush = async (pushToken, pubEncKey, request) => {
  const pushTransport = transport.push.send(pushToken, pubEncKey);
  pushTransport(request);
  console.log('Push notification sent.');
  console.log(decodeJWT(request));
  pushAttest();
};

const pushAttest = async (token) =>{
  const req ={
    verified: ['Attend_Blockchain_Africa_2019'],
    callbackUrl: `${CONFIG2.HOST}/attestInfo`
  };
try {
  const token = await credentials.createDisclosureRequest(req);
  const uri = message.paramsToQueryString(message.messageToURI(token), {callback_type: 'post'})
  qrcode.generate(uri, { small: true });
} catch (error) {
  console.error(error);
}
}

const attestreceive = async token =>{
  console.log('Attest Repsonse Received');
  try{
    console.log(decodeJWT(token));
    const response = await credentials.verifyDisclosure(token);
    const verifiedJWT = await JWT.verifyJWT(token, { audience: response.did });
    const authenticatedResponse = await credentials.authenticateDisclosureResponse(
      token,
    );
    console.log(verifiedJWT);
    console.log(authenticatedResponse);
  }catch (error) {
    console.error(error);
  }
}

const receive = async token => {
  console.log('Response received.');
  //console.log(decodeJWT(token))
  try {
    const response = await credentials.verifyDisclosure(token);
    const verification = await credentials.createVerification({
      sub: response.did,
      exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
      claim: { 'Attend_Blockchain_Africa_2019' : {Attended_SAFBC_Stand: 'SAFBC',
      'Date':  new Date(),
      'Venue': 'Wanderes'
     }},
    });
    await sendPush(response.pushToken, response.boxPub, verification);
  } catch (error) {
    console.error(error);
  }
};


const decodeAttestation = async token => {
  console.log('Attestation response received.');
  console.log(token);
  try {
    const response = await credentials.verifyDisclosure(token);
    const verifiedJWT = await JWT.verifyJWT(token, { audience: response.did });
    const authenticatedResponse = await credentials.authenticateDisclosureResponse(
      token,
    );

    console.log(verifiedJWT);
    console.log(authenticatedResponse);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Endpoints
 */
app.post('/receive', req => {
  receive(req.body.access_token);
});

app.post('/attest', (req, res) => {
  decodeAttestation(req.body.access_token);
  res.end('done');
});

app.post('/attestInfo', (req, res) => {
  attestreceive(req.body.access_token);
  res.end('done');
});

/**
 * Start app
 */
app.listen(5000);
console.log('Server started');
generateRequest();


