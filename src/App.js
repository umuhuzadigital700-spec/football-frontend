import React, { useEffect, useState, useRef } from 'react';
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
  const [localQRs, setLocalQRs] = useState(["", "", "", "", "", ""]);
  
  // Prevent re-entry logic from firing on every QR update
  const hasVerified = useRef(false);

  useEffect(() => {
    socket.on('gameStateUpdate', (state) => {
        setGameState(state);
        
        if (!hasVerified.current && !isRef) {
            const savedTx = localStorage.getItem('myTxId');
            const verified = state.allViewers.find(v => v.name === myName && v.txId === savedTx);
            if (verified) {
                setJoined(true);
                hasVerified.current = true;
            }
        }
        
        // Background update for QRs without resetting the UI
        if (state.qrCodes && isRef) {
            setLocalQRs(state.qrCodes);
        }
    });

    socket.on('clearArenaForce', () => {
        localStorage.removeItem('myTxId');
        hasVerified.current = false;
        setJoined(false);
        if(!isRef) window.location.reload(); 
    });

    socket.on('refConfirm', (val) => { 
        setIsRef(val); 
        setJoined(true); 
        hasVerified.current = true;
    });

    socket.on('error', (msg) => { alert(msg); });
    
    return () => socket.removeAllListeners();
  }, [myName, isRef]);

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
            <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Full Name" style={{padding: '12px', width: '250px'}} />
            <br/><br/>
            <input value={myTxId} onChange={e => setMyTxId(e.target.value)} placeholder="TxId Code" style={{padding: '12px', width: '250px', background: '#000', color: 'gold', border: '1px solid gold'}} />
            <br/><br/>
            <button onClick={handleJoin} style={{padding: '12px 30px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>VERIFY & ENTER</button>
          </div>
          <div style={{ marginTop: '40px', opacity: 0.3 }}>
            <input type="password" placeholder="Ref Token" onChange={e => setRefToken(e.target.value)} style={{padding: '5px'}}/>
            <button onClick={() => socket.emit('claimReferee', refToken)}>CLAIM REF</button>
          </div>
        </div>
      )}

      {joined && (
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#111', padding: '15px', borderRadius: '10px', borderBottom: '2px solid gold', alignItems: 'center' }}>
            <div>
                <div style={{fontSize: '0.8rem', color: 'gold'}}>PLAYER: {isRef ? "ERIC (REF)" : myName}</div>
                <div style={{fontSize: '1rem', color: myUser?.role?.includes('team') ? 'lime' : 'white'}}>
                    ROLE: {myUser?.role?.toUpperCase() || "SPECTATOR"}
                </div>
            </div>
            <div style={{textAlign: 'center'}}>
                <a href={gameState.youtubeLink} target="_blank" rel="noopener noreferrer" style={{background: 'red', color: 'white', padding: '12px 25px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block'}}>▶️ WATCH LIVE NOW</a>
            </div>
            <div style={{textAlign: 'right'}}><div style={{fontSize: '1.2rem', color: 'gold'}}>{gameState.allViewers.length} ONLINE</div></div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px', flexWrap: 'wrap' }}>
            {gameState.qrCodes.map((url, i) => url && (
                <div key={i} style={{ background: 'white', padding: '3px', borderRadius: '5px' }}>
                  <img src={url} alt="QR" style={{ width: '95px', height: '95px', display: 'block' }} />
                </div>
            ))}
          </div>

          {isRef && (
            <div style={{ background: '#1a1a1a', border: '2px solid gold', padding: '15px', marginTop: '15px', borderRadius: '10px' }}>
              <h3 style={{color: 'gold', margin: '0 0 10px 0'}}>REFEREE CANVAS</h3>
              <input value={newYoutube} onChange={e => setNewYoutube(e.target.value)} placeholder="YouTube Link" style={{padding: '8px', width: '250px'}} />
              <button onClick={() => socket.emit('refUpdateYoutube', newYoutube)} style={{padding: '8px', marginLeft: '5px', background: 'gold'}}>SAVE LINK</button>
              
              <div style={{marginTop: '15px', padding: '10px', background: '#000', border: '1px solid #333'}}>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px'}}>
                   {localQRs.map((qr, i) => (
                     <input key={i} value={qr} onChange={(e) => { const updated = [...localQRs]; updated[i] = e.target.value; setLocalQRs(updated); }} style={{padding: '4px', fontSize: '0.7rem', background: '#222', color: 'white'}} />
                   ))}
                </div>
                <button onClick={() => socket.emit('refUpdateQRs', localQRs)} style={{marginTop: '5px', background: 'green', color: 'white', fontSize: '0.8rem'}}>PUBLISH QRS</button>
              </div>

              <div style={{marginTop: '15px', background: '#222', padding: '10px'}}>
                <p style={{fontWeight: 'bold', color: 'gold'}}>Assign Teams:</p>
                <div style={{maxHeight: '150px', overflowY: 'auto'}}>
                    {gameState.allViewers.map(v => (
                        <div key={v.id} style={{padding: '8px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span style={{color: v.role !== 'spectator' ? 'lime' : 'white'}}>
                                {v.name} {v.role !== 'spectator' ? `(${v.role})` : ''}
                            </span>
                            <div>
                                <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team1'})} style={{background: '#00ff00', marginRight: '5px'}}>T1</button>
                                <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role: 'team2'})} style={{background: '#ff4d4d', color: 'white'}}>T2</button>
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              <div style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
                <button onClick={() => socket.emit('refReset')} style={{background: 'blue', color: 'white', padding: '10px'}}>RESET GAME</button>
                <button onClick={() => socket.emit('refStartDraft')} style={{background: 'gold', padding: '10px', color: 'black', fontWeight: 'bold'}}>START</button>
                <button onClick={() => socket.emit('refClearArena')} style={{background: 'purple', color: 'white', padding: '10px'}}>CLEAR ARENA</button>
              </div>
            </div>
          )}

          {gameState.gameStarted && (
            <div style={{ marginTop: '20px' }}>
              <div style={{textAlign: 'center', padding: '10px', background: '#222', marginBottom: '10px', border: '1px solid gold'}}>
                 <h2 style={{color: gameState.currentTurn === 'team1' ? '#00ff00' : '#ff4d4d', margin: 0}}>
                    TURN: {gameState.currentTurn.toUpperCase()} 
                    { (myUser?.role === gameState.currentTurn) ? " (YOUR TURN!)" : "" }
                 </h2>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 3 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {gameState.availableCards.map(c => (
                        <div key={c.id} 
                             onClick={() => socket.emit('playerPickCard', c.id)} 
                             style={{ 
                                border: '1px solid #444', 
                                padding: '10px', 
                                width: '90px', 
                                cursor: (myUser?.role === gameState.currentTurn) ? 'pointer' : 'not-allowed', 
                                opacity: (myUser?.role === gameState.currentTurn) ? 1 : 0.4, 
                                background: '#222' 
                             }}>
                        <div style={{fontWeight: 'bold', fontSize: '0.8rem'}}>{c.name}</div>
                        <div style={{color: 'gold', fontSize: '0.7rem'}}>{c.pos}</div>
                        <div style={{color: '#00ff00', fontSize: '0.7rem'}}>{c.points} pts</div>
                        </div>
                    ))}
                    </div>
                </div>
                <div style={{ flex: 1.5 }}>
                    <div style={{ background: '#111', padding: '10px', border: gameState.currentTurn === 'team1' ? '2px solid #00ff00' : '1px solid #333', marginBottom: '10px' }}>
                    <h4 style={{color: '#00ff00', margin: 0}}>T1: {gameState.team1Player?.name || "???"}</h4>
                    <div style={{fontSize: '1.1rem', color: 'gold'}}>{calculatePoints(gameState.team1Picks)} pts ({gameState.team1Picks.length}/11)</div>
                    {gameState.team1Picks.map((p, i) => <div key={i} style={{fontSize: '0.7rem'}}>• {p.name} ({p.pos})</div>)}
                    </div>
                    <div style={{ background: '#111', padding: '10px', border: gameState.currentTurn === 'team2' ? '2px solid #ff4d4d' : '1px solid #333' }}>
                    <h4 style={{color: '#ff4d4d', margin: 0}}>T2: {gameState.team2Player?.name || "???"}</h4>
                    <div style={{fontSize: '1.1rem', color: 'gold'}}>{calculatePoints(gameState.team2Picks)} pts ({gameState.team2Picks.length}/11)</div>
                    {gameState.team2Picks.map((p, i) => <div key={i} style={{fontSize: '0.7rem'}}>• {p.name} ({p.pos})</div>)}
                    </div>
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
