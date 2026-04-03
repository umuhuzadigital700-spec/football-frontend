import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://football-backend-ykso.onrender.com');

function App() {
  const [gameState, setGameState] = useState(null);
  const [myName, setMyName] = useState(localStorage.getItem('draftName') || "");
  const [myTxId, setMyTxId] = useState("");
  const [joined, setJoined] = useState(false);
  const [refToken, setRefToken] = useState("");
  const [isRef, setIsRef] = useState(false);
  const [newYoutube, setNewYoutube] = useState("");

  useEffect(() => {
    socket.on('gameStateUpdate', (state) => {
        setGameState(state);
        const savedTx = localStorage.getItem('myTxId');
        const verified = state.allViewers.find(v => v.name === myName && v.txId === savedTx);
        if (verified) setJoined(true);
    });
    socket.on('refConfirm', (val) => { setIsRef(val); setJoined(true); });
    socket.on('error', (msg) => { alert(msg); setJoined(false); });
    return () => socket.removeAllListeners();
  }, [myName]);

  const handleJoin = () => {
    if (!myName || !myTxId) return alert("Name and TxId required!");
    localStorage.setItem('draftName', myName);
    localStorage.setItem('myTxId', myTxId);
    socket.emit('joinWaitingRoom', { name: myName, ticketCode: myTxId });
  };

  if (!gameState) return <div style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Connecting...</div>;

  const myUser = gameState.allViewers.find(v => v.id === socket.id);
  const calculatePoints = (teamArray) => teamArray.reduce((sum, p) => sum + (parseInt(p.points) || 0), 0);

  return (
    <div style={{ backgroundColor: '#050505', color: '#eee', minHeight: '100vh', fontFamily: 'Arial' }}>
      
      {!joined && (
        <div style={{ textAlign: 'center', paddingTop: '80px' }}>
          <h1 style={{color: 'gold'}}>🏟️ RUHAGO N'INSHUTI ARENA</h1>
          <div style={{ background: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #333', display: 'inline-block' }}>
            <h2>ENTER THE ARENA</h2>
            <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Full Name" style={{padding: '12px', width: '250px'}} />
            <br/><br/>
            <input value={myTxId} onChange={e => setMyTxId(e.target.value)} placeholder="TxId Code" style={{padding: '12px', width: '250px', background: '#000', color: 'gold', border: '1px solid gold'}} />
            <br/><br/>
            <button onClick={handleJoin} style={{padding: '12px 30px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>VERIFY & ENTER</button>
            <p style={{fontSize: '0.8rem', color: '#666', marginTop: '10px'}}>Entrance: {gameState.lobbyOpen ? "🟢 Open" : "🔴 Closed"}</p>
          </div>
          <div style={{ marginTop: '60px', opacity: 0.5 }}>
            <input type="password" placeholder="Ref Token" onChange={e => setRefToken(e.target.value)} style={{padding: '8px'}}/>
            <button onClick={() => socket.emit('claimReferee', refToken)} style={{padding: '8px'}}>CLAIM REF</button>
          </div>
        </div>
      )}

      {joined && (
        <div style={{ padding: '20px' }}>
          {/* HEADER SECTION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#111', padding: '15px', borderRadius: '10px', borderBottom: '2px solid gold' }}>
            <div>
                <div style={{fontSize: '0.8rem', color: 'gold'}}>PLAYER: {isRef ? "👑 ERIC" : myName}</div>
                <div style={{fontSize: '1rem'}}>ROLE: {myUser?.role?.toUpperCase() || "SPECTATOR"}</div>
            </div>
            <div style={{textAlign: 'center'}}>
                <a href={gameState.youtubeLink} target="_blank" rel="noreferrer" style={{background: 'red', color: 'white', padding: '10px 20px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold'}}>▶️ WATCH LIVE ON YOUTUBE</a>
            </div>
            <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '0.8rem', color: 'gold'}}>LOBBY: {gameState.allViewers.length} ONLINE</div>
            </div>
          </div>

          {/* REFEREE PANEL */}
          {isRef && (
            <div style={{ background: '#1a1a1a', border: '1px solid gold', padding: '15px', marginTop: '10px', borderRadius: '10px' }}>
              <input value={newYoutube} onChange={e => setNewYoutube(e.target.value)} placeholder="Paste Youtube Link" style={{padding: '8px', width: '300px'}} />
              <button onClick={() => socket.emit('refUpdateYoutube', newYoutube)} style={{padding: '8px', marginLeft: '5px'}}>UPDATE LINK</button>
              <button onClick={() => socket.emit('refReset')} style={{marginLeft: '20px', background: 'blue', color: 'white', padding: '8px'}}>RESET GAME</button>
              
              <div style={{marginTop: '15px'}}>
                <select id="matchSize" style={{padding: '8px'}}><option value="1">1vs1</option><option value="11">11vs11</option></select>
                <button onClick={() => socket.emit('refStartDraft', { teamSize: parseInt(document.getElementById('matchSize').value) })} style={{marginLeft: '10px', background: 'gold', padding: '8px'}}>START DRAFT</button>
              </div>

              <div style={{marginTop: '10px', fontSize: '0.8rem'}}>
                Assign from Chat: {gameState.allViewers.map(v => (
                  <span key={v.id} style={{marginRight: '10px', padding: '5px', background: '#000'}}>
                    {v.name} <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team1'})}>T1</button>
                    <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team2'})}>T2</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* GAME BOARD */}
          {gameState.gameStarted && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              <div style={{ flex: 3 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
                  {gameState.availableCards.map(c => (
                    <div key={c.id} onClick={() => socket.emit('playerPickCard', c.id)} style={{ border: '1px solid #444', padding: '10px', width: '90px', cursor: myUser?.role === gameState.currentTurn ? 'pointer' : 'not-allowed', opacity: myUser?.role === gameState.currentTurn ? 1 : 0.4, background: '#222' }}>
                      <div style={{fontWeight: 'bold', fontSize: '0.8rem'}}>{c.name}</div>
                      <div style={{color: 'gold', fontSize: '0.7rem'}}>{c.pos}</div>
                      <div style={{color: '#00ff00', fontSize: '0.7rem'}}>{c.points} pts</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1.5 }}>
                <div style={{ background: '#111', padding: '10px', border: gameState.currentTurn === 'team1' ? '2px solid #00ff00' : '1px solid #333' }}>
                  <h4 style={{color: '#00ff00'}}>T1: {gameState.team1Player?.name || "???"} ({calculatePoints(gameState.team1Picks)} pts)</h4>
                  {gameState.team1Picks.map((p, i) => <div key={i} style={{fontSize: '0.7rem'}}>• {p.name}</div>)}
                </div>
                <div style={{ background: '#111', padding: '10px', marginTop: '10px', border: gameState.currentTurn === 'team2' ? '2px solid #ff4d4d' : '1px solid #333' }}>
                  <h4 style={{color: '#ff4d4d'}}>T2: {gameState.team2Player?.name || "???"} ({calculatePoints(gameState.team2Picks)} pts)</h4>
                  {gameState.team2Picks.map((p, i) => <div key={i} style={{fontSize: '0.7rem'}}>• {p.name}</div>)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default App;
