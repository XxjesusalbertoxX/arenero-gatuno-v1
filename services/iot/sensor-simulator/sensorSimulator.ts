import mqtt from 'mqtt';

console.log('Simulador de sensor arrancado...');

const brokerUrl = 'mqtt://rabbitmq:1883'; // Conexión al broker MQTT en el contenedor "rabbitmq"
const topic = 'sensorData';

// Función para simular datos de un sensor
const generateSensorData = () => {
  console.log('Simulador de sensor: generando datos...');
  return JSON.stringify({
    temperature: (Math.random() * 40).toFixed(2), // Temperatura simulada
    humidity: (Math.random() * 100).toFixed(2),   // Humedad simulada
    timestamp: new Date().toISOString(),          // Marca de tiempo
  });
};

const client = mqtt.connect(brokerUrl, {
  username: 'admin',
  password: 'admin123',
});

// Manejo de errores de conexión
client.on('error', (err) => {
  console.error('Error al conectar al broker MQTT:', err);
});

// Cuando se conecta, empieza a publicar datos cada 5 segundos
client.on('connect', () => {
  console.log('Simulador de sensor conectado al broker MQTT');
  setInterval(() => {
    const sensorData = generateSensorData();
    client.publish(topic, sensorData, {}, (err) => {
      if (err) {
        console.error('Error al publicar los datos del sensor:', err);
      } else {
        console.log(`Datos del sensor publicados: ${sensorData}`);
      }
    });
  }, 5000);
});

// Opcional: para futuros usos, manejo de mensajes entrantes
client.on('message', (topic, message) => {
  console.log(`Mensaje recibido en el topic ${topic}: ${message.toString()}`);
});
