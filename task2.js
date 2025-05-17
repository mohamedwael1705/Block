"use strict";
// required: npm install blind-signatures
const blindSignatures = require('blind-signatures');

const { Coin, COIN_RIS_LENGTH, IDENT_STR, BANK_STR } = require('./coin.js');
const utils = require('./utils.js');

// توليد مفتاح البنك
const BANK_KEY = blindSignatures.keyGeneration({ b: 2048 });
const N = BANK_KEY.keyPair.n.toString();
const E = BANK_KEY.keyPair.e.toString();

/**
 * البنك يوقع العملة المظللة
 */
function signCoin(blindedCoinHash) {
  return blindSignatures.sign({
    blinded: blindedCoinHash,
    key: BANK_KEY,
  });
}

/**
 * تحليل العملة إلى نصفَي سلسلة الهوية
 */
function parseCoin(s) {
  let [cnst, amt, guid, leftHashes, rightHashes] = s.split('-');
  if (cnst !== BANK_STR) {
    throw new Error(`Invalid identity string: ${cnst} received, but ${BANK_STR} expected`);
  }
  let lh = leftHashes.split(',');
  let rh = rightHashes.split(',');
  return [lh, rh];
}

/**
 * التاجر يقبل العملة، يختار نصف من سلسلة الهوية للتحقق
 */
function acceptCoin(coin) {
  // 1. التحقق من صحة التوقيع
  const isValid = blindSignatures.verify({
    unblinded: coin.signature,
    N: coin.N,
    E: coin.E,
    message: coin.unblindedMessage
  });

  if (!isValid) {
    throw new Error("Invalid signature on coin!");
  }

  // 2. تحليل سلسلة الهوية
  let [left, right] = parseCoin(coin.unblindedMessage);

  // 3. اختيار عشوائي لجهة واحدة من الهوية
  let ris = (Math.random() < 0.5) ? left : right;

  return ris;
}

/**
 * في حالة الإنفاق المزدوج، حدد من هو المخادع
 */
function determineCheater(guid, ris1, ris2) {
  for (let i = 0; i < ris1.length; i++) {
    if (ris1[i] !== ris2[i]) {
      // حساب XOR بين العنصرين المختلفين
      let buf1 = Buffer.from(ris1[i], 'hex');
      let buf2 = Buffer.from(ris2[i], 'hex');

      let xor = Buffer.alloc(buf1.length);
      for (let j = 0; j < buf1.length; j++) {
        xor[j] = buf1[j] ^ buf2[j];
      }

      let xorStr = xor.toString();
      if (xorStr.startsWith(IDENT_STR_
