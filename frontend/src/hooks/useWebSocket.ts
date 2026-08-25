import { useEffect, useRef, useState } from 'react';
import { VehicleEvent, Alert, Camera } from '../types';

interface UseWebSocketOptions {
  onVehicleEvent?: (event: VehicleEvent) => void;
  onAlert?: (alert: Alert) => void;
  onCameraStatus?: (status: any) => void;
}

export function useWebSocket({ onVehicleEvent, onAlert, onCameraStatus }: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const liveFeedWs = useRef<WebSocket | null>(null);
  const alertsWs = useRef<WebSocket | null>(null);
  const camerasWs = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsBase = `${protocol}//${host}`;

    // 1. Live Feed WS
    const connectLiveFeed = () => {
      try {
        const ws = new WebSocket(`${wsBase}/ws/live-feed`);
        ws.onopen = () => setIsConnected(true);
        ws.onmessage = (msg) => {
          try {
            const parsed = JSON.parse(msg.data);
            if (parsed.type === 'vehicle_event' && onVehicleEvent) {
              onVehicleEvent(parsed.data);
            }
          } catch (e) {
            console.error('WS JSON parse error:', e);
          }
        };
        ws.onclose = () => {
          setIsConnected(false);
          setTimeout(connectLiveFeed, 3000);
        };
        liveFeedWs.current = ws;
      } catch (e) {
        console.warn('WS live feed connection error, retrying...', e);
        setTimeout(connectLiveFeed, 3000);
      }
    };

    // 2. Alerts WS
    const connectAlerts = () => {
      try {
        const ws = new WebSocket(`${wsBase}/ws/alerts`);
        ws.onmessage = (msg) => {
          try {
            const parsed = JSON.parse(msg.data);
            if (parsed.type === 'alert' && onAlert) {
              onAlert(parsed.data);
            }
          } catch (e) {
            console.error('WS Alert parse error:', e);
          }
        };
        ws.onclose = () => setTimeout(connectAlerts, 3000);
        alertsWs.current = ws;
      } catch (e) {
        setTimeout(connectAlerts, 3000);
      }
    };

    // 3. Cameras WS
    const connectCameras = () => {
      try {
        const ws = new WebSocket(`${wsBase}/ws/cameras`);
        ws.onmessage = (msg) => {
          try {
            const parsed = JSON.parse(msg.data);
            if (parsed.type === 'camera_status' && onCameraStatus) {
              onCameraStatus(parsed.data);
            }
          } catch (e) {
            console.error('WS Camera parse error:', e);
          }
        };
        ws.onclose = () => setTimeout(connectCameras, 3000);
        camerasWs.current = ws;
      } catch (e) {
        setTimeout(connectCameras, 3000);
      }
    };

    connectLiveFeed();
    connectAlerts();
    connectCameras();

    return () => {
      liveFeedWs.current?.close();
      alertsWs.current?.close();
      camerasWs.current?.close();
    };
  }, []);

  return { isConnected };
}
