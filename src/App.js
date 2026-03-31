import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://football-backend-ykso.onrender.com');

function App() {
  const [gameState, setGameState] = useState(null);
  const [myName, setMyName] = useState(localStorage.getItem('draftName') || "");
  const [joined, setJoined] = useState(false);
  const [refToken, setRefToken] = useState("");

  useEffect(() => {
    socket.on('gameStateUpdate', (state) => setGameState(state));
    return () => socket.removeAllListeners();
  }, []);

  const handleJoin = () => {
    if (!myName) return;
    localStorage.setItem('draftName', myName);
    socket.emit('joinWaitingRoom', { name: myName });
    setJoined(true);
  };

  if (!gameState) return <div style={{color: 'white'}}>Connecting to Arena...</div>;

  const myUser = gameState.allViewers.find(v => v.id === socket.id);
  const isRef = gameState.refereeId === socket.id;

  return (
    <div style={{ backgroundColor: '#111', color: 'white', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* LOGIN SCREEN */}
      {!joined && !isRef && (
        <div style={{textAlign: 'center', marginTop: '50px'}}>
          <h1>⚽ Kigali Draft Arena</h1>
          {gameState.lobbyOpen ? (
            <>
              <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Your Name" style={{padding: '10px'}} />
              <button onClick={handleJoin} style={{padding: '10px 20px', marginLeft: '10px', background: 'green', color: 'white'}}>ENTER LOBBY</button>
            </>
          ) : (
            <p style={{color: 'red'}}>Lobby is CLOSED. Only previously joined players can enter.</p>
          )}
          <div style={{marginTop: '40px'}}>
            <input type="password" placeholder="Ref Token" onChange={e => setRefToken(e.target.value)} />
            <button onClick={() => socket.emit('claimReferee', refToken)}>CLAIM REF</button>
          </div>
        </div>
      )}

      {/* REFEREE CONTROL PANEL */}
      {isRef && (
        <div style={{border: '2px solid gold', padding: '15px', marginBottom: '20px', borderRadius: '10px'}}>
          <h3>👑 REFEREE PANEL</h3>
          <button onClick={() => socket.emit('refToggleLobby')}>{gameState.lobbyOpen ? "CLOSE LOBBY" : "OPEN LOBBY"}</button>
          <button onClick={() => socket.emit('refReset')} style={{marginLeft: '10px'}}>RESET GAME</button>
          
          <div style={{marginTop: '10px'}}>
            <h4>Assign Roles:</h4>
            {gameState.allViewers.map(v => (
              <div key={v.id} style={{marginBottom: '5px'}}>
                {v.name} ({v.role}) 
                <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team1'})}>T1</button>
                <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team2'})}>T2</button>
                <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'spectator'})}>Spec</button>
              </div>
            ))}
          </div>

          {!gameState.gameStarted && (
            <div style={{marginTop: '10px'}}>
              <select id="size"><option value="1">1v1</option><option value="5">5v5</option><option value="11">11v11</option></select>
              <button onClick={() => socket.emit('refStartDraft', { teamSize: parseInt(document.getElementById('size').value) })}>START GAME</button>
            </div>
          )}
        </div>
      )}

      {/* THE ARENA */}
      {joined && (
        <div>
          <div style={{textAlign: 'center'}}>
            <h2>Arena Status: {gameState.gameStarted ? "Drafting..." : "Waiting for Ref"}</h2>
            <p>Your Role: <span style={{color: 'gold'}}>{myUser?.role || "Spectator"}</span></p>
          </div>

          {gameState.gameStarted && (
            <div style={{display: 'flex', justifyContent: 'space-around'}}>
              <div style={{width: '60%'}}>
                <h3 style={{color: gameState.currentTurn === 'team1' ? 'green' : 'red'}}>
                  Current Turn: {gameState.currentTurn}
                </h3>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
                  {gameState.availableCards.map(c => (
                    <div key={c.id} 
                      onClick={() => socket.emit('playerPickCard', c.id)}
                      style={{border: '1px solid #444', padding: '10px', width: '80px', cursor: 'pointer', background: '#222'}}>
                      {c.name}<br/><small>{c.pos}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{width: '35%'}}>
                <h4>Team 1: {gameState.team1Picks.length}/{gameState.teamSize}</h4>
                {gameState.team1Picks.map(p => <div key={p.id}>[{p.pos}] {p.name}</div>)}
                <hr/>
                <h4>Team 2: {gameState.team2Picks.length}/{gameState.teamSize}</h4>
                {gameState.team2Picks.map(p => <div key={p.id}>[{p.pos}] {p.name}</div>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
