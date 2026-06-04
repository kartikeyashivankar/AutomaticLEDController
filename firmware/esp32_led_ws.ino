#include <WiFi.h>
#include <WebSocketsServer.h>

// ─── WiFi Credentials ───
const char* ssid     = "JioFiber-S-4G";
const char* password = "04052004";

// ─── LED Pin Definitions ───
#define LED_RED    26
#define LED_GREEN  27
#define LED_YELLOW 14
#define LED_BLUE   12

WebSocketsServer webSocket(81);

// ─────────────────────────────────────────────
// WebSocket Event Handler
// ─────────────────────────────────────────────
void webSocketEvent(uint8_t num,
                    WStype_t type,
                    uint8_t * payload,
                    size_t length) {

  switch (type) {

    case WStype_CONNECTED:
      Serial.printf("[WS] Client %u Connected\n", num);
      break;

    case WStype_DISCONNECTED:
      Serial.printf("[WS] Client %u Disconnected\n", num);
      break;

    case WStype_TEXT: {

      String msg = String((char*)payload);

      Serial.println("--------------------------------");
      Serial.print("[WS] Raw Message: ");
      Serial.println(msg);

      int separator = msg.indexOf(':');

      if (separator == -1) {
        Serial.println("[ERROR] Invalid message format");
        return;
      }

      String command = msg.substring(0, separator);
      String color   = msg.substring(separator + 1);

      command.trim();
      color.trim();

      Serial.print("[CMD] ");
      Serial.println(command);

      Serial.print("[COLOR] ");
      Serial.println(color);

      bool turnOn = (command == "ON");

      int pin = -1;

      if (color == "red") {
        pin = LED_RED;
      }
      else if (color == "green") {
        pin = LED_GREEN;
      }
      else if (color == "yellow") {
        pin = LED_YELLOW;
      }
      else if (color == "blue") {
        pin = LED_BLUE;
      }

      if (pin == -1) {
        Serial.println("[ERROR] Unknown color");
        return;
      }

      digitalWrite(pin, turnOn ? HIGH : LOW);

      Serial.print("[LED] ");
      Serial.print(color);
      Serial.print(" -> ");
      Serial.println(turnOn ? "ON" : "OFF");

      break;
    }

    default:
      break;
  }
}

// ─────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────
void setup() {

  Serial.begin(115200);
  delay(1000);

  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);

  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_BLUE, LOW);

  Serial.println();
  Serial.println("[WiFi] Connecting...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("[WiFi] Connected");
  Serial.print("[WiFi] IP Address: ");
  Serial.println(WiFi.localIP());

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  Serial.println("[WS] Server Started");
  Serial.print("[WS] URL: ws://");
  Serial.print(WiFi.localIP());
  Serial.println(":81");
}

// ─────────────────────────────────────────────
// Loop
// ─────────────────────────────────────────────
void loop() {
  webSocket.loop();
}