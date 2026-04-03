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
  
  const [localQRs, setLocalQRs] = useState(["", "", "", "", "", ""]);

  useEffect(() => {
    socket.on('gameStateUpdate', (state) => {
        setGameState(state);
        const savedTx = localStorage.getItem('myTxId');
        const verified = state.allViewers.find(v => v.name === myName && v.txId === savedTx);
        if (verified) setJoined(true);
        // Sync local inputs with server data if you are the ref
        if (state.qrCodes) setLocalQRs(state.qrCodes);
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
            <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Full Name" style={{padding: '12px', width: '250px'}} />
            <br/><br/>
            <input value={myTxId} onChange={e => setMyTxId(e.target.value)} placeholder="MTN TxID" style={{padding: '12px', width: '250px', background: '#000', color: 'gold', border: '1px solid gold'}} />
            <br/><br/>
            <button onClick={handleJoin} style={{padding: '12px 30px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>VERIFY & ENTER</button>
          </div>
          <div style={{ marginTop: '40px', opacity: 0.3 }}>
             <input type="password" placeholder="Ref Token" onChange={e => setRefToken(e.target.value)} style={{padding: '5px'}}/>
             <button onClick={() => socket.emit('claimReferee', refToken)}>CLAIM</button>
          </div>
        </div>
      )}

      {joined && (
        <div style={{ padding: '20px' }}>
          {/* HEADER SECTION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#111', padding: '15px', borderRadius: '10px', borderBottom: '2px solid gold', alignItems: 'center' }}>
            <div>
                <div style={{fontSize: '0.8rem', color: 'gold'}}>PLAYER: {isRef ? "ERIC (REF)" : myName}</div>
                <div style={{fontSize: '1rem'}}>ROLE: {myUser?.role?.toUpperCase()}</div>
            </div>
            <div style={{textAlign: 'center'}}>
                <a 
                  href={gameState.youtubeLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{background: 'red', color: 'white', padding: '12px 25px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block'}}
                >
                  ▶️ WATCH LIVE ON YOUTUBE
                </a>
            </div>
            <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '1.2rem', color: 'gold'}}>{gameState.allViewers.length} USERS</div>
            </div>
          </div>

          {/* QR CODE DISPLAY (FOR EVERYONE) */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '15px', flexWrap: 'wrap' }}>
            {gameState.qrCodes.map((url, index) => (
              url ? (
                <div key={index} style={{ background: 'white', padding: '5px', borderRadius: '5px', border: '2px solid gold' }}>
                  <img src={url} alt={`QR ${index + 1}`} style={{ width: '100px', height: '100px', display: 'block' }} />
                </div>
              ) : null
            ))}
          </div>

          {/* REFEREE CANVAS */}
          {isRef && (
            <div style={{ background: '#1a1a1a', border: '2px solid gold', padding: '20px', marginTop: '20px', borderRadius: '10px' }}>
              <h3 style={{color: 'gold', marginTop: 0}}>ERIC'S REFEREE CANVAS</h3>
              
              <div style={{marginBottom: '15px'}}>
                <input value={newYoutube} onChange={e => setNewYoutube(e.target.value)} placeholder="New YouTube Link" style={{padding: '8px', width: '300px'}} />
                <button onClick={() => socket.emit('refUpdateYoutube', newYoutube)} style={{padding: '8px', marginLeft: '10px', background: 'gold'}}>UPDATE LIVE LINK</button>
              </div>

              <div style={{border: '1px solid #444', padding: '15px', borderRadius: '8px', background: '#000'}}>
                <p style={{margin: '0 0 5px 0', fontSize: '0.9rem', color: '#888'}}>Paste QR Image URLs below to show them to fans:</p>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px'}}>
                   {localQRs.map((qr, i) => (
                     <input 
                       key={i} 
                       placeholder={`Image URL ${i+1}`} 
                       value={qr} 
                       onChange={(e) => {
                         const updated = [...localQRs];
                         updated[i] = e.target.value;
                         setLocalQRs(updated);
                       }}
                       style={{padding: '5px', fontSize: '0.8rem', background: '#222', color: 'white', border: '1px solid #444'}}
                     />
                   ))}
                </div>
                <button 
                   onClick={() => {
                     socket.emit('refUpdateQRs', localQRs);
                     alert("QR Codes Updated on Fan Screens!");
                   }} 
                   style={{marginTop: '10px', background: 'green', color: 'white', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer'}}
                >
                  PUBLISH QR CODES
                </button>
              </div>

              <div style={{marginTop: '20px'}}>
                <button onClick={() => socket.emit('refReset')} style={{background: 'blue', color: 'white', padding: '10px'}}>RESET BOARD</button>
                <button onClick={() => socket.emit('refStartDraft', { teamSize: 11 })} style={{marginLeft: '10px', background: 'gold', padding: '10px', color: 'black', fontWeight: 'bold'}}>START 11vs11</button>
              </div>
            </div>
          )}

          {/* DRAFTING BOARD */}
          {gameState.gameStarted && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
              <div style={{ flex: 3 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '60vh', overflowY: 'auto', padding: '10px', border: '1px solid #222' }}>
                  {gameState.availableCards.map(c => (
                    <div key={c.id} onClick={() => socket.emit('playerPickCard', c.id)} style={{ border: '1px solid #444', padding: '10px', width: '90px', cursor: myUser?.role === gameState.currentTurn ? 'pointer' : 'not-allowed', background: '#111', opacity: myUser?.role === gameState.currentTurn ? 1 : 0.4 }}>
                      <div style={{fontWeight: 'bold', fontSize: '0.8rem'}}>{c.name}</div>
                      <div style={{color: 'gold', fontSize: '0.7rem'}}>{c.pos}</div>
                      <div style={{color: '#00ff00', fontSize: '0.7rem'}}>{c.points}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ flex: 1.5 }}>
                <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: gameState.currentTurn === 'team1' ? '2px solid #00ff00' : '1px solid #333', marginBottom: '15px' }}>
                  <h4 style={{color: '#00ff00', margin: 0}}>T1: {gameState.team1Player?.name || "???"}</h4>
                  <div style={{fontSize: '1.2rem', color: 'gold'}}>{calculatePoints(gameState.team1Picks)} pts</div>
                </div>
                <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: gameState.currentTurn === 'team2' ? '2px solid #ff4d4d' : '1px solid #333' }}>
                  <h4 style={{color: '#ff4d4d', margin: 0}}>T2: {gameState.team2Player?.name || "???"}</h4>
                  <div style={{fontSize: '1.2rem', color: 'gold'}}>{calculatePoints(gameState.team2Picks)} pts</div>
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
