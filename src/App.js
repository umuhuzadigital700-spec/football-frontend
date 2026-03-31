import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://football-backend-ykso.onrender.com');

function App() {
  const [gameState, setGameState] = useState(null);
  const [myName, setMyName] = useState(localStorage.getItem('draftName') || "");
  const [joined, setJoined] = useState(false);
  const [refToken, setRefToken] = useState("");
  const [isRef, setIsRef] = useState(false);

  useEffect(() => {
    socket.on('gameStateUpdate', (state) => setGameState(state));
    socket.on('refConfirm', (val) => { setIsRef(val); setJoined(true); });
    socket.on('error', (msg) => alert(msg));
    return () => socket.removeAllListeners();
  }, []);

  const handleJoin = () => {
    if (!myName) return alert("Enter Name");
    localStorage.setItem('draftName', myName);
    socket.emit('joinWaitingRoom', { name: myName });
    setJoined(true);
  };

  if (!gameState) return <div style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Connecting to Kigali Arena...</div>;

  const myUser = gameState.allViewers.find(v => v.id === socket.id);

  return (
    <div style={{ backgroundColor: '#050505', color: '#eee', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* 1. SEPARATE LOGIN UNIQUE PATHS */}
      {!joined && (
        <div style={{ textAlign: 'center', paddingTop: '80px' }}>
          <h1 style={{color: 'gold'}}>🏟️ KIGALI DRAFT ARENA</h1>
          <div style={{ background: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #333', display: 'inline-block' }}>
            <h2>SPECTATOR ENTRANCE</h2>
            <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Enter Full Name" style={{padding: '12px', width: '250px'}} />
            <br/><br/>
            <button onClick={handleJoin} style={{padding: '12px 30px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer'}}>JOIN LOBBY</button>
            <p style={{fontSize: '0.8rem', color: '#666', marginTop: '10px'}}>
                Status: {gameState.lobbyOpen ? "🟢 Entrance Open" : "🔴 Entrance Closed"}
            </p>
          </div>
          <div style={{ marginTop: '60px', opacity: 0.6 }}>
            <p>Referee Portal Only</p>
            <input type="password" placeholder="Authority ID" onChange={e => setRefToken(e.target.value)} style={{padding: '8px', background: '#222', border: '1px solid #444', color: 'white'}}/>
            <button onClick={() => socket.emit('claimReferee', refToken)} style={{padding: '8px', marginLeft: '5px'}}>CLAIM</button>
          </div>
        </div>
      )}

      {/* 2. THE MAIN ARENA (VISIBLE TO REF, PLAYERS, AND SPECTATORS) */}
      {joined && (
        <div style={{ padding: '20px' }}>
          
          {/* HEADER BAR: Personal & Global Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#111', padding: '15px', borderRadius: '10px', borderBottom: '2px solid gold' }}>
            <div>
              <div style={{fontSize: '0.8rem', color: 'gold'}}>YOUR IDENTITY</div>
              <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{isRef ? "👑 REFEREE (ERIC)" : myName}</div>
              <div style={{fontSize: '0.8rem', color: '#aaa'}}>ROLE: {myUser?.role?.toUpperCase() || "SPECTATOR"}</div>
            </div>
            <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '0.8rem', color: 'gold'}}>MATCH STATUS</div>
                <div style={{fontSize: '1.2rem', color: gameState.currentTurn === 'team1' ? '#00ff00' : '#ff4d4d'}}>
                    {gameState.gameStarted ? `PICKING: ${gameState.currentTurn.toUpperCase()}` : "WAITING FOR START"}
                </div>
            </div>
            <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '0.8rem', color: 'gold'}}>LOBBY CAPACITY</div>
                <div style={{fontSize: '1.2rem'}}>{gameState.allViewers.length} / 1,000,000</div>
                <div style={{fontSize: '0.8rem'}}>{gameState.lobbyOpen ? "DOORS OPEN" : "DOORS LOCKED"}</div>
            </div>
          </div>

          {/* ERIC'S REFEREE CONSOLE (Overlaying the screen for you only) */}
          {isRef && (
            <div style={{ background: '#1a1a1a', border: '1px solid gold', padding: '15px', margin: '15px 0', borderRadius: '10px' }}>
              <button onClick={() => socket.emit('refToggleLobby')} style={{background: gameState.lobbyOpen ? '#ff4d4d' : '#28a745', color: 'white', padding: '10px'}}>
                {gameState.lobbyOpen ? "LOCK ENTRANCE (CLOSE LOBBY)" : "UNLOCK ENTRANCE (OPEN LOBBY)"}
              </button>
              <button onClick={() => socket.emit('refReset')} style={{marginLeft: '10px', padding: '10px'}}>RESET BOARD</button>
              
              <div style={{display: 'flex', gap: '20px', marginTop: '15px'}}>
                <div style={{flex: 1}}>
                    <h4 style={{margin: '0 0 10px 0'}}>Assign Players to Teams:</h4>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', background: '#000', padding: '10px', fontSize: '0.8rem' }}>
                        {gameState.allViewers.map(v => (
                        <div key={v.id} style={{marginBottom: '8px', borderBottom: '1px solid #222', paddingBottom: '4px'}}>
                            {v.name} 
                            <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team1'})} style={{marginLeft: '10px'}}>T1</button>
                            <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team2'})} style={{marginLeft: '5px'}}>T2</button>
                        </div>
                        ))}
                    </div>
                </div>
                {!gameState.gameStarted && (
                    <div style={{flex: 1, textAlign: 'center', borderLeft: '1px solid #333'}}>
                        <h4>Configure & Start</h4>
                        <select id="size" style={{padding: '10px'}}><option value="1">1 vs 1</option><option value="2">2 vs 2</option><option value="5">5 vs 5</option><option value="11">11 vs 11</option></select>
                        <button onClick={() => socket.emit('refStartDraft', { teamSize: parseInt(document.getElementById('size').value) })} style={{padding: '10px 20px', background: 'gold', fontWeight: 'bold', marginLeft: '10px'}}>START GAME</button>
                    </div>
                )}
              </div>
            </div>
          )}

          {/* THE LIVE DRAFT BOARD (VISIBLE TO EVERYONE) */}
          {gameState.gameStarted && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              
              {/* Card Section */}
              <div style={{ flex: 3 }}>
                <h3 style={{textAlign: 'center', color: '#aaa'}}>AVAILABLE PLAYER CARDS</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxHeight: '60vh', overflowY: 'auto', padding: '15px', background: '#0a0a0a', border: '1px solid #222' }}>
                  {gameState.availableCards.map(c => (
                    <div key={c.id} 
                      onClick={() => socket.emit('playerPickCard', c.id)}
                      style={{ 
                        border: '1px solid #444', padding: '12px', width: '100px', textAlign: 'center',
                        cursor: myUser?.role === gameState.currentTurn ? 'pointer' : 'not-allowed', 
                        background: myUser?.role === gameState.currentTurn ? '#222' : '#050505',
                        boxShadow: myUser?.role === gameState.currentTurn ? '0 0 10px rgba(0,255,0,0.2)' : 'none',
                        opacity: myUser?.role === gameState.currentTurn ? 1 : 0.4
                      }}>
                      <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{c.name}</div>
                      <div style={{color: 'gold', fontSize: '0.7rem'}}>{c.pos}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Teams Section */}
              <div style={{ flex: 1.5 }}>
                <h3 style={{textAlign: 'center', color: '#aaa'}}>LIVE SQUADS</h3>
                
                {/* Team 1 Box */}
                <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: gameState.currentTurn === 'team1' ? '2px solid #00ff00' : '1px solid #333', marginBottom: '15px' }}>
                  <h4 style={{color: '#00ff00', margin: '0 0 10px 0'}}>TEAM 1 ({gameState.team1Player?.name || "???"})</h4>
                  <div style={{fontSize: '0.85rem'}}>Progress: {gameState.team1Picks.length} / {gameState.teamSize}</div>
                  {gameState.team1Picks.map((p, i) => <div key={i} style={{padding: '4px 0', borderBottom: '1px solid #222'}}>• [{p.pos}] {p.name}</div>)}
                </div>

                {/* Team 2 Box */}
                <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: gameState.currentTurn === 'team2' ? '2px solid #ff4d4d' : '1px solid #333' }}>
                  <h4 style={{color: '#ff4d4d', margin: '0 0 10px 0'}}>TEAM 2 ({gameState.team2Player?.name || "???"})</h4>
                  <div style={{fontSize: '0.85rem'}}>Progress: {gameState.team2Picks.length} / {gameState.teamSize}</div>
                  {gameState.team2Picks.map((p, i) => <div key={i} style={{padding: '4px 0', borderBottom: '1px solid #222'}}>• [{p.pos}] {p.name}</div>)}
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
