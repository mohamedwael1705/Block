"use strict";

const crypto = require('crypto');
const XFER = 'XFER';

class Client {
  constructor(name, net) {
    this.name = name;
    this.net = net;
    this.ledger = {};
    this.clients = {};

    // توليد مفتاح عام/خاص
    this.keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    // التسجيل في الشبكة
    this.net.register(this.name, this);
  }

  give(to, amount) {
    if ((this.ledger[this.name] || 0) < amount) {
      console.log(`${this.name}: ❌ Not enough funds to send ${amount} to ${to}`);
      return;
    }

    const message = {
      from: this.name,
      to,
      amount,
    };

    const sig = crypto.sign("sha256", Buffer.from(JSON.stringify(message)), {
      key: this.keypair.private,
    });

    this.net.broadcast(XFER, {
      message,
      sig: sig.toString('hex'),
    });
  }

  receive(type, payload) {
    if (type === XFER) {
      this.handleXFER(payload);
    }
  }

  handleXFER({ message, sig }) {
    const { from, to, amount } = message;

    // تجاهل الرسائل بدون توقيع
    if (!sig || !this.clients[from]) {
      console.log(`${this.name}: ❌ Ignoring invalid or unsigned message from ${from}`);
      return;
    }

    const pub = this.clients[from];
    const isValid = crypto.verify(
      "sha256",
      Buffer.from(JSON.stringify(message)),
      pub,
      Buffer.from(sig, 'hex')
    );

    if (!isValid) {
      console.log(`${this.name}: ❌ Invalid signature from ${from}`);
      return;
    }

    // تحديث دفتر الحسابات
    if ((this.ledger[from] || 0) < amount) {
      console.log(`${this.name}: ❌ ${from} has insufficient funds`);
      return;
    }

    this.ledger[from] -= amount;
    this.ledger[to] = (this.ledger[to] || 0) + amount;

    // حفظ مفتاح المستلم إن لم يكن موجود
    if (!this.clients[to]) {
      this.clients[to] = pub;
    }

    console.log(`${this.name}: ✅ Transferred ${amount} from ${from} to ${to}`);
  }

  showLedger() {
    console.log(`📘 Ledger for ${this.name}:`, this.ledger);
  }
}

module.exports = { Client, XFER };
