import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://football-backend-ykso.onrender.com');

function App() {
  const [gameState, setGameState] = useState(null);
  const [myName, setMyName] = useState(localStorage.getItem('draftName') || "");
  const [myTxId, setMyTxId] = useState(localStorage.getItem('myTxId') || "");
  const [joined, setJoined] = useState(false);
  const [refToken, setRefToken] = useState("");
  const [isRef, setIsRef] = useState(false);
  const [newYoutube, setNewYoutube] = useState("");
  const [localQRs, setLocalQRs] = useState(["", "", "", "", "", ""]);
  const [activeSlot, setActiveSlot] = useState(null);

  useEffect(() => {
    socket.on('gameStateUpdate', (state) => {
        setGameState(state);
        const sTx = localStorage.getItem('myTxId');
        const sName = localStorage.getItem('draftName');
        const userExists = state.allViewers.find(v => v.txId === sTx && v.name === sName);
        
        if (userExists || isRef) {
            setJoined(true);
        } else {
            setJoined(false);
        }
        if (isRef && state.qrCodes) setLocalQRs(state.qrCodes);
    });

    socket.on('gameSyncPhase', (phase) => {
        setActiveSlot(null);
        if (phase === 'LOBBY' && !isRef) setJoined(true);
    });

    socket.on('clearArenaForce', () => {
        // Full wipe of credentials
        localStorage.removeItem('myTxId');
        localStorage.removeItem('draftName');
        setJoined(false);
        setIsRef(false);
        window.location.reload();
    });

    socket.on('refConfirm', (val) => { setIsRef(val); setJoined(true); });
    socket.on('error', (m) => alert(m));
    return () => socket.removeAllListeners();
  }, [isRef]);

  const handleJoin = () => {
    if (!myName || !myTxId) return alert("Missing Info");
    localStorage.setItem('draftName', myName);
    localStorage.setItem('myTxId', myTxId);
    socket.emit('joinWaitingRoom', { name: myName, ticketCode: myTxId });
  };

  if (!gameState) return <div style={{color:'white', textAlign:'center', marginTop:'50px'}}>Arena Connecting...</div>;
  const myUser = gameState.allViewers.find(v => v.id === socket.id);
  const calcPts = (t) => t ? t.reduce((s, p) => s + (parseInt(p.points) || 0), 0) : 0;

  const getRows = (f) => {
    const fm = f || "4-4-2";
    if (fm === "4-4-2") return [2, 4, 4, 1];
    if (fm === "4-3-3") return [3, 3, 4, 1];
    if (fm === "4-2-3-1") return [1, 3, 2, 4, 1];
    if (fm === "3-5-2") return [2, 5, 3, 1];
    if (fm === "5-4-1") return [1, 4, 5, 1];
    return [2, 4, 4, 1];
  };

  const TacticalPitch = ({ teamKey, canEdit }) => {
    const formation = gameState[`${teamKey}Formation`] || "4-4-2";
    const tactics = gameState[`${teamKey}Tactics`] || {};
    const rows = getRows(formation);
    let counter = 0;
    return (
      <div style={{
        background: '#1a472a', border: '2px solid white', borderRadius: '8px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-around',
        aspectRatio: '2/3', padding: '10px', margin: '10px auto', width: '150px', boxShadow: '0 0 10px black'
      }}>
        {rows.map((count, rIdx) => (
          <div key={rIdx} style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
            {Array.from({ length: count }).map((_, i) => {
              const sIdx = counter++;
              const p = tactics[sIdx];
              return (
                <div key={i} onClick={() => canEdit && !gameState.matchLocked && setActiveSlot(sIdx)}
                     style={{
                        width: '28px', height: '28px', borderRadius: '50%', border: '1px solid gold',
                        background: p ? '#111' : 'rgba(0,0,0,0.4)', color: 'white',
                        fontSize: '0.35rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', textAlign: 'center', cursor: (canEdit && !gameState.matchLocked) ? 'pointer' : 'default'
                     }}>
                  {p ? p.name.split(' ')[0] : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: '#050505', color: '#eee', minHeight: '100vh', fontFamily: 'Arial' }}>
      {!joined ? (
        <div style={{ textAlign: 'center', paddingTop: '20px' }}>
          <h1 style={{color: 'gold'}}>🏟️ RUHAGO N'INSHUTI ARENA</h1>
          <div style={{ background: '#111', padding: '20px', borderRadius: '15px', border: '1px solid #444', maxWidth: '90%', width: '600px', margin: '0 auto 20px auto', textAlign: 'left', fontSize: '0.85rem', maxHeight: '350px', overflowY: 'auto' }}>
            <h3 style={{ color: 'red', marginTop: 0, textAlign: 'center' }}>ITANGAZO RY’INGENZI (Warning Notice).</h3>
            <p>KUGIRANGO TUTARENGA KUMATEGEKO Y’UBUYOBOZI BW’URWANDA ,AMATEGEKO AGENGA ABANYARWANDA BOSE, CYANGWA N’ANDIMATEGEKO YOSE YABA AFITE AHO AHURIYE N’IMIKORESHEREZE Y’IKI GIKORESHO. Mbere yo kwinjira no gukora ubwishyu ubwo ari bwo bwose, ndagusaba gusoma no gusobanukirwa ibi bikurikira: Iki gikoresho si urubuga rwo gutega cyangwa gukina urusimbi. Ni igikoresho cyo nyuzamo support ya RUHAGO kubantu bose biyumvamo gushyigikira imigabo n’imigambi bya RUHAGO N’INSHUTI Gusa. Gishobora gukoreshwa nk’igikoresho cy’imyidagaduro gishingiye ku bunararibonye, kigamije gusa gushimisha.(ariko ntwabwo gikoreshwa amasaha yose kandi si buri muntu wese watanze amafranga uhitwamo ngo akinire uruhande urwo arirwo rwose. Guhitamo abakinnyi ntibikorwa hakoreshejwe ikimenyane). Uyu mukino ukora gusa iyo ufite smart fone cyangwa ibindi bikoresho bifite ubushobozi bwayo cyangwa burenze hamwe na connection ya enternet. Ugenewe gusa abantu bafite imyaka 18 kuzamura. Gukomeza winjira, uba wemeye ko wujuje imyaka yavuzwe☝️. Amafaranga 300 Y’Urwanda gusa niyo yishyurwa.⚠️ ayishyuwe ntasubizwa inyuma mu bihe byose. Iyo wishyuye kugira ngo ubashe gukoresha uyu mukino, wemera ko udafite uburenganzira bwo gutegeka, kugenzura uburyo uyu mukino ukoreshwa. Twakira ibitekerezo n’inama mutanga, ariko ibyemezo byose bijyanye n’imikorere bifatwa natwe ubwacu. Ntabwo dukusanya, tubika cyangwa dutunganya amakuru ayo ari yo yose azwi nk’amakuru bwite (personal data). Niba wemeza neza ko wasomye kandi wumvise neza ibisabwa ukaba ubyujuje, ishyura na momo pay (*182*8*1*1934816*300*PIN#). KWINJIRA: MURI BOX YA TDX-ID ANDIKAMO IMIBARE 11, WAHAWE MURI SMS YEMEZAKO WISHYUYE</p>
          </div>
          <div style={{ background: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333', display: 'inline-block' }}>
            <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Full Name" style={{padding:'10px', width:'200px'}} /><br/><br/>
            <input value={myTxId} onChange={e => setMyTxId(e.target.value)} placeholder="TDX-ID" style={{padding:'10px', width:'200px', border:'1px solid gold'}} /><br/><br/>
            <button onClick={handleJoin} style={{padding:'10px 20px', background:'#28a745', color:'white', fontWeight:'bold'}}>ENTER</button>
          </div>
          <div style={{marginTop:'50px', opacity:0.1}}><input type="password" onChange={e => setRefToken(e.target.value)} style={{width:'80px'}}/><button onClick={() => socket.emit('claimReferee', refToken)}>REF</button></div>
        </div>
      ) : (
        <div style={{ padding: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#111', padding: '10px', borderBottom: '2px solid gold', alignItems: 'center' }}>
            <div><div style={{fontSize: '0.7rem', color: 'gold'}}>PLAYER: {isRef ? "ERIC (REF)" : myName}</div><div style={{fontSize: '0.9rem'}}>ROLE: {isRef ? "REFEREE" : (myUser?.role?.toUpperCase() || "FAN")}</div></div>
            <a href={gameState.youtubeLink} target="_blank" rel="noreferrer" style={{background: 'red', color: 'white', padding: '10px 15px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold'}}>WATCH LIVE</a>
            <div style={{fontSize: '1rem', color: 'gold'}}>{gameState.allViewers.length} 👤</div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
            {gameState.qrCodes.map((url, i) => url && (
                <div key={i} style={{ background: 'white', padding: '2px', borderRadius: '4px' }}>
                  <img src={url} alt="QR" style={{ width: '85px', height: '85px' }} />
                </div>
            ))}
          </div>

          {isRef && (
            <div style={{ background: '#1a1a1a', border: '1px solid gold', padding: '15px', marginTop: '10px', borderRadius: '8px' }}>
              <div style={{marginBottom: '10px'}}>
                <input value={newYoutube} onChange={e => setNewYoutube(e.target.value)} placeholder="Link" style={{width:'150px'}} />
                <button onClick={() => socket.emit('refUpdateYoutube', newYoutube)} style={{background:'gold', marginLeft:'5px'}}>LINK</button>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'5px'}}>
                {localQRs.map((q, i) => (
                  <input key={i} value={q} onChange={e => {let n=[...localQRs]; n[i]=e.target.value; setLocalQRs(n)}} placeholder="QR URL" style={{fontSize:'0.6rem', background: '#222', color: 'gold'}} />
                ))}
              </div>
              <button onClick={() => socket.emit('refUpdateQRs', localQRs)} style={{background:'green', color:'white', width:'100%', padding:'5px', marginTop:'5px'}}>SAVE QRS</button>

              <div style={{maxHeight:'100px', overflowY:'auto', marginTop:'10px', background:'#000', padding:'5px', border:'1px solid #333'}}>
                {gameState.allViewers.map(v => (
                  <div key={v.id} style={{fontSize:'0.8rem', padding:'5px', borderBottom:'1px solid #222', display:'flex', justifyContent:'space-between'}}>
                    <span>{v.name}</span>
                    <div>
                        <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role:'team1'})} style={{background:'lime', marginRight:'5px'}}>T1</button>
                        <button onClick={() => socket.emit('refAssignRole', {userId: v.id, role:'team2'})} style={{background:'red', color:'white'}}>T2</button>
                    </div>
                  </div>
                ))}
              </div>

              {gameState.currentTurn === "FINISHED" && (
                <div style={{display:'flex', gap:'10px', justifyContent:'center', marginTop:'15px'}}>
                  <div style={{textAlign:'center'}}><p style={{fontSize:'0.6rem', color:'gold', margin:0}}>T1 Tactics</p><TacticalPitch teamKey="team1" canEdit={false} /></div>
                  <div style={{textAlign:'center'}}><p style={{fontSize:'0.6rem', color:'gold', margin:0}}>T2 Tactics</p><TacticalPitch teamKey="team2" canEdit={false} /></div>
                </div>
              )}

              <div style={{marginTop: '15px', display: 'flex', flexDirection:'column', gap:'10px'}}>
                <div style={{display:'flex', justifyContent:'center', gap:'10px'}}>
                  <button onClick={() => socket.emit('refReset')} style={{background:'blue', color:'white', padding:'8px'}}>RESET</button>
                  <button onClick={() => socket.emit('refStartDraft')} style={{background:'gold', padding:'8px', fontWeight:'bold'}}>START</button>
                  <button onClick={() => socket.emit('refClearArena')} style={{background:'purple', color:'white', padding:'8px'}}>CLEAR</button>
                </div>
                {gameState.currentTurn === "FINISHED" && !gameState.matchLocked && (
                    <button onClick={() => socket.emit('refLockMatch')} style={{background:'lime', color:'black', fontWeight:'bold', padding:'10px', border:'2px solid gold'}}>🚀 MATCH READY</button>
                )}
              </div>
            </div>
          )}

          {gameState.gameStarted && gameState.currentTurn !== "FINISHED" && (
            <div style={{marginTop:'15px'}}>
              <div style={{textAlign:'center', background:'#222', border:'1px solid gold', padding:'5px', marginBottom:'10px'}}><h3 style={{margin:0, color: gameState.currentTurn === 'team1' ? '#0ff' : '#f44'}}>TURN: {gameState.currentTurn.toUpperCase()}</h3></div>
              <div style={{display:'flex', gap:'10px'}}>
                <div key={gameState.availableCards.length} style={{flex: 2.5, display:'flex', flexWrap:'wrap', gap:'5px', maxHeight:'50vh', overflowY:'auto'}}>
                  {gameState.availableCards.map(c => <div key={c.id} onClick={() => !isRef && socket.emit('playerPickCard', c.id)} style={{border:'1px solid #444', padding:'5px', width:'75px', background:'#111', fontSize:'0.7rem', cursor: (!isRef && myUser?.role === gameState.currentTurn) ? 'pointer' : 'not-allowed', opacity: (!isRef && myUser?.role === gameState.currentTurn) ? 1 : 0.4}}><b>{c.name}</b><br/><span style={{color:'gold'}}>{c.pos}</span><br/><span style={{color:'#0f0'}}>{c.points} pts</span></div>)}
                </div>
                <div style={{flex:1.5, fontSize:'0.7rem'}}>
                  <div style={{background:'#111', padding:'5px', border:'1px solid #0f0', marginBottom:'5px'}}><b style={{color:'#0f0'}}>T1 ({gameState.team1Picks.length}/11)</b><br/>{calcPts(gameState.team1Picks)} pts
                    <div style={{marginTop:'5px', color:'#aaa'}}>{gameState.team1Picks.map((p,i) => <div key={i}>• {p.name}</div>)}</div>
                  </div>
                  <div style={{background:'#111', padding:'5px', border:'1px solid #f44'}}><b style={{color:'#f44'}}>T2 ({gameState.team2Picks.length}/11)</b><br/>{calcPts(gameState.team2Picks)} pts
                    <div style={{marginTop:'5px', color:'#aaa'}}>{gameState.team2Picks.map((p,i) => <div key={i}>• {p.name}</div>)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {gameState.gameStarted && myUser?.role?.startsWith('team') && gameState[`${myUser.role}Picks`].length === 11 && (
             <div style={{marginTop:'20px', textAlign:'center'}}>
                <h2 style={{color:'gold', margin:'0 0 10px 0'}}>TACTICS {gameState.matchLocked && "(LOCKED)"}</h2>
                <select 
                   value={gameState[`${myUser.role}Formation`]} 
                   onChange={(e) => socket.emit('playerSetFormation', e.target.value)}
                   disabled={gameState.matchLocked}
                   style={{padding:'10px', background:'#222', color:'gold', border:'1px solid gold', marginBottom:'10px', width:'150px'}}
                >
                   <option value="4-4-2">4-4-2</option>
                   <option value="4-3-3">4-3-3</option>
                   <option value="4-2-3-1">4-2-3-1</option>
                   <option value="3-5-2">3-5-2</option>
                   <option value="5-4-1">5-4-1</option>
                </select>
                <TacticalPitch teamKey={myUser.role} canEdit={!gameState.matchLocked} />
                {activeSlot !== null && !gameState.matchLocked && (
                   <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.95)', zIndex:1000, padding:'20px', overflowY:'auto'}}>
                      <h3 style={{color:'gold'}}>Assign Player</h3>
                      <div style={{display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center'}}>{gameState[`${myUser.role}Picks`].map(p => <button key={p.id} onClick={() => {socket.emit('playerSetPosition', {slotIndex:activeSlot, cardId:p.id}); setActiveSlot(null);}} style={{padding:'12px', background:'#222', color:'white', border:'1px solid gold'}}>{p.name}</button>)}</div>
                      <button onClick={() => setActiveSlot(null)} style={{marginTop:'25px', padding:'10px 40px', background:'red', color:'white', border:'none'}}>CANCEL</button>
                   </div>
                )}
             </div>
          )}
        </div>
      )}
    </div>
  );
}
export default App;
