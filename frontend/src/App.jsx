import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

import { Globe } from './components/Globe';
import { Dashboard } from './components/Dashboard';
import { useWebSocket } from './hooks/useWebSocket';

// Calculate time ago helper
const timeAgo = (startTime) => {
  const diff = Math.floor(Date.now() / 1000 - startTime);
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Connect to the Python FastAPI WebSocket endpoint
  const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws/attacks`;
  const { isConnected, attacks, latestAttack, stats } = useWebSocket(wsUrl);

  return (
    <div className="app">
      
      {/* Top Navigation Bar */}
      <header className="top-bar">
        <div className="top-bar__brand">
          <div className="top-bar__icon">🛡️</div>
          <div>
            <div className="top-bar__title">DDoS Intelligence Center</div>
            <div className="top-bar__subtitle">Global Threat Map (Simulated)</div>
          </div>
        </div>

        <div className="top-bar__status">
          <div className="status-indicator">
            <div className="status-dot" style={{ 
              background: isConnected ? 'var(--accent-green)' : 'var(--accent-red)',
              boxShadow: isConnected ? '0 0 8px var(--accent-green)' : '0 0 8px var(--accent-red)'
            }} />
            {isConnected ? 'NODE CONNECTED' : 'NODE DISCONNECTED'}
          </div>
          <div className="status-indicator" style={{ color: 'var(--accent-cyan)' }}>
            SYS.UPTIME {timeAgo(stats.startTime || (Date.now() / 1000))}
          </div>
        </div>
      </header>

      {/* Main 3D Canvas Context */}
      <div className="globe-container">
        <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
          <color attach="background" args={['#0a0e17']} />
          <ambientLight intensity={0.1} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            <Globe attacks={attacks} />
            <OrbitControls 
              enablePan={false}
              enableZoom={true}
              minDistance={6}
              maxDistance={25}
              autoRotate={!showDashboard}
              autoRotateSpeed={0.5}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Left-side Stats Overlay */}
      <div className={`stats-overlay ${showDashboard ? 'stats-overlay--visible' : ''}`}>
        <div className="stat-chip">
          <div style={{ marginRight: '16px' }}>⚡</div>
          <div>
            <div className="stat-chip__value" style={{ color: 'var(--accent-cyan)' }}>{stats.totalEvents.toLocaleString()}</div>
            <div className="stat-chip__label">Events Analyzed</div>
          </div>
        </div>
        
        <div className="stat-chip">
          <div style={{ marginRight: '16px' }}>🎯</div>
          <div>
            <div className="stat-chip__value" style={{ color: 'var(--accent-red)' }}>{stats.activeThreats}</div>
            <div className="stat-chip__label">Active Constraints</div>
          </div>
        </div>
        
        <div className="stat-chip">
          <div style={{ marginRight: '16px' }}>💥</div>
          <div>
            <div className="stat-chip__value" style={{ color: 'var(--accent-purple)' }}>{stats.peakGbps.toFixed(1)} Gbps</div>
            <div className="stat-chip__label">Peak Throughput</div>
          </div>
        </div>

        {/* Live Attack Feed */}
        <div className="card" style={{ marginTop: '20px', backgroundColor: 'rgba(15, 22, 35, 0.65)' }}>
          <div className="card__header" style={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
            <div className="card__title" style={{ fontSize: '10px' }}>LIVE STREAM</div>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {attacks.slice(0, 10).map(a => (
              <div key={a.attack_id} className={`feed-item feed-item--${a.severity_level.toLowerCase()}`}>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="feed-item__type">{a.attack_type.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{a.severity_level}</span>
                  </div>
                  <div className="feed-item__route">{a.source_country_code} → {a.destination_country_code}</div>
                  <div className="feed-item__metric">
                    {a.throughput_gbps} Gbps • {a.packet_rate_mpps} Mpps
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right-side Intelligence Dashboard Panel */}
      <Dashboard 
        isVisible={showDashboard} 
        latestAttack={latestAttack} 
        attacks={attacks} 
      />

      {/* Toggle Button */}
      <button 
        className={`toggle-btn ${showDashboard ? 'toggle-btn--active' : ''}`}
        onClick={() => setShowDashboard(!showDashboard)}
      >
        {showDashboard ? 'Close Intelligence Panel' : 'Show Attack Intelligence'}
      </button>

      {/* Disclaimer */}
      <div className="disclaimer">
        ACADEMIC SIMULATION ONLY • NO LIVE DATA • ALL TRAFFIC SYNTHETIC
      </div>

    </div>
  );
}

export default App;
