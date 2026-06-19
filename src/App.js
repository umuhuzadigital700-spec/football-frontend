import React, { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import RefereeDashboard from './RefereeDashboard';
import FanVotingStage from './FanVotingStage';

const BACKEND_URL = "https://football-backend-ykso.onrender.com";

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

function App() {
  const [gameState, setGameState] = useState(null);
  const [myName, setMyName] = useState(localStorage.getItem('draftName') || '');
  const [myTxId, setMyTxId] = useState(localStorage.getItem('myTxId') || '');
  const [joined, setJoined] = useState(false);
  const [refToken, setRefToken] = useState('');
  const [isRef, setIsRef] = useState(false);
  const [newYoutube, setNewYoutube] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [localQRs, setLocalQRs] = useState(['', '', '', '', '', '']);
  const [activeSlot, setActiveSlot] = useState(null);
  const [lobbySearch, setLobbySearch] = useState('');
  const [roomPhase, setRoomPhase] = useState('LOBBY');
  // Voting gate mode selector (Ref only)
  const [votingModeSelect, setVotingModeSelect] = useState('BOTH');

  const isRefRef = useRef(isRef);
  useEffect(() => { isRefRef.current = isRef; }, [isRef]);

  useEffect(() => {
    function onGameStateUpdate(state) {
      setGameState(state);
      if (state.roomPhase) setRoomPhase(state.roomPhase);
      const sTx = localStorage.getItem('myTxId');
      const userInLobby = state.allViewers?.find(v => v.txId === sTx);
      if (userInLobby || isRefRef.current) setJoined(true);
      else setJoined(false);
      if (isRefRef.current && state.qrCodes) setLocalQRs(state.qrCodes);
    }

    function onConnect() {
      const sTx = localStorage.getItem('myTxId');
      const sName = localStorage.getItem('draftName');
      if (sTx && sName) socket.emit('joinWaitingRoom', { name: sName, ticketCode: sTx });
    }

    function onClearArenaForce() {
      localStorage.removeItem('myTxId');
      localStorage.removeItem('draftName');
      setJoined(false);
      setIsRef(false);
      setRoomPhase('LOBBY');
      window.location.reload();
    }

    function onGameSyncPhase(phase) {
      setRoomPhase(phase);
      setActiveSlot(null);
      if (phase === 'LOBBY' && !isRefRef.current) setJoined(true);
    }

    function onRefConfirm(val) {
      setIsRef(val);
      isRefRef.current = val;
      setJoined(true);
    }

    function onError(message) {
      alert(message);
    }

    socket.on('gameStateUpdate', onGameStateUpdate);
    socket.on('connect', onConnect);
    socket.on('clearArenaForce', onClearArenaForce);
    socket.on('gameSyncPhase', onGameSyncPhase);
    socket.on('refConfirm', onRefConfirm);
    socket.on('error', onError);
    onConnect();

    const fetchInterval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/state`);
        if (res.ok) onGameStateUpdate(await res.json());
      } catch (e) {
        console.warn("State polling failure:", e);
      }
    }, 3000);

    return () => {
      clearInterval(fetchInterval);
      socket.off('gameStateUpdate');
      socket.off('connect');
      socket.off('clearArenaForce');
      socket.off('gameSyncPhase');
      socket.off('refConfirm');
      socket.off('error');
    };
  }, []);

  const handleJoin = useCallback(() => {
    if (!myName || !myTxId) return alert('Uzuza imyirondoro yose (Fill all fields)');
    localStorage.setItem('draftName', myName);
    localStorage.setItem('myTxId', myTxId);
    socket.emit('joinWaitingRoom', { name: myName, ticketCode: myTxId });
  }, [myName, myTxId]);

  if (!gameState) {
    return <div style={{ padding: 32, textAlign: 'center' }}><p>Connecting to Arena...</p></div>;
  }

  if (!joined) {
    const filteredViewers = (gameState.allViewers || []).filter(v =>
      v.name?.toLowerCase().includes(lobbySearch.toLowerCase()) ||
      v.txId?.toLowerCase().includes(lobbySearch.toLowerCase())
    );
    return (
      <div style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
        <h2>🏟️ Arena Lobby</h2>
        <div style={{ marginTop: 12, padding: 12, background: '#fff8e1', border: '1px solid #f0c36d', borderRadius: 6, fontSize: 13, lineHeight: 1.5 }}>
          <strong>Notice:</strong> Enter your name and TDX-ID to join the arena. Your ticket will be verified before entry.
        </div>
        <div style={{ marginTop: 16 }}>
          <input placeholder="Izina ryawe (Your name)" value={myName} onChange={e => setMyName(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }} />
          <input placeholder="TDX-ID (11 digits)" value={myTxId} onChange={e => setMyTxId(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }} />
          <button onClick={handleJoin}
            style={{ width: '100%', padding: 12, background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            KWINJIRA
          </button>
        </div>
        <hr style={{ margin: '24px 0' }} />
        <div>
          <strong>Referee Login</strong>
          <input type="password" placeholder="Ref token" value={refToken} onChange={e => setRefToken(e.target.value)}
            style={{ display: 'block', width: '100%', margin: '8px 0', padding: 8 }} />
          <button onClick={() => socket.emit('claimReferee', refToken)}
            style={{ width: '100%', padding: 10, background: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Claim Referee
          </button>
        </div>
        {gameState.allViewers?.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <strong>Viewers ({gameState.allViewers.length})</strong>
            <input placeholder="Search viewers..." value={lobbySearch} onChange={e => setLobbySearch(e.target.value)}
              style={{ display: 'block', width: '100%', margin: '8px 0', padding: 6 }} />
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {filteredViewers.map(v => (
                <li key={v.id || v.txId} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                  {v.name} — <small>{v.role}</small>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const myViewer = gameState.allViewers?.find(v => v.txId === localStorage.getItem('myTxId'));
  // Spec §6: Fans see voting ONLY when votingAllowed is true — and only the mode opened
  const showVoting = gameState.votingAllowed || isRef;

  return (
    <div style={{ padding: 16 }}>
      {/* Arena Banner */}
      {gameState.arenaBanner && (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <img src={gameState.arenaBanner} alt="Arena Banner" style={{ maxWidth: '100%', maxHeight: 120 }} />
        </div>
      )}

      {/* Stream */}
      {gameState.youtubeLink && (
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <iframe width="100%" height="200" src={gameState.youtubeLink.replace('watch?v=', 'embed/')}
            title="Live Stream" frameBorder="0" allowFullScreen />
        </div>
      )}

      {/* Referee Control Panel */}
      {isRef && (
        <div style={{ background: '#fff3cd', padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {/* Media */}
          <div style={{ marginBottom: 8 }}>
            <strong>📺 YouTube Link</strong>
            <input value={newYoutube} onChange={e => setNewYoutube(e.target.value)} style={{ marginLeft: 8, padding: 6, width: 260 }} />
            <button onClick={() => socket.emit('refUpdateYoutube', newYoutube)} style={{ marginLeft: 8, padding: '6px 12px' }}>Set</button>
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>🖼️ Banner URL</strong>
            <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} style={{ marginLeft: 8, padding: 6, width: 260 }} />
            <button onClick={() => socket.emit('refUpdateBanner', bannerUrl)} style={{ marginLeft: 8, padding: '6px 12px' }}>Set</button>
          </div>

          {/* Room Phase Navigation (Spec §6 — non-destructive) */}
          <div style={{ marginTop: 12, padding: 10, background: '#e8eaf6', borderRadius: 6 }}>
            <strong>🔀 Room Phase Control</strong>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {['LOBBY', 'DRAFT', 'VOTING'].map(phase => (
                <button key={phase} onClick={() => socket.emit('refSetPhase', phase)}
                  style={{
                    padding: '6px 14px',
                    background: roomPhase === phase ? '#3a4cb0' : '#fff',
                    color: roomPhase === phase ? '#fff' : '#333',
                    border: '1px solid #3a4cb0', borderRadius: 4, cursor: 'pointer',
                    fontWeight: roomPhase === phase ? 'bold' : 'normal'
                  }}>
                  {phase}
                </button>
              ))}
            </div>
          </div>

          {/* Spec §6: Master Voting Gate + Mode Selector */}
          <div style={{ marginTop: 10, padding: 10, background: '#f3e5f5', borderRadius: 6 }}>
            <strong>🗳️ Voting Gate — {gameState.votingAllowed ? `🟢 OPEN (${gameState.votingMode})` : '🔴 LOCKED'}</strong>
            <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13 }}>Open Mode:</label>
              {['A', 'B', 'BOTH'].map(m => (
                <label key={m} style={{ fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="votingMode" value={m}
                    checked={votingModeSelect === m} onChange={() => setVotingModeSelect(m)} />{' '}{m}
                </label>
              ))}
              <button
                onClick={() => socket.emit('refToggleVotingGate', { allowed: !gameState.votingAllowed, mode: votingModeSelect })}
                style={{
                  padding: '6px 16px',
                  background: gameState.votingAllowed ? '#c62828' : '#2e7d32',
                  color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer'
                }}>
                {gameState.votingAllowed ? 'Lock Voting' : 'Open Voting'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#666', margin: '6px 0 0' }}>
              Fans see only the opened mode. Select A, B, or BOTH before opening.
            </p>
          </div>
        </div>
      )}

      {/* QR Codes */}
      {gameState.qrCodes?.some(q => q) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, justifyContent: 'center' }}>
          {gameState.qrCodes.map((q, i) => q ? <img key={i} src={q} alt={`QR ${i + 1}`} style={{ width: 80, height: 80 }} /> : null)}
        </div>
      )}
      {isRef && (
        <div style={{ marginBottom: 16 }}>
          {localQRs.map((q, i) => (
            <span key={i} style={{ marginRight: 8 }}>
              <input placeholder={`QR ${i + 1} URL`} value={q}
                onChange={e => { const u = [...localQRs]; u[i] = e.target.value; setLocalQRs(u); }}
                style={{ padding: 4, width: 180 }} />
            </span>
          ))}
          <button onClick={() => socket.emit('refUpdateQRs', localQRs)} style={{ marginTop: 4, padding: '6px 14px' }}>Update QRs</button>
        </div>
      )}

      {/* Referee Dashboard (manages isReferee guard internally) */}
      <RefereeDashboard
        socket={socket}
        gameState={gameState}
        isReferee={isRef}
        activeSlot={activeSlot}
        setActiveSlot={setActiveSlot}
      />

      {/* Spec §6: Fan Voting — only rendered when gate is open */}
      {showVoting && (
        <FanVotingStage
          socket={socket}
          gameState={gameState}
          myTxId={localStorage.getItem('myTxId') || ''}
          isReferee={isRef}
          votingMode={gameState.votingMode}
        />
      )}

      {/* Spectator view during DRAFT */}
      {gameState.gameStarted && !isRef && myViewer?.role === 'spectator' && roomPhase === 'DRAFT' && (
        <div style={{ marginTop: 24 }}>
          <h3>🏟️ Live Draft</h3>
          <p><strong>Current Turn:</strong> {gameState.currentTurn}</p>
          <p>T1 Picks: {gameState.team1Picks?.length || 0} / T2 Picks: {gameState.team2Picks?.length || 0}</p>
        </div>
      )}

      {/* Team player card picker — DRAFT phase only */}
      {gameState.gameStarted && myViewer?.role?.startsWith('team') && roomPhase === 'DRAFT' && (
        <div style={{ marginTop: 24 }}>
          <h3>Your Turn: {gameState.currentTurn === myViewer.role ? '✅ YOUR PICK' : '⏳ Waiting...'}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {gameState.availableCards?.map(card => (
              <button
                key={card.id || card.Id}
                disabled={gameState.currentTurn !== myViewer.role || gameState.matchLocked}
                onClick={() => socket.emit('playerPickCard', card.id || card.Id)}
                style={{ padding: '6px 10px', cursor: 'pointer', background: '#e8f5e9', border: '1px solid #388e3c', borderRadius: 4 }}>
                {card.Name || card.name || card.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
