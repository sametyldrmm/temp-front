const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

// HiveMQ Cloud bilgileri
const brokerUrl = 'mqtts://8824e3a9df204b2098e07f76ba74b9aa.s1.eu.hivemq.cloud:8883';
const username = 'hivemq.webclient.1731763114191'; // HiveMQ Cloud kullanıcı adınız
const password = 'heKT$w@0517F*BI!Cgzl'; // HiveMQ Cloud şifreniz
const topic = 'test/topic'; // Göndermek istediğiniz topic
const message = JSON.stringify({ a: 45, b: 54, c: 75, d: 5, e: 72, f: 100 }); // Yeni format

// Sertifika dosyası yolu (HiveMQ TLS sertifikasını indirin ve buraya ekleyin)
const caFilePath = path.join(__dirname, 'hivemq_cloud_ca.pem'); // Sertifika dosyasının tam yolu
const client = mqtt.connect(brokerUrl, {
    username,
    password,
    rejectUnauthorized: false // Sertifika doğrulamasını atla

    // ca: fs.readFileSync(caFilePath) // Sertifikayı burada belirttiğinizden emin olun
});


// MQTT bağlantı olayları
client.on('connect', () => {
    console.log('HiveMQ Cloud brokerına bağlanıldı.');

    // Mesaj gönder
    client.publish(topic, message, (err) => {
        if (err) {
            console.error('Mesaj gönderme hatası:', err);
        } else {
            console.log(`Mesaj gönderildi: ${message}`);
        }

        // Bağlantıyı kapatma (isteğe bağlı)
        client.end();
    });
});

client.on('error', (err) => {
    console.error('Bağlantı hatası:', err);
});
