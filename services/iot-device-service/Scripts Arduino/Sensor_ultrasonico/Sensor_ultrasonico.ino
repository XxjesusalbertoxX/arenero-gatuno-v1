#include <HX711_ADC.h>
#include <WiFiNINA.h>
#include <PubSubClient.h>

// Configuración Wi-Fi
char ssid[] = "INFINITUM7C6A";        // Tu red Wi-Fi
char pass[] = "Ee5Rp7Jg6m";            // Tu contraseña Wi-Fi

// Configuración del broker MQTT (RabbitMQ)
const char* mqtt_server = "192.168.1.70";  // IP de tu computadora
const int mqtt_port = 1883;

WiFiClient wifiClient;
PubSubClient client(wifiClient);

long duration;
int distance;

// Pines de ultrasonido
const int trigPin = 9;
const int echoPin = 10;

// Pines de la celda de carga
const int DOUT_PIN = 7;
const int SCK_PIN = 6;

// Instancia de la celda de carga usando HX711_ADC
HX711_ADC scale(DOUT_PIN, SCK_PIN);

float lastWeight = 0;  // Último peso registrado
const float weightThreshold = 0.5;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  Serial.begin(9600);

  // Conectar a Wi-Fi
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);  // Espera por 1 segundo
  }
  Serial.println("Conectado al Wi-Fi");

  // Configurar el servidor MQTT
  client.setServer(mqtt_server, mqtt_port);

  // Intento de conexión al broker MQTT con usuario y contraseña
  while (!client.connected()) {
    Serial.print("Conectando al broker MQTT...");
    if (client.connect("ArduinoMKRClient", "admin", "admin123")) {
      Serial.println("Conectado al broker MQTT");
    } else {
      Serial.print("Fallo, rc=");
      Serial.print(client.state());
      Serial.println(" intentamos de nuevo en 5 segundos");
      delay(5000);
    }
  }

  // Inicializar y calibrar la celda de carga
  scale.begin();
  delay(1000);  // Dar tiempo para estabilizar la celda
  scale.start(2000);  // Estabilización inicial de 2 segundos
  scale.setCalFactor(2280.0);  // Factor de calibración
}

int sensor(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);

  int distance = duration * 0.03444 / 2;

  // Validar la distancia
  if (distance < 0 || distance > 400) {  // Suponiendo que el rango es de 0 a 400 cm
    distance = -1;  // Valor para indicar error
  }

  return distance;
}

void reconnect() {
  // Intentar la conexión hasta que se logre
  while (!client.connected()) {
    Serial.print("Conectando al broker MQTT...");
    if (client.connect("ArduinoMKRClient", "admin", "admin123")) {
      Serial.println("Conectado al broker MQTT");
    } else {
      Serial.print("Fallo, rc=");
      Serial.print(client.state());
      Serial.println(" intentamos de nuevo en 5 segundos");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  int distancia = sensor(trigPin, echoPin);

  // Si la distancia es válida, publicamos el mensaje
  if (distancia != -1) {
    String message = "Dato del sensor: " + String(distancia) + " cm";  
    client.publish("sensorData", message.c_str());
    Serial.print("Publicado: ");
    Serial.println(message);
  } else {
    Serial.println("Error en la medición del sensor.");
  }

  // Actualizar la celda de carga para obtener la lectura más reciente
  scale.update();

  float currentWeight = scale.getData();  // Obtener el peso actual

  if (abs(currentWeight - lastWeight) >= weightThreshold) {
    String message = "peso actual: " + String(currentWeight, 2) + " kg";
    client.publish("weightData", message.c_str());
    Serial.print("publicado: ");
    Serial.println(message);

    lastWeight = currentWeight;
  }

  delay(5000);
}
