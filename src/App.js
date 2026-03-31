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
      
      {!joined && (
        <div style={{ textAlign: 'center', paddingTop: '80px' }}>
          <h1 style={{color: 'gold'}}>🏟️ KIGALI DRAFT ARENA</h1>
          <div style={{ background: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #333', display: 'inline-block' }}>
            <h2>SPECTATOR ENTRANCE</h2>
            <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Enter Full Name" style={{padding: '12px', width: '250px'}} />
            <br/><br/>
            <button onClick={handleJoin} style={{padding: '12px 30px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer'}}>JOIN LOBBY</button>
          </div>
          <div style={{ marginTop: '60px', opacity: 0.5 }}>
            <input type="password" placeholder="Ref ID" onChange={e => setRefToken(e.target.value)} />
            <button onClick={() => socket.emit('claimReferee', refToken)}>REF LOGIN</button>
          </div>
        </div>
      )}

      {joined && (
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#111', padding: '15px', borderRadius: '10px', borderBottom: '2px solid gold' }}>
            <div>
              <div style={{fontSize: '0.8rem', color: 'gold'}}>NAME: <b>{isRef ? "ERIC (REF)" : myName}</b></div>
              <div style={{fontSize: '0.8rem'}}>ROLE: {myUser?.role?.toUpperCase()}</div>
            </div>
            <div style={{textAlign: 'center'}}>
                <h2 style={{ color: '#00ff00', margin: 0 }}>
                    {gameState.currentTurn.startsWith("FINISHED") ? "DRAFT COMPLETE" : `PICKING: ${gameState.currentTurn.toUpperCase()}`}
                </h2>
            </div>
            <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '0.8rem', color: 'gold'}}>LOBBY: {gameState.lobbyOpen ? "OPEN" : "LOCKED"}</div>
                <div style={{fontSize: '0.8rem'}}>TOTAL USERS: {gameState.allViewers.length}</div>
            </div>
          </div>

          {isRef && (
            <div style={{ background: '#1a1a1a', border: '1px solid gold', padding: '15px', marginTop: '10px', borderRadius: '10px' }}>
              <button onClick={() => socket.emit('refToggleLobby')} style={{background: '#444', color: 'white'}}>{gameState.lobbyOpen ? "CLOSE ENTRANCE" : "OPEN ENTRANCE"}</button>
              <button onClick={() => socket.emit('refCloseGame')} style={{marginLeft: '10px', background: 'red', color: 'white'}}>FORCE CLOSE GAME</button>
              <button onClick={() => socket.emit('refReset')} style={{marginLeft: '10px'}}>RESET ALL</button>
              <button onClick={() => socket.emit('refStartDraft')} style={{marginLeft: '10px', background: 'gold', fontWeight: 'bold'}}>START 11v11 DRAFT</button>
              
              <div style={{marginTop: '10px', fontSize: '0.8rem'}}>
                Assign Players: {gameState.allViewers.map(v => (
                  <span key={v.id} style={{marginRight: '10px'}}>{v.name} 
                    <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team1'})}>T1</button>
                    <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team2'})}>T2</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {gameState.gameStarted && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              <div style={{ flex: 3 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '60vh', overflowY: 'auto', padding: '10px', border: '1px solid #222' }}>
                  {gameState.availableCards.map(c => (
                    <div key={c.id} 
                      onClick={() => socket.emit('playerPickCard', c.id)}
                      style={{ 
                        border: '1px solid #444', padding: '10px', width: '100px', textAlign: 'center',
                        cursor: myUser?.role === gameState.currentTurn ? 'pointer' : 'not-allowed', 
                        background: myUser?.role === gameState.currentTurn ? '#222' : '#050505',
                        opacity: myUser?.role === gameState.currentTurn ? 1 : 0.5
                      }}>
                      <div style={{fontWeight: 'bold', fontSize: '0.85rem'}}>{c.name}</div>
                      <div style={{color: 'gold', fontSize: '0.75rem'}}>{c.pos}</div>
                      <div style={{color: '#00ff00', fontSize: '0.7rem'}}>Pts: {c.points || 0}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1.5 }}>
                <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid green', marginBottom: '10px' }}>
                  <h4 style={{color: '#00ff00', margin: 0}}>TEAM 1 ({gameState.team1Player?.name || "???"})</h4>
                  <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>TOTAL POINTS: {calculatePoints(gameState.team1Picks)}</div>
                  <div style={{fontSize: '0.8rem'}}>Picks: {gameState.team1Picks.length} / 11</div>
                  {gameState.team1Picks.map((p, i) => <div key={i} style={{fontSize: '0.8rem'}}>• [{p.pos}] {p.name} ({p.points || 0} pts)</div>)}
                </div>

                <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid red' }}>
                  <h4 style={{color: '#ff4d4d', margin: 0}}>TEAM 2 ({gameState.team2Player?.name || "???"})</h4>
                  <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>TOTAL POINTS: {calculatePoints(gameState.team2Picks)}</div>
                  <div style={{fontSize: '0.8rem'}}>Picks: {gameState.team2Picks.length} / 11</div>
                  {gameState.team2Picks.map((p, i) => <div key={i} style={{fontSize: '0.8rem'}}>• [{p.pos}] {p.name} ({p.points || 0} pts)</div>)}
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
