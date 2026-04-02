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

  if (!gameState) return <div style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Loading Arena...</div>;

  const myUser = gameState.allViewers.find(v => v.id === socket.id);
  
  // Calculate Total Points for each team
  const calculatePoints = (teamArray) => {
    return teamArray.reduce((sum, p) => sum + (parseInt(p.points) || 0), 0);
  };

  return (
    <div style={{ backgroundColor: '#050505', color: '#eee', minHeight: '100vh', fontFamily: 'Arial' }}>
      
      {/* LOGIN PHASE */}
      {!joined && (
        <div style={{ textAlign: 'center', paddingTop: '80px' }}>
          <h1 style={{color: 'gold'}}>🏟️ RUHAGO N'INSHUTI ARENA</h1>
          <div style={{ background: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #333', display: 'inline-block' }}>
            <h2>VIP PLAYER ENTRANCE</h2>
            <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Your Full Name" style={{padding: '12px', width: '250px'}} />
            <br/><br/>
            <input id="txid_input" placeholder="MTN Transaction ID (TxId)" style={{padding: '12px', width: '250px', background: '#000', color: 'gold', border: '1px solid gold'}} />
            <br/><br/>
            <button onClick={() => {
                const tx = document.getElementById('txid_input').value;
                socket.emit('joinWaitingRoom', { name: myName, ticketCode: tx });
                setJoined(true);
            }} style={{padding: '12px 30px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>VERIFY & ENTER</button>
            <p style={{fontSize: '0.7rem', color: '#888', marginTop: '15px'}}>Verification occurs every 15 minutes after payment.</p>
          </div>
          <div style={{ marginTop: '60px', opacity: 0.5 }}>
            <input type="password" placeholder="Ref ID" onChange={e => setRefToken(e.target.value)} style={{padding: '8px'}}/>
            <button onClick={() => socket.emit('claimReferee', refToken)} style={{padding: '8px'}}>CLAIM</button>
          </div>
        </div>
      )}

      {/* ARENA PHASE */}
      {joined && (
        <div style={{ padding: '20px' }}>
          
          {/* HEADER BAR */}
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
                <div style={{fontSize: '0.8rem', color: 'gold'}}>LOBBY: {gameState.lobbyOpen ? "OPEN" : "LOCKED"}</div>
                <div style={{fontSize: '1.2rem'}}>{gameState.allViewers.length} USERS</div>
            </div>
          </div>

          {/* REFEREE CONTROL PANEL */}
          {isRef && (
            <div style={{ background: '#1a1a1a', border: '1px solid gold', padding: '15px', marginTop: '10px', borderRadius: '10px' }}>
              <button onClick={() => socket.emit('refToggleLobby')} style={{background: gameState.lobbyOpen ? '#ff4d4d' : '#28a745', color: 'white', padding: '10px'}}>
                {gameState.lobbyOpen ? "CLOSE LOBBY" : "OPEN LOBBY"}
              </button>
              <button onClick={() => socket.emit('refCloseGame')} style={{marginLeft: '10px', background: 'red', color: 'white', padding: '10px'}}>FORCE CLOSE GAME</button>
              <button onClick={() => socket.emit('refReset')} style={{marginLeft: '10px', padding: '10px'}}>RESET BOARD</button>
              
              <div style={{marginTop: '15px', padding: '15px', border: '1px solid #333', background: '#000'}}>
                <label>Set Match Type: </label>
                <select id="matchSize" style={{padding: '8px', background: '#111', color: 'white'}}>
                    <option value="1">1 vs 1</option>
                    <option value="2">2 vs 2</option>
                    <option value="3">3 vs 3</option>
                    <option value="5">5 vs 5</option>
                </select>
                <button 
                    onClick={() => socket.emit('refStartDraft', { teamSize: parseInt(document.getElementById('matchSize').value) })} 
                    style={{marginLeft: '10px', background: 'gold', fontWeight: 'bold', padding: '8px 25px', color: 'black'}}>
                    START MATCH (11 PICKS PER TEAM)
                </button>
              </div>

              <div style={{marginTop: '10px', fontSize: '0.9rem'}}>
                Assign Roles: {gameState.allViewers.map(v => (
                  <span key={v.id} style={{marginRight: '15px', padding: '5px', background: '#222'}}>
                    {v.name} 
                    <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team1'})} style={{marginLeft: '5px'}}>T1</button>
                    <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team2'})} style={{marginLeft: '5px'}}>T2</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* DRAFT BOARD */}
          {gameState.gameStarted && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              
              {/* Card List */}
              <div style={{ flex: 3 }}>
                <h3 style={{textAlign: 'center', color: '#666'}}>AVAILABLE PLAYER CARDS (MAX 100)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxHeight: '60vh', overflowY: 'auto', padding: '10px', background: '#0a0a0a', border: '1px solid #222' }}>
                  {gameState.availableCards.map(c => (
                    <div key={c.id} 
                      onClick={() => socket.emit('playerPickCard', c.id)}
                      style={{ 
                        border: '1px solid #444', padding: '12px', width: '100px', textAlign: 'center',
                        cursor: myUser?.role === gameState.currentTurn ? 'pointer' : 'not-allowed', 
                        background: myUser?.role === gameState.currentTurn ? '#222' : '#050505',
                        opacity: myUser?.role === gameState.currentTurn ? 1 : 0.4
                      }}>
                      <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{c.name}</div>
                      <div style={{color: 'gold', fontSize: '0.7rem'}}>{c.pos}</div>
                      <div style={{color: '#00ff00', fontSize: '0.75rem', marginTop: '5px'}}>Points: {c.points || 0}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roster & Points */}
              <div style={{ flex: 1.5 }}>
                <h3 style={{textAlign: 'center', color: '#666'}}>LIVE SQUADS</h3>
                <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: gameState.currentTurn === 'team1' ? '2px solid #00ff00' : '1px solid #333', marginBottom: '15px' }}>
                  <h4 style={{color: '#00ff00', margin: '0 0 5px 0'}}>TEAM 1: {gameState.team1Player?.name || "???"}</h4>
                  <div style={{fontSize: '1.3rem', fontWeight: 'bold', color: 'gold'}}>TOTAL PTS: {calculatePoints(gameState.team1Picks)}</div>
                  <div style={{fontSize: '0.8rem', marginBottom: '10px'}}>Picks: {gameState.team1Picks.length} / 11</div>
                  {gameState.team1Picks.map((p, i) => <div key={i} style={{fontSize: '0.85rem', borderBottom: '1px solid #222', padding: '3px 0'}}>• [{p.pos}] {p.name} ({p.points || 0} pts)</div>)}
                </div>

                <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: gameState.currentTurn === 'team2' ? '2px solid #ff4d4d' : '1px solid #333' }}>
                  <h4 style={{color: '#ff4d4d', margin: '0 0 5px 0'}}>TEAM 2: {gameState.team2Player?.name || "???"}</h4>
                  <div style={{fontSize: '1.3rem', fontWeight: 'bold', color: 'gold'}}>TOTAL PTS: {calculatePoints(gameState.team2Picks)}</div>
                  <div style={{fontSize: '0.8rem', marginBottom: '10px'}}>Picks: {gameState.team2Picks.length} / 11</div>
                  {gameState.team2Picks.map((p, i) => <div key={i} style={{fontSize: '0.85rem', borderBottom: '1px solid #222', padding: '3px 0'}}>• [{p.pos}] {p.name} ({p.points || 0} pts)</div>)}
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
