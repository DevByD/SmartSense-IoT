"""
SmartSense IoT - MQTT Client Wrapper
Manages connection lifecycle, auto-reconnection, and publishing of validated sensor telemetry.
"""

import json
import time
from typing import Optional, Callable
import paho.mqtt.client as mqtt
from .utils.logger import logger


class SmartSenseMQTTClient:
    """
    Manages robust MQTT connection to broker and provides thread-safe telemetry publishing.
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 1883,
        client_id: str = "smartsense-pi-01-hardware",
        username: Optional[str] = None,
        password: Optional[str] = None,
        on_connect_callback: Optional[Callable] = None,
        on_disconnect_callback: Optional[Callable] = None,
    ):
        self.host = host
        self.port = port
        self.client_id = client_id
        self.username = username
        self.password = password
        self.on_connect_callback = on_connect_callback
        self.on_disconnect_callback = on_disconnect_callback

        self.is_connected = False
        self._client: Optional[mqtt.Client] = None
        self._init_client()

    def _init_client(self) -> None:
        """Initializes paho-mqtt client with version-agnostic callback protocol."""
        if hasattr(mqtt, "CallbackAPIVersion"):
            self._client = mqtt.Client(
                mqtt.CallbackAPIVersion.VERSION2,
                client_id=self.client_id,
                clean_session=True,
            )
        else:
            self._client = mqtt.Client(
                client_id=self.client_id,
                clean_session=True,
            )

        if self.username:
            self._client.username_pw_set(self.username, self.password)

        # Wire callbacks
        self._client.on_connect = self._handle_connect
        self._client.on_disconnect = self._handle_disconnect
        self._client.on_publish = self._handle_publish

    def _handle_connect(self, client, userdata, flags, rc, properties=None):
        """Callback triggered on successful broker connection."""
        # Handle paho-mqtt v1 (int rc) and v2 (ReasonCode object)
        rc_code = getattr(rc, "value", rc)
        if rc_code == 0:
            self.is_connected = True
            logger.info(f"MQTT CONNECTED to {self.host}:{self.port} (Client: {self.client_id})")
            if self.on_connect_callback:
                self.on_connect_callback()
        else:
            self.is_connected = False
            logger.error(f"MQTT Connection failed with return code {rc}")

    def _handle_disconnect(self, client, userdata, rc, properties=None):
        """Callback triggered on unexpected broker disconnect."""
        self.is_connected = False
        rc_code = getattr(rc, "value", rc) if rc is not None else 0
        if rc_code != 0:
            logger.warning(f"MQTT DISCONNECTED unexpectedly (rc={rc}). Auto-reconnecting in background...")
        else:
            logger.info("MQTT DISCONNECTED gracefully")

        if self.on_disconnect_callback:
            self.on_disconnect_callback()

    def _handle_publish(self, client, userdata, mid, reason_codes=None, properties=None):
        """Callback triggered when message is published."""
        pass

    def start(self) -> bool:
        """
        Connects to the broker and starts the background network loop.
        Returns:
            True if initial connection request succeeded, False otherwise.
        """
        try:
            logger.info(f"Connecting to MQTT broker at {self.host}:{self.port}...")
            self._client.connect_async(self.host, self.port, keepalive=60)
            self._client.loop_start()
            return True
        except Exception as e:
            logger.error(f"Failed to initiate MQTT connection to {self.host}:{self.port}: {e}")
            return False

    def publish_telemetry(self, topic: str, payload: dict, qos: int = 0) -> bool:
        """
        Serializes and publishes telemetry dictionary to specified topic.
        Returns:
            True if successfully queued/published, False otherwise.
        """
        if not self.is_connected:
            logger.warning(f"MQTT NOT CONNECTED. Cannot publish to {topic}")
            return False

        try:
            payload_str = json.dumps(payload)
            info = self._client.publish(topic, payload_str, qos=qos)
            if info.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"TELEMETRY PUBLISHED to {topic}")
                return True
            else:
                logger.error(f"MQTT publish failed with code {info.rc}")
                return False
        except Exception as e:
            logger.error(f"Exception during MQTT publish: {e}")
            return False

    def stop(self) -> None:
        """Stops background loop and disconnects client cleanly."""
        try:
            if self._client:
                self._client.loop_stop()
                self._client.disconnect()
        except Exception:
            pass
        self.is_connected = False
