// src/RefereeDashboard.js
import React, { useState, useEffect, useCallback } from 'react';

const FORMATION_SLOTS = {
  '4-4-2': [
    { label: 'GK', top: 88, left: 50 }, { label: 'LB', top: 70, left: 15 },
    { label: 'CB1', top: 70, left: 35 }, { label: 'CB2', top: 70, left: 65 },
    { label: 'RB', top: 70, left: 85 }, { label: 'LM', top: 50, left: 15 },
    { label: 'CM1', top: 50, left: 35 }, { label: 'CM2', top: 50, left: 65 },
    { label: 'RM', top: 50, left: 85 }, { label: 'ST1', top: 25, left: 35 },
    { label: 'ST2', top: 25, left: 65 },
  ],
  '4-3-3': [
    { label: 'GK', top: 88, left: 50 }, { label: 'LB', top: 70, left: 15 },
    { label: 'CB1', top: 70, left: 35 }, { label: 'CB2', top: 70, left: 65 },
    { label: 'RB', top: 70, left: 85 }, { label: 'CM1', top: 50, left: 25 },
    { label: 'CM2', top: 50, left: 50 }, { label: 'CM3', top: 50, left: 75 },
    { label: 'LW', top: 20, left: 20 }, { label: 'ST', top: 15, left: 50 },
    { label: 'RW', top: 20, left: 80 },
  ],
  '3-5-2': [
    { label: 'GK', top: 88, left: 50 }, { label: 'CB1', top: 70, left: 25 },
    { label: 'CB2', top: 70, left: 50 }, { label: 'CB3', top: 70, left: 75 },
    { label: 'LWB', top: 52, left: 10 }, { label: 'CM1', top: 50, left: 30 },
    { label: 'CM2', top: 50, left: 50 }, { label: 'CM3', top: 50, left: 70 },
    { label: 'RWB', top: 52, left: 90 }, { label: 'ST1', top: 22, left: 35 },
    { label: 'ST2', top: 22, left: 65 },
  ],
  '4-5-1': [
    { label: 'GK', top: 88, left: 50 }, { label: 'LB', top: 70, left: 15 },
    { label: 'CB1', top: 70, left: 35 }, { label: 'CB2', top: 70, left: 65 },
    { label: 'RB', top: 70, left: 85 }, { label: 'LM', top: 50, left: 10 },
    { label: 'CM1', top: 50, left: 30 }, { label: 'CM2', top: 50, left: 50 },
    { label: 'CM3', top: 50, left: 70 }, { label: 'RM', top: 50, left: 90 },
    { label: 'ST', top: 18, left: 50 },
  ],
  '5-3-2': [
    { label: 'GK', top: 88, left: 50 }, { label: 'LWB', top: 68, left: 10 },
    { label: 'CB1', top: 70, left: 28 }, { label: 'CB2', top: 70, left: 50 },
    { label: 'CB3', top: 70, left: 72 }, { label: 'RWB', top: 68, left: 90 },
    { label: 'CM1', top: 48, left: 25 }, { label: 'CM2', top: 48, left: 50 },
    { label: 'CM3', top: 48, left: 75 }, { label: 'ST1', top: 22, left: 35 },
    { label: 'ST2', top: 22, left: 65 },
  ],
  '4-2-3-1': [
    { label: 'GK', top: 88, left: 50 }, { label: 'LB', top: 72, left: 15 },
    { label: 'CB1', top: 72, left: 35 }, { label: 'CB2', top: 72, left: 65 },
    { label: 'RB', top: 72, left: 85 }, { label: 'DM1', top: 57, left: 35 },
    { label: 'DM2', top: 57, left: 65 }, { label: 'LAM', top: 38, left: 20 },
    { label: 'CAM', top: 35, left: 50 }, { label: 'RAM', top: 38, left: 80 },
    { label: 'ST', top: 18, left: 50 },
  ],
};

function MiniPitch({ formation, tactics, teamLabel, color }) {
  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-4-2'];
  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '130%', background: 'linear-gradient(180deg,#1a6b2a 0%,#1e7a30 50%,#1a6b2a 100%)', border: '2px solid #fff', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.4)' }} />
        <div style={{ position: 'absolute', top: '44%', left: '25%', right: '25%', bottom: '3%', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: '2%', left: '25%', right: '25%', height: '10%', border: '1px solid rgba(255,255,255,0.3)' }} />
        <div style={{ position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-50%)', width: '20%', paddingBottom: '20%', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)' }} />
      </div>
      <div style={{ position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 10, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)', zIndex: 5 }}>{teamLabel}</div>
      <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 9, zIndex: 5 }}>{formation}</div>
      {slots.map((slot, idx) => {
        const player = tactics[idx];
        return (
          <div key={idx} style={{ position: 'absolute', top: `${slot.top}%`, left: `${slot.left}%`, transform: 'translate(-50%,-50%)', zIndex: 10, textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: player ? color : 'rgba(255,255,255,0.15)', border: `2px solid ${player ? '#fff' : 'rgba(255,255,255,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              {player ? (player.name || player.playerName || player.Name || '?').substring(0, 4) : slot.label.substring(0, 2)}
            </div>
            {player && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 7, padding: '1px 3px', borderRadius: 2, whiteSpace: 'nowrap', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}>
                {(player.name || player.playerName || player.Name || '').substring(0, 8)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RefereeDashboard({ socket, gameState, isReferee }) {
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [ballotData, setBallotData] = useState(null);
  const [viewingMatchId, setViewingMatchId] = useState(null);

  // ── Media state (banner, video, QR codes) ────────────────────────────────
  const [bannerUrl, setBannerUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [qrInputs, setQrInputs] = useState(['', '', '', '', '', '']);
  const [mediaSavedMsg, setMediaSavedMsg] = useState('');

  // ── Sheets state ──────────────────────────────────────────────────────────
  const [sheetsMsg, setSheetsMsg] = useState('');
  const [sheetsLoading, setSheetsLoading] = useState(false);

  // Sync inputs when game state arrives with existing values
  useEffect(() => {
    if (!gameState) return;
    if (gameState.arenaBanner) setBannerUrl(gameState.arenaBanner);
    if (gameState.youtubeLink) setYoutubeUrl(gameState.youtubeLink);
    if (Array.isArray(gameState.qrCodes)) {
      setQrInputs([...gameState.qrCodes, '', '', '', '', '', ''].slice(0, 6));
    }
  }, [gameState]);

  useEffect(() => {
    function onSaveAck({ success, matchId, sessionName, error }) {
      if (success) { setSaveStatus('ok'); setSaveError(''); }
      else { setSaveStatus('error'); setSaveError(error || 'Unknown error'); }
    }
    function onBallotData(data) { setBallotData(data); }
    function onSheetsLoaded({ count, error }) {
      setSheetsLoading(false);
      if (error) setSheetsMsg('❌ ' + error);
      else setSheetsMsg('✅ Loaded ' + count + ' items from Sheets');
      setTimeout(() => setSheetsMsg(''), 5000);
    }
    socket.on('refSaveLiveSession_ack', onSaveAck);
    socket.on('refMatchReady_ack', () => {});
    socket.on('refBallotData', onBallotData);
    socket.on('sheetsLoaded', onSheetsLoaded);
    return () => {
      socket.off('refSaveLiveSession_ack', onSaveAck);
      socket.off('refMatchReady_ack');
      socket.off('refBallotData', onBallotData);
      socket.off('sheetsLoaded', onSheetsLoaded);
    };
  }, [socket]);

  const handleAssignRole = useCallback((userId, role) => {
    socket.emit('refAssignRole', { userId, role });
  }, [socket]);

  // All hooks above — safe to early-return now
  if (!isReferee) return null;

  const gs = gameState;
  const t1Tactics = gs.team1Tactics || {};
  const t2Tactics = gs.team2Tactics || {};
  const votingMatches = gs.votingMatches || [];
  const typeAStats = gs.typeAStats || {};
  const typeBStats = gs.typeBStats || {};

  const panel = { background: '#111', border: '1px solid #2a2a3e', borderRadius: 8, padding: 14, marginBottom: 14 };
  const btn = (bg, disabled) => ({ background: disabled ? '#333' : bg, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: disabled ? 0.6 : 1, margin: '3px 4px 3px 0' });
  const inp = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #444', background: '#1a1a2e', color: '#eee', fontSize: 13, boxSizing: 'border-box', marginBottom: 6 };

  function handleSaveMedia() {
    if (bannerUrl.trim()) socket.emit('refSetBanner', bannerUrl.trim());
    if (youtubeUrl.trim()) socket.emit('refSetYoutube', youtubeUrl.trim());
    socket.emit('refSetQRCodes', qrInputs.map(q => q.trim()));
    setMediaSavedMsg('✅ Broadcast to all fans!');
    setTimeout(() => setMediaSavedMsg(''), 3000);
  }

  function handleLoadDraftCards() {
    setSheetsLoading(true);
    setSheetsMsg('⏳ Loading player names from Sheets...');
    socket.emit('refLoadDraftCards');
  }

  function handleLoadVotingMatches() {
    setSheetsLoading(true);
    setSheetsMsg('⏳ Loading Type B matches from Sheets...');
    socket.emit('refLoadFromSheets');
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, fontFamily: 'sans-serif', color: '#eee' }}>
      <h2 style={{ color: '#4fc3f7', marginBottom: 16 }}>🏟️ Referee Master Dashboard</h2>

      {/* ── ARENA MEDIA ── */}
      <div style={panel}>
        <h3 style={{ margin: '0 0 12px', color: '#f9a825' }}>🎬 Arena Media — Banner · Video · QR Codes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#aaa', display: 'block', marginBottom: 4 }}>🖼️ Banner Image URL</label>
            <input style={inp} value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://i.imgur.com/yourimage.jpg" />
            {bannerUrl.trim() !== '' && (
              <img
                src={bannerUrl.trim()}
                alt="Banner preview"
                style={{ width: '100%', maxHeight: 80, objectFit: 'cover', borderRadius: 4, marginBottom: 6, border: '1px solid #333' }}
                onError={e => { e.target.style.display = 'none'; }}
                onLoad={e => { e.target.style.display = 'block'; }}
              />
            )}
            <label style={{ fontSize: 12, color: '#aaa', display: 'block', marginBottom: 4 }}>▶️ YouTube / Video URL</label>
            <input style={inp} value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#aaa', display: 'block', marginBottom: 4 }}>📱 QR Code Image URLs (paste direct .jpg/.png link for each)</label>
            {qrInputs.map((qr, i) => (
              <input
                key={i}
                style={{ ...inp, marginBottom: 4 }}
                value={qr}
                onChange={e => { const u = [...qrInputs]; u[i] = e.target.value; setQrInputs(u); }}
                placeholder={`QR Code ${i + 1} — direct image URL`}
              />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <button style={btn('#00695c', false)} onClick={handleSaveMedia}>💾 Save &amp; Broadcast to All Fans</button>
          {mediaSavedMsg && <span style={{ color: '#66bb6a', fontSize: 13 }}>{mediaSavedMsg}</span>}
        </div>
        <p style={{ fontSize: 11, color: '#666', margin: '6px 0 0' }}>
          For QR images: upload to <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4fc3f7' }}>imgur.com</a> → right-click image → Copy image address (must end in .jpg or .png)
        </p>
      </div>

      {/* ── GOOGLE SHEETS ── */}
      <div style={panel}>
        <h3 style={{ margin: '0 0 10px', color: '#f9a825' }}>📊 Google Sheets Integration</h3>
        <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 10px' }}>
          Sheet IDs are pre-wired on the server. Click to pull latest data.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button style={btn('#1565c0', sheetsLoading)} onClick={handleLoadDraftCards} disabled={sheetsLoading}>
            🃏 Load Draft Cards (Player Names from Sheet)
          </button>
          <button style={btn('#6a1b9a', sheetsLoading)} onClick={handleLoadVotingMatches} disabled={sheetsLoading}>
            📋 Load Type B Matches (Voting Sheet Tabs)
          </button>
        </div>
        {sheetsMsg && (
          <div style={{ marginTop: 8, fontSize: 13, color: sheetsMsg.startsWith('✅') ? '#66bb6a' : sheetsMsg.startsWith('❌') ? '#ef5350' : '#f9a825' }}>
            {sheetsMsg}
          </div>
        )}
      </div>

      {/* ── ARENA CONTROLS ── */}
      <div style={panel}>
        <h3 style={{ margin: '0 0 10px', color: '#f9a825' }}>⚙️ Arena Controls</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button style={btn('#1565c0', false)} onClick={() => socket.emit('refStartDraft')}>🚀 Start Draft</button>
          <button style={btn('#6a1b9a', false)} onClick={() => { setSaveStatus(null); socket.emit('refRestart'); }}>🔄 Restart (Same Players)</button>
          <button style={btn('#4527a0', false)} onClick={() => { setSaveStatus(null); socket.emit('refReset'); }}>👥 Reset (New Players)</button>
          <button style={btn('#b71c1c', false)} onClick={() => { if (!window.confirm('⚠️ Clear entire arena? Purges ALL data.')) return; socket.emit('refClearArena'); }}>💥 Clear Arena (Full Purge)</button>
        </div>
      </div>

      {/* ── MATCH GATE ── */}
      {gs.gameStarted && (
        <div style={panel}>
          <h3 style={{ margin: '0 0 10px', color: '#f9a825' }}>🔒 Match Gate Controls</h3>
          <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 8px' }}>Lock Match freezes formations. Match Ready applies full positional lockout and enables Save.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button style={btn('#e65100', gs.matchLocked)} onClick={() => socket.emit('refLockMatch')} disabled={gs.matchLocked}>
              🔒 {gs.matchLocked ? 'Match Locked' : 'Lock Match'}
            </button>
            <button style={btn('#2e7d32', gs.matchReady)} onClick={() => { if (!window.confirm('Lock match as READY? Teams cannot move players after this.')) return; socket.emit('refMatchReady'); }} disabled={gs.matchReady}>
              ✅ {gs.matchReady ? 'Match Is Ready' : 'Mark Match Ready'}
            </button>
          </div>
        </div>
      )}

      {/* ── SAVE SESSION ── */}
      {gs.gameStarted && (
        <div style={panel}>
          <h3 style={{ margin: '0 0 6px', color: '#f9a825' }}>💾 Save Live Session for Voting</h3>
          <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 8px' }}>Saves canvas as a Type A match (MATCH-LIVE-NNN). Auto-named: <em>"Name / Team 1 vs Name / Team 2"</em>.</p>
          <button style={btn('#00838f', !gs.matchReady || saveStatus === 'saving')} onClick={() => { setSaveStatus('saving'); setSaveError(''); socket.emit('refSaveLiveSession'); }} disabled={!gs.matchReady || saveStatus === 'saving'}>
            {saveStatus === 'saving' ? '⏳ Saving...' : '💾 Save Live Session'}
          </button>
          {saveStatus === 'ok' && <span style={{ color: '#66bb6a', marginLeft: 10, fontSize: 13 }}>✅ Saved!</span>}
          {saveStatus === 'error' && <span style={{ color: '#ef5350', marginLeft: 10, fontSize: 13 }}>❌ {saveError}</span>}
          {!gs.matchReady && <p style={{ color: '#ff8f00', fontSize: 12, marginTop: 6 }}>⚠️ Mark match as Ready first.</p>}
        </div>
      )}

      {/* ── LIVE TACTICAL PITCH ── */}
      {gs.gameStarted && (
        <div style={panel}>
          <h3 style={{ margin: '0 0 12px', color: '#f9a825' }}>
            ⚽ Live Tactical Pitch — Side-by-Side
            {gs.matchReady && <span style={{ color: '#66bb6a', fontSize: 12, marginLeft: 10 }}>🔒 LOCKED</span>}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#42a5f5', marginBottom: 6 }}>🔵 {gs.team1Player?.name || 'Team 1'} — {gs.team1Picks?.length || 0}/11</div>
              <MiniPitch formation={gs.team1Formation || '4-4-2'} tactics={t1Tactics} teamLabel={gs.team1Player?.name || 'Team 1'} color="#1565c0" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef5350', marginBottom: 6 }}>🔴 {gs.team2Player?.name || 'Team 2'} — {gs.team2Picks?.length || 0}/11</div>
              <MiniPitch formation={gs.team2Formation || '4-4-2'} tactics={t2Tactics} teamLabel={gs.team2Player?.name || 'Team 2'} color="#b71c1c" />
            </div>
          </div>
        </div>
      )}

      {/* ── DRAFT PICK SUMMARY ── */}
      {gs.gameStarted && (
        <div style={panel}>
          <h3 style={{ margin: '0 0 10px', color: '#f9a825' }}>🃏 Draft Pick Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#42a5f5', fontWeight: 700, marginBottom: 4 }}>{gs.team1Player?.name || 'Team 1'} — {gs.team1Picks?.length || 0}/11</div>
              {(gs.team1Picks || []).map((c, i) => (
                <div key={i} style={{ fontSize: 11, padding: '2px 0', borderBottom: '1px solid #333' }}>
                  {c.name || c.playerName || c.Name || c.id}
                  {c.position && <span style={{ color: '#888', marginLeft: 6 }}>{c.position}</span>}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#ef5350', fontWeight: 700, marginBottom: 4 }}>{gs.team2Player?.name || 'Team 2'} — {gs.team2Picks?.length || 0}/11</div>
              {(gs.team2Picks || []).map((c, i) => (
                <div key={i} style={{ fontSize: 11, padding: '2px 0', borderBottom: '1px solid #333' }}>
                  {c.name || c.playerName || c.Name || c.id}
                  {c.position && <span style={{ color: '#888', marginLeft: 6 }}>{c.position}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CONNECTED USERS ── */}
      <div style={panel}>
        <h3 style={{ margin: '0 0 10px', color: '#f9a825' }}>👥 Connected Users ({(gs.allViewers || []).length})</h3>
        {(gs.allViewers || []).length === 0 && <div style={{ fontSize: 12, color: '#777' }}>No fans connected yet.</div>}
        {(gs.allViewers || []).map(v => (
          <div key={v.id} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '6px 0', borderBottom: '1px solid #333' }}>
            <span style={{ fontSize: 13, minWidth: 120 }}>{v.name}</span>
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 12, background: v.role === 'team1' ? '#1565c0' : v.role === 'team2' ? '#b71c1c' : '#444', color: '#fff' }}>{v.role}</span>
            {v.isPremium && <span style={{ fontSize: 10, color: '#ffd700' }}>⭐ VIP</span>}
            {!gs.gameStarted && (
              <>
                <button style={btn('#1565c0', false)} onClick={() => handleAssignRole(v.id, 'team1')}>→ T1</button>
                <button style={btn('#b71c1c', false)} onClick={() => handleAssignRole(v.id, 'team2')}>→ T2</button>
                <button style={btn('#555', false)} onClick={() => handleAssignRole(v.id, 'spectator')}>Spectator</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── VOTING MANAGEMENT ── */}
      <div style={panel}>
        <h3 style={{ margin: '0 0 10px', color: '#f9a825' }}>🗳️ Voting Match Management</h3>
        <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 8px' }}>Toggle matches OPEN to allow fans to vote. Saved sessions persist across resets.</p>
        <button style={btn('#00695c', false)} onClick={() => socket.emit('refRefreshVotingMatches')}>🔄 Refresh Matches</button>
        <div style={{ marginTop: 12 }}>
          {votingMatches.length === 0 && <div style={{ fontSize: 12, color: '#777' }}>No voting matches yet. Save a live session or load from Sheets.</div>}
          {votingMatches.map(m => {
            const isOpen = m.status === 'OPEN';
            const aStats = typeAStats[m.matchId];
            const bStats = typeBStats[m.matchId];
            return (
              <div key={m.matchId} style={{ background: '#0d0d1f', border: `1px solid ${isOpen ? '#2e7d32' : '#333'}`, borderRadius: 6, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: m.matchType === 'A' ? '#1565c0' : '#6a1b9a', color: '#fff', fontWeight: 700 }}>Type {m.matchType}</span>
                  <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>{m.matchId}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{m.name}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: isOpen ? '#2e7d32' : '#b71c1c', color: '#fff' }}>{isOpen ? '🟢 OPEN' : '🔴 CLOSED'}</span>
                  <button style={btn(isOpen ? '#b71c1c' : '#2e7d32', false)} onClick={() => socket.emit('refToggleVotingStatus', { matchId: m.matchId, newStatus: isOpen ? 'CLOSED' : 'OPEN' })}>
                    {isOpen ? 'Close' : 'Open'} Voting
                  </button>
                  <button style={btn('#333', false)} onClick={() => { setViewingMatchId(m.matchId); setBallotData(null); socket.emit('refGetBallots', { matchId: m.matchId }); }}>
                    📊 Ballots
                  </button>
                </div>
                {m.matchType === 'A' && aStats && (
                  <div style={{ fontSize: 12, color: '#aaa' }}>
                    🔵 {m.coach1 || 'Team 1'}: <strong style={{ color: '#42a5f5' }}>{aStats.team1Votes || 0}</strong> votes &nbsp;|&nbsp;
                    🔴 {m.coach2 || 'Team 2'}: <strong style={{ color: '#ef5350' }}>{aStats.team2Votes || 0}</strong> votes
                  </div>
                )}
                {m.matchType === 'B' && bStats && Object.keys(bStats).length > 0 && (
                  <div style={{ fontSize: 11, color: '#aaa', display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {Object.entries(bStats).map(([name, avg]) => (
                      <span key={name} style={{ background: '#1a1a2e', padding: '2px 6px', borderRadius: 4 }}>{name}: <strong style={{ color: '#f9a825' }}>{avg}</strong></span>
                    ))}
                  </div>
                )}
                {viewingMatchId === m.matchId && (
                  <div style={{ marginTop: 8, background: '#0a0a1a', borderRadius: 4, padding: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4fc3f7', marginBottom: 4 }}>Ballots — {m.matchId}</div>
                    {!ballotData && <div style={{ fontSize: 11, color: '#aaa' }}>⏳ Loading…</div>}
                    {ballotData && (!ballotData.ballots || ballotData.ballots.length === 0) && <div style={{ fontSize: 11, color: '#777' }}>No ballots yet.</div>}
                    {ballotData && (ballotData.ballots || []).map((b, i) => (
                      <div key={i} style={{ fontSize: 11, borderBottom: '1px solid #222', padding: '3px 0', color: '#ccc' }}>
                        {b.txId} {b.teamVote ? `→ ${b.teamVote}` : JSON.stringify(b.scores)}
                      </div>
                    ))}
                    <button style={{ ...btn('#333', false), marginTop: 6, fontSize: 11 }} onClick={() => { setViewingMatchId(null); setBallotData(null); }}>✖ Close</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RefereeDashboard;
