const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');


const dbClient = new Client({
  user: 'bilal',
  host: '51.20.254.151',
  database: 'emindb',
  password: '123',
  port: 5432,
});

// PostgreSQL'e bağlan
dbClient.connect((err) => {
    if (err) {
        console.error('PostgreSQL bağlantı hatası:', err);
    } else {
        console.log('PostgreSQL veritabanına bağlanıldı.');
    }
});


// HiveMQ Cloud bilgileri
const brokerUrl = 'mqtts://8824e3a9df204b2098e07f76ba74b9aa.s1.eu.hivemq.cloud:8883';
const username = 'hivemq.webclient.1731763114191'; // HiveMQ Cloud kullanıcı adınız
const password = 'heKT$w@0517F*BI!Cgzl'; // HiveMQ Cloud şifreniz
const topic = 'test/topic'; // Dinlemek istediğiniz topic

const caFilePath = path.join(__dirname, 'hivemq_cloud_ca.pem');

const client = mqtt.connect(brokerUrl, {
    username,
    password,
    rejectUnauthorized: false 
});

client.on('connect', () => {
    console.log('HiveMQ Cloud brokerına bağlanıldı.');
    
    client.subscribe(topic, (err) => {
        if (err) {
            console.error('Abonelik hatası:', err);
        } else {
            console.log(`"${topic}" topic'ine abone olundu.`);
        }
    });
});

client.on('message', (topic, message) => {
    console.log(`Mesaj alındı - Topic: ${topic}, Mesaj: ${message.toString()}`);

    handleIncomingMessage(topic, message);
});

client.on('error', (err) => {
    console.error('Bağlantı hatası:', err);
});

function handleIncomingMessage(topic, message) {
    // Mesajı JSON olarak parse etmeye çalış
    try {
        const parsedMessage = JSON.parse(message.toString());
        console.log('Mesaj JSON formatında:', parsedMessage);

        // Her bir anahtar-değer çiftini işleme
        for (const [key, value] of Object.entries(parsedMessage)) {
            console.log(`Key: ${key}, Value: ${value}`);
        }

        const day = new Date().toISOString().split('T')[0];

        // Veriyi PostgreSQL'e kaydet
        const query = `
            INSERT INTO sensor_data (day, a, b, c, d, e, f)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const values = [
            day,
            parsedMessage.a,
            parsedMessage.b,
            parsedMessage.c,
            parsedMessage.d,
            parsedMessage.e,
            parsedMessage.f,
        ];

        dbClient.query(query, values);
        console.log('Veri PostgreSQL tablosuna kaydedildi.'); 
    } catch (e) {
        console.error('Mesaj JSON formatında değil:', message.toString());
    }
}