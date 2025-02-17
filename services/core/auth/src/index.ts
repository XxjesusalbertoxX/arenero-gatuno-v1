import amqp from 'amqplib';

const RABBITMQ_URL = 'amqp://admin:admin123@rabbitmq2:5672';  // Conexión a RabbitMQ AMQP
const QUEUE = 'authQueue';  // La cola donde el API Gateway envía los datos

// Conectar a RabbitMQ usando la API de promesas
amqp.connect(RABBITMQ_URL)
  .then((connection) => connection.createChannel())
  .then((channel) => {
    channel.assertQueue(QUEUE, { durable: false });

    console.log('Esperando mensajes en la cola authQueue...');
    channel.consume(QUEUE, (msg) => {
      if (msg) {
        const messageContent = msg.content.toString();
        console.log(`Mensaje recibido en auth-service: ${messageContent}`);
      }
    }, { noAck: true });
  })
  .catch((err) => {
    console.error('Error al conectar con RabbitMQ:', err);
  });
