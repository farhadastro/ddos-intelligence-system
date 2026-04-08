import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage WebSocket connection for real-time attack events.
 * Handles auto-reconnection and buffering of recent events.
 */
export function useWebSocket(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [attacks, setAttacks] = useState([]);
  const [latestAttack, setLatestAttack] = useState(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeThreats: 0,
    peakGbps: 0,
  });

  const ws = useRef(null);
  const bufferRef = useRef([]);

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log('Connected to DDoS Intelligence Stream');
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from stream. Reconnecting in 3s...');
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (err) => {
        console.error('WebSocket Error:', err);
        ws.current.close();
      };

      ws.current.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data);
          
          setLatestAttack(event);
          
          // Avoid duplicates from WebSocket reconnect burst
          if (!bufferRef.current.some(a => a.attack_id === event.attack_id)) {
            bufferRef.current = [event, ...bufferRef.current].slice(0, 100); // Keep last 100
            setAttacks([...bufferRef.current]);
            
            setStats((prev) => ({
              totalEvents: prev.totalEvents + 1,
              activeThreats: bufferRef.current.filter(a => Date.now() / 1000 - a.timestamp < a.duration_seconds).length,
              peakGbps: Math.max(prev.peakGbps, event.throughput_gbps),
            }));
          }

        } catch (e) {
          console.error('Error parsing event data:', e);
        }
      };
    } catch (e) {
      console.error('Failed to connect:', e);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  // Keep connection alive with pings
  useEffect(() => {
    const interval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send('ping');
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isConnected, attacks, latestAttack, stats };
}
