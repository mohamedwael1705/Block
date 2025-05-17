"use strict";

class FakeNet {
  constructor() {
    this.clients = {};
  }

  register(name, client) {
    this.clients[name] = client;

    // كل عميل يعرف المفاتيح العامة لكل العملاء الآخرين
    for (const otherName in this.clients) {
      if (otherName !== name) {
        this.clients[otherName].clients[name] = client.keypair.publicKey;
        client.clients[otherName] = this.clients[otherName].keypair.publicKey;
      }
    }
  }

  broadcast(type, payload) {
    // توصيل الرسالة لجميع العملاء المسجلين
    for (const name in this.clients) {
      this.clients[name].receive(type, payload);
    }
  }
}

module.exports = new FakeNet();
