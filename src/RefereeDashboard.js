import React, { useState, useEffect, useCallback } from 'react';

function RefereeDashboard({ socket, gameState, isReferee, activeSlot, setActiveSlot }) {
  const [matchInput1, setMatchInput1] = useState('');
  const [matchInput2, setMatchInput2] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (gameState?.team1Player?.name) setMatchInput1(gameState.team1Player.name);
    if (gameState?.team2Player?.name) setMatchInput2(gameState.team2Player.name);
  }, [gameState?.team1Player?.name, gameState?.team2Player?.name]);

  useEffect(() => {
    function onSaveAck({ success, matchId, error }) {
      if (success) {
        setSaveStatus('ok');
        setSaveError('');
      } else {
        setSaveStatus('error');
        setSaveError(error || 'Unknown error');
      }
    }

    socket.on('refSaveLiveSession_ack', onSaveAck);
    return () => socket.off('refSaveLiveSession_ack');
  }, [socket]);

  const handleAssignRole = useCallback((userId, role) => {
    socket.emit('refAssignRole', { userId, role });
  }, [socket]);

  const handleSetFormation = useCallback((team, formation) => {
    // Reserved if you later decide to add referee-side formation control.
  }, []);

  // 🟢 CRITICAL DEPLOYMENT FIX: Guard check is moved AFTER all React hooks have run
  if (!isReferee) return null;

  const gs = gameState;

  const handleStartDraft = () => {
    socket.emit('refStartDraft');
  };

  const handleReset = () => {
    setSaveStatus(null);
    setSaveError('');
    socket.emit('refReset');
  };

  const handleClearArena = () => {
    if (!window.confirm('Clear the entire arena? This will disconnect all fans.')) return;
    socket.emit('refClearArena');
  };

  const handleLockMatch = () => {
    socket.emit('refLockMatch');
  };

  const handleSaveSession = () => {
    setSaveStatus('saving');
    setSaveError('');
    socket.emit('refSaveLiveSession');
  };

  const handlePickCard = (cardId) => {
    // Referees do not pick cards directly.
  };

  const handleSetPosition = (cardId, slotIndex) => {
    socket.emit('playerSetPosition', { cardId, slotIndex });
  };

  return (
    <div
      style={{
        background: '#f0f4ff',
        border: '2px solid #3a4cb0',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24
      }}
    >
      <h2 style={{ margin: '0 0 12px' }}>🎮 Referee Dashboard</h2>

      <section style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Draft Controls</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleStartDraft}
            disabled={gs.gameStarted}
            style={{
              padding: '8px 16px',
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: gs.gameStarted ? 'default' : 'pointer',
              opacity: gs.gameStarted ? 0.5 : 1
            }}
          >
            ▶ Start Draft
          </button>

          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              background: '#e65100',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            🔄 Reset Draft
          </button>

          <button
            onClick={handleLockMatch}
            disabled={gs.matchLocked || !gs.gameStarted}
            style={{
              padding: '8px 16px',
              background: '#1565c0',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              opacity: gs.matchLocked || !gs.gameStarted ? 0.5 : 1
            }}
          >
            🔒 Lock Match
          </button>

          <button
            onClick={handleClearArena}
            style={{
              padding: '8px 16px',
              background: '#b71c1c',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            💥 Clear Arena
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <span style={{ marginRight: 16 }}>
            Status: <strong>{gs.gameStarted ? (gs.matchLocked ? '🔒 Locked' : '🟢 Active') : '⏸ Lobby'}</strong>
          </span>
          <span>
            Turn: <strong>{gs.currentTurn}</strong>
          </span>
        </div>
      </section>

      <section
        style={{
          marginBottom: 16,
          background: '#fff',
          borderRadius: 6,
          padding: 12,
          border: '1px solid #c3cce8'
        }}
      >
        <h3 style={{ margin: '0 0 8px' }}>Save to Voting Engine</h3>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>
          Saves the current locked canvas as a votable match. Does NOT reset the draft.
        </p>

        <button
          onClick={handleSaveSession}
          disabled={!gs.matchLocked || saveStatus === 'saving'}
          style={{
            padding: '8px 18px',
            background: '#6a1b9a',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            opacity: !gs.matchLocked || saveStatus === 'saving' ? 0.5 : 1
          }}
        >
          {saveStatus === 'saving' ? '⏳ Saving…' : '💾 Save Live Session'}
        </button>

        {saveStatus === 'ok' && (
          <span style={{ marginLeft: 12, color: '#2e7d32', fontWeight: 'bold' }}>
            ✅ Saved successfully!
          </span>
        )}

        {saveStatus === 'error' && (
          <span style={{ marginLeft: 12, color: '#c62828', fontWeight: 'bold' }}>
            ❌ Error: {saveError}
          </span>
        )}

        {!gs.matchLocked && (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888' }}>
            Lock the match first to enable saving.
          </p>
        )}
      </section>

      <section style={{ marginBottom: 16 }}>
        <h3>Viewer Management ({gs.allViewers?.length || 0} connected)</h3>
        <div
          style={{
            maxHeight: 200,
            overflowY: 'auto',
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: 8
          }}
        >
          {(gs.allViewers || []).map(v => (
            <div
              key={v.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 0',
                borderBottom: '1px solid #eee'
              }}
            >
              <span style={{ flex: 1 }}>
                {v.name} <small style={{ color: '#888' }}>({v.role})</small>
              </span>
              <button onClick={() => handleAssignRole(v.id, 'team1')} style={{ padding: '2px 8px', fontSize: 12 }}>
                T1
              </button>
              <button onClick={() => handleAssignRole(v.id, 'team2')} style={{ padding: '2px 8px', fontSize: 12 }}>
                T2
              </button>
              <button onClick={() => handleAssignRole(v.id, 'spectator')} style={{ padding: '2px 8px', fontSize: 12 }}>
                Spec
              </button>
            </div>
          ))}
        </div>
      </section>

      {gs.gameStarted && (
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#e3f2fd', borderRadius: 6, padding: 10 }}>
            <strong>Team 1 — {gs.team1Player?.name || 'Unassigned'}</strong>
            <p style={{ margin: '4px 0', fontSize: 12 }}>Picks: {gs.team1Picks?.length || 0} / 11</p>
            <p style={{ margin: 0, fontSize: 12 }}>Formation: {gs.team1Formation}</p>
          </div>

          <div style={{ background: '#fce4ec', borderRadius: 6, padding: 10 }}>
            <strong>Team 2 — {gs.team2Player?.name || 'Unassigned'}</strong>
            <p style={{ margin: '4px 0', fontSize: 12 }}>Picks: {gs.team2Picks?.length || 0} / 11</p>
            <p style={{ margin: 0, fontSize: 12 }}>Formation: {gs.team2Formation}</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default RefereeDashboard;
