import React, { useState } from 'react';
import { Cpu, Smartphone, Video, Server, ArrowRight, CheckCircle, Terminal, X, ShieldAlert } from 'lucide-react';

export default function CameraSetupGuide({ isOpen, onClose }) {
  const [selectedTab, setSelectedTab] = useState('android');

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Cpu size={20} className="text-white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Camera Ingestion Agnostic Pipeline</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Decoupled architecture: any camera hardware connects into MediaMTX and normalizes to standard HLS
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Architecture flow */}
          <div style={{
            background: '#090d16',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '1.25rem'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Decoupled Media Architecture
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
              gap: '0.5rem',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <div style={{ background: '#161f33', padding: '0.75rem', borderRadius: 8, border: '1px solid #334155' }}>
                <Smartphone size={18} className="text-emerald-400" style={{ margin: '0 auto 0.25rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>1. Any Camera</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Phone, PoE IP, Pi Cam, Sports Cam</div>
              </div>

              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>&rarr; RTSP / RTMP &rarr;</div>

              <div style={{ background: '#161f33', padding: '0.75rem', borderRadius: 8, border: '1px solid #10b981' }}>
                <Server size={18} className="text-cyan-400" style={{ margin: '0 auto 0.25rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#34d399' }}>2. MediaMTX</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Normalizes & segments to HLS fMP4</div>
              </div>

              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>&rarr; HLS stream &rarr;</div>

              <div style={{ background: '#161f33', padding: '0.75rem', borderRadius: 8, border: '1px solid #334155' }}>
                <Video size={18} className="text-purple-400" style={{ margin: '0 auto 0.25rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>3. Web Player</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>HLS.js / Safari native zero-barrier</div>
              </div>
            </div>
          </div>

          {/* Camera Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'android', label: 'Android Phone (IP Webcam)' },
              { id: 'poe', label: 'PoE IP Camera (Hikvision/Dahua)' },
              { id: 'picam', label: 'Raspberry Pi Cam 3' },
              { id: 'sports', label: 'Sports Cam (GoPro/RTMP)' },
              { id: 'synthetic', label: 'Simulated Camera (Dev)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`btn btn-sm ${selectedTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
            {selectedTab === 'android' && (
              <div>
                <h4 style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>
                  Using an Android Phone as a Sideline Pitch Camera
                </h4>
                <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li>Install <strong>IP Webcam</strong> (or <strong>Larix Broadcaster</strong>) from Google Play Store on any Android phone.</li>
                  <li>Mount phone on a tripod along the turf sideline and connect to the arena Wi-Fi.</li>
                  <li>In IP Webcam settings, set Video Resolution to 1080p (1920x1080) and Video Encoder to <strong>H.264</strong>.</li>
                  <li>Click <em>Start server</em>. The phone displays an RTSP address (e.g. <code>rtsp://192.168.1.150:8080/h264_pcm.sdp</code>).</li>
                  <li>In <code>mediamtx/mediamtx.yml</code>, configure MediaMTX to pull it:</li>
                </ol>
                <div style={{
                  background: '#090d16',
                  padding: '0.75rem',
                  borderRadius: 8,
                  marginTop: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#67e8f9'
                }}>
                  paths:<br />
                  &nbsp;&nbsp;turf1:<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;source: rtsp://192.168.1.150:8080/h264_pcm.sdp<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;sourceOnDemand: yes
                </div>
              </div>
            )}

            {selectedTab === 'poe' && (
              <div>
                <h4 style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>
                  Using a PoE ONVIF / RTSP Camera (Hikvision, Dahua, Reolink, Uniview)
                </h4>
                <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li>Connect standard PoE Ethernet cable from turf switch to the camera.</li>
                  <li>Set camera video encoding to <strong>H.264 Main/High Profile</strong> (avoid H.265 for direct browser HLS remuxing without CPU re-encoding).</li>
                  <li>Configure MediaMTX to automatically pull the camera's RTSP stream:</li>
                </ol>
                <div style={{
                  background: '#090d16',
                  padding: '0.75rem',
                  borderRadius: 8,
                  marginTop: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#67e8f9'
                }}>
                  paths:<br />
                  &nbsp;&nbsp;turf1:<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;source: rtsp://admin:TurfPass2026@192.168.1.120:554/Streaming/Channels/101<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;sourceOnDemand: yes
                </div>
              </div>
            )}

            {selectedTab === 'picam' && (
              <div>
                <h4 style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>
                  Raspberry Pi 4 / 5 with Pi Camera Module 3 (Wide Angle)
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  The Pi Camera Module 3 (Wide 120&deg; FOV) mounted high above the center line covers the entire turf pitch.
                  Run this single command on the Pi to stream hardware H.264 directly into MediaMTX:
                </p>
                <div style={{
                  background: '#090d16',
                  padding: '0.75rem',
                  borderRadius: 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#a7f3d0',
                  overflowX: 'auto'
                }}>
                  libcamera-vid -t 0 --inline --width 1920 --height 1080 --framerate 30 --codec h264 -o - | \<br />
                  ffmpeg -re -i - -c:v copy -f rtsp -rtsp_transport tcp rtsp://&lt;server-ip&gt;:8554/turf1
                </div>
              </div>
            )}

            {selectedTab === 'sports' && (
              <div>
                <h4 style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>
                  Sports Action Cameras (GoPro Hero, DJI Action, or Larix Broadcaster)
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Action cameras can broadcast RTMP directly over Wi-Fi:
                </p>
                <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li>In the GoPro Quik app, select <em>Live Stream &rarr; RTMP</em>.</li>
                  <li>Enter RTMP URL: <code>rtmp://&lt;your-server-ip&gt;:1935/turf1</code></li>
                  <li>MediaMTX instantly ingests the RTMP push and converts it to HLS for web viewers!</li>
                </ol>
              </div>
            )}

            {selectedTab === 'synthetic' && (
              <div>
                <h4 style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>
                  Local Synthetic Camera Generator (Included in this repo)
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  No physical camera is required to test full live streaming. Run this command in any terminal:
                </p>
                <div style={{
                  background: '#090d16',
                  padding: '0.75rem',
                  borderRadius: 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#67e8f9'
                }}>
                  # Synthetic live sports clock pattern<br />
                  node scripts/simulate-camera.js --turf turf1<br /><br />
                  # Or stream a real looped video file:<br />
                  node scripts/simulate-camera.js --turf turf1 --video /path/to/match.mp4
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
