import React from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis
} from 'recharts';
import { CountrySelector } from './CountrySelector';

export function Dashboard({ isVisible, latestAttack, attacks }) {
  if (!latestAttack) return null;

  // Prepare chart data from recent buffer
  const chartData = [...attacks].reverse().slice(-30).map((a, i) => ({
    time: i,
    gbps: a.throughput_gbps,
    mpps: a.packet_rate_mpps,
  }));

  const sevClass = `severity-badge--${latestAttack.severity_level.toLowerCase()}`;
  
  return (
    <div className={`dashboard ${isVisible ? 'dashboard--visible' : ''}`}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>Threat Overview</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Event ID: {latestAttack.attack_id.split('-')[0]}</div>
        </div>
        <div className={`severity-badge ${sevClass}`}>
          {latestAttack.severity_level}
        </div>
      </div>

      {/* Vector Analysis */}
      <div className="card">
        <div className="card__header">
          <div className="card__icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)' }}>⚠️</div>
          <div className="card__title">Attack Vector Analysis</div>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <span className={`attack-tag attack-tag--${latestAttack.attack_category}`}>
            {latestAttack.attack_layer} — {latestAttack.attack_category.toUpperCase()}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {latestAttack.attack_type.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Target Infrastructure</span>
          <span className="metric-value">{latestAttack.target_infrastructure}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Botnet Signature</span>
          <span className="metric-value">{latestAttack.botnet_type}</span>
        </div>
      </div>

      {/* Traffic Metrics */}
      <div className="card">
        <div className="card__header">
          <div className="card__icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' }}>📊</div>
          <div className="card__title">Traffic Volume Matrix</div>
        </div>

        <div className="metric-row">
          <span className="metric-label">Throughput Volume</span>
          <span className="metric-value metric-value--red">{latestAttack.throughput_gbps} Gbps</span>
        </div>
        <div className="gauge">
          <div className="gauge__fill gauge__fill--red" style={{ width: `${Math.min(100, (latestAttack.throughput_gbps / 800) * 100)}%` }} />
        </div>

        <div className="metric-row" style={{ marginTop: '12px' }}>
          <span className="metric-label">Packet Rate</span>
          <span className="metric-value metric-value--yellow">{latestAttack.packet_rate_mpps} Mpps</span>
        </div>
        <div className="gauge">
          <div className="gauge__fill gauge__fill--yellow" style={{ width: `${Math.min(100, (latestAttack.packet_rate_mpps / 100) * 100)}%` }} />
        </div>

        {latestAttack.requests_per_second > 0 && (
          <>
            <div className="metric-row" style={{ marginTop: '12px' }}>
              <span className="metric-label">Request Rate</span>
              <span className="metric-value metric-value--cyan">{latestAttack.requests_per_second.toLocaleString()} RPS</span>
            </div>
            <div className="gauge">
              <div className="gauge__fill gauge__fill--cyan" style={{ width: `${Math.min(100, (latestAttack.requests_per_second / 500000) * 100)}%` }} />
            </div>
          </>
        )}

        <div className="mini-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorGbps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin', 'dataMax + 50']} />
              <Area 
                type="monotone" 
                dataKey="gbps" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorGbps)" 
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Origin Intelligence */}
      <div className="card">
        <div className="card__header">
          <div className="card__icon" style={{ background: 'rgba(167, 139, 250, 0.15)', color: 'var(--accent-purple)' }}>🌐</div>
          <div className="card__title">Geographic Intelligence</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ORIGIN</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-red)' }}>{latestAttack.source_country}</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>→</div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TARGET</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-green)' }}>{latestAttack.destination_country}</div>
          </div>
        </div>
      </div>

      {/* Mitigation Simulation */}
      <div className="card">
        <div className="card__header">
          <div className="card__icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--accent-green)' }}>🛡️</div>
          <div className="card__title">Mitigation Status</div>
        </div>

        <div className="metric-row">
          <span className="metric-label">Cleaned Traffic</span>
          <span className="metric-value metric-value--green">{latestAttack.mitigation.clean_traffic_gbps} Gbps</span>
        </div>
        <div className="gauge">
          <div className="gauge__fill gauge__fill--green" style={{ width: `${latestAttack.mitigation.mitigation_rate}%` }} />
        </div>

        <div className="metric-row" style={{ marginTop: '10px' }}>
          <span className="metric-label">Blocked Malicious</span>
          <span className="metric-value metric-value--purple">{latestAttack.mitigation.blocked_traffic_gbps} Gbps</span>
        </div>
        <div className="metric-row" style={{ marginTop: '10px' }}>
          <span className="metric-label">Latency Impact</span>
          <span className="metric-value">{latestAttack.mitigation.latency_impact_ms} ms</span>
        </div>
      </div>

      {/* Interactive Control */}
      <CountrySelector />

    </div>
  );
}
