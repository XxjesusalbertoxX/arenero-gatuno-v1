import express from 'express';
import amqp from 'amqplib';
import mqtt from 'mqtt';

const RABBITMQ_URL_MQTT = 'mqtt://rabbitmq:1883'; // Broker MQTT en "rabbitmq"
const RABBITMQ_URL_AMQP = 'amqp://admin:admin123@rabbitmq2:5672'; // Broker AMQP en "rabbitmq2"
const MQTT_TOPIC = 'sensorData';
const AMQP_QUEUE = 'authQueue';

// Conectar a RabbitMQ2 (AMQP) usando la API de promesas
amqp.connect(RABBITMQ_URL_AMQP)
  .then((connection) => connection.createChannel())
  .then((channel) => {
    // Aseguramos la existencia de la cola destino en RabbitMQ2
    channel.assertQueue(AMQP_QUEUE, { durable: false });

    // Conectar al broker MQTT (rabbitmq)
    const mqttClient = mqtt.connect(RABBITMQ_URL_MQTT, {
      username: 'admin',
      password: 'admin123',
    });

    mqttClient.on('connect', () => {
      console.log('[MQTT] Conectado al broker MQTT');
      mqttClient.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
          console.error('[MQTT] Error al suscribirse al topic:', err);
        } else {
          console.log(`[MQTT] Suscripción al topic '${MQTT_TOPIC}' exitosa`);
        }
      });
    });

    mqttClient.on('error', (error) => {
      console.error('[MQTT] Error:', error);
    });

    mqttClient.on('message', (topic, message) => {
      const msg = message.toString();
      console.log(`[MQTT] Mensaje recibido en el topic '${topic}': ${msg}`);

      // Enviar el mensaje a la cola de RabbitMQ2 (AMQP) para el auth-service
      channel.sendToQueue(AMQP_QUEUE, Buffer.from(msg));
      console.log(`[AMQP] Mensaje enviado a la cola '${AMQP_QUEUE}': ${msg}`);
    });
  })
  .catch((err) => {
    console.error('Error al conectar con RabbitMQ (AMQP):', err);
  });

// Arrancamos el API Gateway con Express (para tener una API REST, si lo requieres)
const app = express();
const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway corriendo en http://localhost:${port}`);
});
