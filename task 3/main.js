"use strict";

const { Client, XFER } = require('./client.js');
const net = require('./fakeNet.js');

// Alice تبدأ مع رصيد
let alice = new Client('Alice', net);
alice.ledger = { 'Alice': 400 };
alice.clients = { 'Alice': alice.keypair.public };

// ينضم Bob و Charlie
let bob = new Client('Bob', net);
let charlie = new Client('Charlie', net);

// Alice توزع المال
alice.give('Bob', 150);
alice.give('Charlie', 75);
bob.give('Charlie', 15);
console.log();

// Trudy تنضم
let trudy = new Client('Trudy', net);

// Trudy تحاول إنفاق مال لا تملكه
trudy.give('Bob', 150);
console.log();

// Trudy تحاول تزوير رسالة من Alice (بدون توقيع)
let msg = {
  from: 'Alice',
  to: 'Trudy',
  amount: 175,
};
net.broadcast(XFER, { message: msg }); // بدون توقيع حقيقي
console.log();

// عرض دفاتر الحسابات
alice.showLedger();
bob.showLedger();
charlie.showLedger();
trudy.showLedger();
