export interface MqttErrorMessage {
    [key: string]: string[];
}

export interface DeviceResponseMessage {
    success: boolean | string;
    message: string | MqttErrorMessage;
}
