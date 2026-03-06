<?php

namespace App\Services;

use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;

class MqttService
{
    protected $client;

    public function __construct()
    {
        $server   = config('mqtt.host', '127.0.0.1');
        $port     = config('mqtt.port', 1883);
        $clientId = 'laravel-' . uniqid();
        $username = config('mqtt.username');
        $password = config('mqtt.password');

        $settings = (new ConnectionSettings)
            ->setUsername($username)
            ->setPassword($password)
            ->setKeepAliveInterval(60);

        $this->client = new MqttClient($server, $port, $clientId);
        $this->client->connect($settings, true);
    }

    public function publish(string $topic, array|string $payload, int $qos = 0)
    {
        if (is_array($payload)) {
            $payload = json_encode($payload);
        }

        $this->client->publish($topic, $payload, $qos);
        $this->client->disconnect();
    }
}
