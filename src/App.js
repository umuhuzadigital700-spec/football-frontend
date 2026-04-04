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
  
  const hasAutoJoined = useRef(false);

  useEffect(() => {
    socket.on('gameStateUpdate', (state) => {
        setGameState(state);
        if (!hasAutoJoined.current && !isRef) {
            const savedTx = localStorage.getItem('myTxId');
            if (state.allViewers.find(v => v.name === myName && v.txId === savedTx)) {
                setJoined(true);
                hasAutoJoined.current = true;
            }
        }
        if (isRef && state.qrCodes) setLocalQRs(state.qrCodes);
    });

    socket.on('clearArenaForce', () => {
        localStorage.removeItem('myTxId');
        hasAutoJoined.current = false;
        setJoined(false);
        if(!isRef) window.location.reload();
    });

    socket.on('refConfirm', (val) => { setIsRef(val); setJoined(true); hasAutoJoined.current = true; });
    socket.on('error', (m) => alert(m));
    return () => socket.removeAllListeners();
  }, [myName, isRef]);

  const handleJoin = () => {
    if (!myName || !myTxId) return alert("Missing Info");
    localStorage.setItem('draftName', myName);
    localStorage.setItem('myTxId', myTxId);
    socket.emit('joinWaitingRoom', { name: myName, ticketCode: myTxId });
  };

  if (!gameState) return <div style={{color:'white', textAlign:'center', marginTop:'50px'}}>Stadium Loading...</div>;
  const myUser = gameState.allViewers.find(v => v.id === socket.id);
  const calcPts = (t) => t.reduce((s, p) => s + (parseInt(p.points) || 0), 0);

  return (
    <div style={{ backgroundColor: '#050505', color: '#eee', minHeight: '100vh', fontFamily: 'Arial' }}>
      {!joined ? (
        <div style={{ textAlign: 'center', paddingTop: '80px' }}>
          <h1 style={{color: 'gold'}}>🏟️ RUHAGO ARENA</h1>
          <div style={{ background: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333', display: 'inline-block' }}>
            <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Full Name" style={{padding:'10px', width:'200px'}} /><br/><br/>
            <input value={myTxId} onChange={e => setMyTxId(e.target.value)} placeholder="TxID" style={{padding:'10px', width:'200px', border:'1px solid gold'}} /><br/><br/>
            <button onClick={handleJoin} style={{padding:'10px 20px', background:'#28a745', color:'white', fontWeight:'bold'}}>ENTER</button>
          </div>
          <div style={{marginTop:'50px', opacity:0.2}}>
            <input type="password" onChange={e => setRefToken(e.target.value)} style={{width:'80px'}}/>
            <button onClick={() => socket.emit('claimReferee', refToken)}>REF</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '15px' }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#111', padding: '10px', borderBottom: '2px solid gold', alignItems: 'center' }}>
            <div>
                <div style={{fontSize: '0.7rem', color: 'gold'}}>PLAYER: {isRef ? "ERIC" : myName}</div>
                <div style={{fontSize: '0.9rem'}}>ROLE: {myUser?.role?.toUpperCase() || "FAN"}</div>
            </div>
            <a href={gameState.youtubeLink} target="_blank" rel="noreferrer" style={{background: 'red', color: 'white', padding: '10px 15px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold'}}>WATCH LIVE</a>
            <div style={{fontSize: '1rem', color: 'gold'}}>{gameState.allViewers.length} 👤</div>
          </div>

          {/* QRS */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
            {gameState.qrCodes.map((url, i) => url && (
                <div key={i} style={{ background: 'white', padding: '2px', borderRadius: '4px' }}>
                  <img src={url} alt="QR" style={{ width: '85px', height: '85px' }} />
                </div>
            ))}
          </div>

          {/* REF PANEL */}
          {isRef && (
            <div style={{ background: '#1a1a1a', border: '1px solid gold', padding: '10px', marginTop: '10px' }}>
              <input value={newYoutube} onChange={e => setNewYoutube(e.target.value)} placeholder="Link" style={{width:'150px'}} />
              <button onClick={() => socket.emit('refUpdateYoutube', newYoutube)}>LINK</button>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'5px', marginTop:'10px'}}>
                {localQRs.map((q, i) => (
                  <input key={i} value={q} onChange={e => {let n=[...localQRs]; n[i]=e.target.value; setLocalQRs(n)}} style={{fontSize:'0.6rem'}} />
                ))}
              </div>
              <button onClick={() => socket.emit('refUpdateQRs', localQRs)} style={{background:'green', color:'white', width:'100%', marginTop:'5px'}}>SAVE QRS</button>
              <div style={{maxHeight:'100px', overflowY:'auto', marginTop:'10px', background:'#000'}}>
                {gameState.allViewers.map(v => (
                  <div key={v.id} style={{fontSize:'0.8rem', padding:'3px', borderBottom:'1px solid #222', display:'flex', justifyContent:'space-between'}}>
                    <span>{v.name}</span>
                    <div>
                        <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role:'team1'})}>T1</button>
                        <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role:'team2'})}>T2</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => socket.emit('refReset')} style={{background:'blue', color:'white', marginTop:'10px'}}>RESET</button>
              <button onClick={() => socket.emit('refStartDraft')} style={{background:'gold', marginLeft:'10px'}}>START</button>
              <button onClick={() => socket.emit('refClearArena')} style={{background:'purple', color:'white', marginLeft:'10px'}}>CLEAR</button>
            </div>
          )}

          {/* DRAFT */}
          {gameState.gameStarted && (
            <div style={{ marginTop: '15px' }}>
              <div style={{textAlign: 'center', padding: '5px', background: '#222', border: '1px solid gold'}}>
                 <h3 style={{color: gameState.currentTurn === 'team1' ? '#0ff' : '#f44', margin: 0}}>TURN: {gameState.currentTurn.toUpperCase()}</h3>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <div style={{ flex: 2, display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '50vh', overflowY: 'auto' }}>
                  {gameState.availableCards.map(c => (
                    <div key={c.id} onClick={() => socket.emit('playerPickCard', c.id)} style={{ border: '1px solid #444', padding: '5px', width: '75px', background: '#111', fontSize:'0.7rem', opacity: myUser?.role===gameState.currentTurn ? 1 : 0.4 }}>
                      <b>{c.name}</b><br/><span style={{color:'gold'}}>{c.pos}</span><br/><span style={{color:'#0f0'}}>{c.points} pts</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, fontSize:'0.7rem' }}>
                    <div style={{ background: '#111', padding: '5px', border: '1px solid #333' }}>
                        <b style={{color:'#0f0'}}>T1 ({gameState.team1Picks.length}/11)</b><br/>{calcPts(gameState.team1Picks)} pts
                    </div>
                    <div style={{ background: '#111', padding: '5px', border: '1px solid #333', marginTop: '5px' }}>
                        <b style={{color:'#f44'}}>T2 ({gameState.team2Picks.length}/11)</b><br/>{calcPts(gameState.team2Picks)} pts
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
