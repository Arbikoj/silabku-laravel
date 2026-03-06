import type { DeviceResponseMessage } from '@/interface/MqttMessage';
import mqtt from 'mqtt';
import { useEffect, useRef, useState } from 'react';

export function useDeviceResponse(deviceId?: string) {
    const clientRef = useRef<mqtt.MqttClient | null>(null);
    const [lastMessage, setLastMessage] = useState<DeviceResponseMessage | null>(null);

    useEffect(() => {
        if (!deviceId) return;

        const host = import.meta.env.VITE_MQTT_HOST;
        const port = import.meta.env.VITE_MQTT_PORT;
        const username = import.meta.env.VITE_MQTT_USERNAME;
        const password = import.meta.env.VITE_MQTT_PASSWORD;
        const protocol = import.meta.env.VITE_MQTT_PROTOCOL || 'wss';

        const brokerUrl = `${protocol}://${host}:${port}/mqtt`;

        if (!clientRef.current) {
            clientRef.current = mqtt.connect(brokerUrl);
            clientRef.current.on('connect', () => console.log('✅ Connected to MQTT'));
            clientRef.current.on('error', (err) => console.error('❌ MQTT Error:', err));
        }

        const topic = `blbssync/${deviceId}/response`;
        clientRef.current.subscribe(topic);
        console.log(`📡 Subscribed to ${topic}`);

        clientRef.current.on('message', (t, msg) => {
            if (t === topic) {
                try {
                    const data: DeviceResponseMessage = JSON.parse(msg.toString());
                    setLastMessage(data);
                    console.log('📨 Response:', data);
                } catch (err) {
                    console.error('❌ Invalid JSON:', err);
                }
            }
        });

        return () => {
            if (clientRef.current) {
                clientRef.current.unsubscribe(topic);
                console.log(`🚪 Unsubscribed from ${topic}`);
            }
        };
    }, [deviceId]);

    return { lastMessage };
}
