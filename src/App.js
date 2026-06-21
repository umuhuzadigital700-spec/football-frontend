// src/App.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import RefereeDashboard from './RefereeDashboard';
import FanVotingStage from './FanVotingStage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://football-backend-ykso.onrender.com';

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

const FORMATION_SLOTS = {
  '4-4-2': [
    {label:'GK',top:88,left:50},{label:'LB',top:70,left:15},{label:'CB1',top:70,left:35},
    {label:'CB2',top:70,left:65},{label:'RB',top:70,left:85},{label:'LM',top:50,left:15},
    {label:'CM1',top:50,left:35},{label:'CM2',top:50,left:65},{label:'RM',top:50,left:85},
    {label:'ST1',top:22,left:35},{label:'ST2',top:22,left:65},
  ],
  '4-3-3': [
    {label:'GK',top:88,left:50},{label:'LB',top:70,left:15},{label:'CB1',top:70,left:35},
    {label:'CB2',top:70,left:65},{label:'RB',top:70,left:85},{label:'CM1',top:50,left:25},
    {label:'CM2',top:50,left:50},{label:'CM3',top:50,left:75},{label:'LW',top:20,left:20},
    {label:'ST',top:15,left:50},{label:'RW',top:20,left:80},
  ],
  '3-5-2': [
    {label:'GK',top:88,left:50},{label:'CB1',top:70,left:25},{label:'CB2',top:70,left:50},
    {label:'CB3',top:70,left:75},{label:'LWB',top:52,left:10},{label:'CM1',top:50,left:30},
    {label:'CM2',top:50,left:50},{label:'CM3',top:50,left:70},{label:'RWB',top:52,left:90},
    {label:'ST1',top:22,left:35},{label:'ST2',top:22,left:65},
  ],
  '4-5-1': [
    {label:'GK',top:88,left:50},{label:'LB',top:70,left:15},{label:'CB1',top:70,left:35},
    {label:'CB2',top:70,left:65},{label:'RB',top:70,left:85},{label:'LM',top:50,left:10},
    {label:'CM1',top:50,left:30},{label:'CM2',top:50,left:50},{label:'CM3',top:50,left:70},
    {label:'RM',top:50,left:90},{label:'ST',top:18,left:50},
  ],
  '5-3-2': [
    {label:'GK',top:88,left:50},{label:'LWB',top:68,left:10},{label:'CB1',top:70,left:28},
    {label:'CB2',top:70,left:50},{label:'CB3',top:70,left:72},{label:'RWB',top:68,left:90},
    {label:'CM1',top:48,left:25},{label:'CM2',top:48,left:50},{label:'CM3',top:48,left:75},
    {label:'ST1',top:22,left:35},{label:'ST2',top:22,left:65},
  ],
  '4-2-3-1': [
    {label:'GK',top:88,left:50},{label:'LB',top:72,left:15},{label:'CB1',top:72,left:35},
    {label:'CB2',top:72,left:65},{label:'RB',top:72,left:85},{label:'DM1',top:57,left:35},
    {label:'DM2',top:57,left:65},{label:'LAM',top:38,left:20},{label:'CAM',top:35,left:50},
    {label:'RAM',top:38,left:80},{label:'ST',top:18,left:50},
  ],
};
const FORMATIONS = Object.keys(FORMATION_SLOTS);

// ── Tactical Pitch ────────────────────────────────────────────────────────────
function TacticalPitch({ formation, tactics, myPicks, onSlotClick, isLocked, teamColor }) {
  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-4-2'];
  return (
    <div style={{position:'relative',width:'100%',paddingBottom:'130%',background:'linear-gradient(180deg,#1a6b2a 0%,#1e7a30 50%,#1a6b2a 100%)',border:'2px solid rgba(255,255,255,0.3)',borderRadius:10,overflow:'hidden'}}>
      {/* pitch lines */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'50%',left:'5%',right:'5%',height:1,background:'rgba(255,255,255,0.3)'}}/>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:60,height:60,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.3)'}}/>
        <div style={{position:'absolute',top:'3%',left:'20%',right:'20%',height:'14%',border:'1px solid rgba(255,255,255,0.25)'}}/>
        <div style={{position:'absolute',bottom:'3%',left:'20%',right:'20%',height:'14%',border:'1px solid rgba(255,255,255,0.25)'}}/>
      </div>
      {slots.map((slot, idx) => {
        const placed = tactics[idx];
        return (
          <div key={idx} onClick={() => !isLocked && onSlotClick && onSlotClick(idx)}
            style={{position:'absolute',top:slot.top+'%',left:slot.left+'%',transform:'translate(-50%,-50%)',zIndex:10,textAlign:'center',cursor:isLocked?'default':'pointer'}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:placed?teamColor:'rgba(255,255,255,0.1)',border:'2px solid '+(placed?'#fff':'rgba(255,255,255,0.35)'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:placed?7:9,fontWeight:700,color:'#fff',textShadow:'0 1px 3px rgba(0,0,0,0.9)',transition:'all 0.2s'}}>
              {placed?(placed.name||'?').substring(0,5):slot.label}
            </div>
            {placed && (
              <div style={{position:'absolute',top:'105%',left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.8)',color:'#fff',fontSize:7,padding:'1px 4px',borderRadius:3,whiteSpace:'nowrap',maxWidth:64,overflow:'hidden',textOverflow:'ellipsis'}}>
                {(placed.name||'').substring(0,10)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  // Auth state
  const [joined, setJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [myTxId, setMyTxId] = useState('');
  const [myName, setMyName] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isReferee, setIsReferee] = useState(false);
  const [refInput, setRefInput] = useState('');
  const [refError, setRefError] = useState('');

  // Game state
  const [gs, setGs] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [notification, setNotif] = useState('');
  const notifTimer = useRef(null);

  function notif(msg) {
    setNotif(msg);
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotif(''), 4000);
  }

  useEffect(() => {
    socket.on('gameStateUpdate', data => setGs(data));

    socket.on('joinResult', data => {
      setJoinLoading(false);
      if (data.success) {
        setIsPremium(!!data.isPremium);
        setJoined(true);
        setJoinError('');
      } else {
        setJoinError(data.error || 'Payment not found. Please check your MoMo transaction ID.');
      }
    });

    socket.on('refConfirm', ok => {
      if (ok) { setIsReferee(true); setRefError(''); }
      else setRefError('Invalid referee token.');
    });

    socket.on('error', msg => notif('⚠️ ' + msg));

    socket.on('clearArenaForce', () => {
      setJoined(false); setIsReferee(false);
      setMyTxId(''); setMyName('');
      setJoinError('');
    });

    return () => {
      socket.off('gameStateUpdate');
      socket.off('joinResult');
      socket.off('refConfirm');
      socket.off('error');
      socket.off('clearArenaForce');
    };
  }, []);

  const handleJoin = useCallback(() => {
    const n = nameInput.trim();
    const c = codeInput.trim();
    if (!n) { setJoinError('Please enter your name.'); return; }
    if (!c) { setJoinError('Please enter your MoMo Transaction ID.'); return; }
    setJoinError('');
    setJoinLoading(true);
    setMyTxId(c);
    setMyName(n);
    socket.emit('joinWaitingRoom', { name: n, ticketCode: c });
  }, [nameInput, codeInput]);

  const handleRefLogin = useCallback(() => {
    if (!refInput.trim()) { setRefError('Enter referee token.'); return; }
    socket.emit('claimReferee', refInput.trim());
  }, [refInput]);

  // Derived
  const viewer = gs?.allViewers?.find(v => v.txId === myTxId);
  const myRole = viewer?.role || 'spectator';
  const isTeam1 = myRole === 'team1';
  const isTeam2 = myRole === 'team2';
  const isTeamPlayer = isTeam1 || isTeam2;
  const myPicks = isTeam1 ? (gs?.team1Picks||[]) : isTeam2 ? (gs?.team2Picks||[]) : [];
  const myFormation = isTeam1 ? (gs?.team1Formation||'4-4-2') : (gs?.team2Formation||'4-4-2');
  const myTactics = isTeam1 ? (gs?.team1Tactics||{}) : (gs?.team2Tactics||{});
  const isMyTurn = (isTeam1 && gs?.currentTurn==='team1') || (isTeam2 && gs?.currentTurn==='team2');
  const isLocked = !!gs?.matchReady;
  const qrCodes = (gs?.qrCodes||[]).filter(q => q && q.trim());
  const teamColor = isTeam1 ? '#1565c0' : '#b71c1c';

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S = {
    page: { minHeight:'100vh', background:'#080c14', color:'#e0e0e0', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', display:'flex', flexDirection:'column' },
    card: (border) => ({ background:'#0f1623', border:'1px solid '+(border||'#1a2540'), borderRadius:12, padding:'16px', marginBottom:14 }),
    inp: { width:'100%', padding:'12px 14px', borderRadius:8, border:'1px solid #1e2f50', background:'#080c14', color:'#e0e0e0', fontSize:14, boxSizing:'border-box', marginBottom:10, outline:'none' },
    btn: (bg, disabled) => ({ background:disabled?'#1a2540':bg, color:disabled?'#4a5568':'#fff', border:'none', borderRadius:8, padding:'9px 16px', cursor:disabled?'not-allowed':'pointer', fontSize:13, fontWeight:600, margin:'3px 4px 3px 0', opacity:disabled?0.6:1, transition:'opacity 0.2s' }),
    err: { background:'rgba(183,28,28,0.15)', border:'1px solid #b71c1c', borderRadius:8, padding:'10px 14px', color:'#ef9a9a', fontSize:13, marginBottom:12 },
    header: { background:'#0a0e1a', borderBottom:'1px solid #1a2540', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  };

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  if (!joined && !isReferee) {
    return (
      <div style={{...S.page, alignItems:'center', justifyContent:'center', padding:20}}>
        <div style={{width:'100%', maxWidth:420}}>
          <div style={{textAlign:'center', marginBottom:28}}>
            <div style={{fontSize:56, marginBottom:8}}>🏟️</div>
            <h1 style={{margin:0, fontSize:26, fontWeight:900, color:'#4fc3f7', letterSpacing:1}}>RUHAGO N'INSHUTI</h1>
            <p style={{margin:'6px 0 0', color:'#3a4a6a', fontSize:13}}>Arena Fan Experience</p>
          </div>

          <div style={S.card('#1e3a5e')}>
            <h2 style={{margin:'0 0 14px', fontSize:15, color:'#f9a825', fontWeight:700}}>🎫 Fan Entry — MoMo Ticket</h2>
            {joinError && <div style={S.err}>❌ {joinError}</div>}
            <div style={{fontSize:11, color:'#4a6080', fontWeight:700, marginBottom:5, textTransform:'uppercase', letterSpacing:1}}>Your Full Name</div>
            <input style={S.inp} value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Enter your full name" onKeyDown={e=>e.key==='Enter'&&handleJoin()} />
            <div style={{fontSize:11, color:'#4a6080', fontWeight:700, marginBottom:5, textTransform:'uppercase', letterSpacing:1}}>MTN MoMo Transaction ID</div>
            <input style={S.inp} value={codeInput} onChange={e=>setCodeInput(e.target.value)} placeholder="e.g. 1234567890" onKeyDown={e=>e.key==='Enter'&&handleJoin()} />
            <button style={{...S.btn('#1565c0',joinLoading), width:'100%', padding:'13px', fontSize:15, marginTop:4}} onClick={handleJoin} disabled={joinLoading}>
              {joinLoading ? '⏳ Verifying payment…' : '🚪 Enter Arena'}
            </button>
            <p style={{fontSize:11, color:'#2a3a55', margin:'10px 0 0', textAlign:'center'}}>Your Transaction ID is the number from your MTN MoMo payment SMS</p>
          </div>

          <div style={{...S.card(), background:'#09101a'}}>
            <h3 style={{margin:'0 0 10px', fontSize:13, color:'#546e7a', fontWeight:700}}>🔐 Referee Access</h3>
            {refError && <div style={S.err}>{refError}</div>}
            <input style={{...S.inp, marginBottom:8}} type="password" value={refInput} onChange={e=>setRefInput(e.target.value)} placeholder="Referee token" onKeyDown={e=>e.key==='Enter'&&handleRefLogin()} />
            <button style={S.btn('#263238',false)} onClick={handleRefLogin}>🔓 Referee Login</button>
          </div>
        </div>
      </div>
    );
  }

  // ── REFEREE ─────────────────────────────────────────────────────────────────
  if (isReferee) {
    return (
      <div style={S.page}>
        {notification && <div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',background:'#0f1623',border:'1px solid #4fc3f7',color:'#fff',padding:'10px 20px',borderRadius:8,zIndex:9999,fontSize:13,boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>{notification}</div>}
        <div style={S.header}>
          <span style={{fontWeight:900, color:'#4fc3f7', fontSize:15}}>🏟️ REFEREE PANEL</span>
          <button style={S.btn('#1a2540',false)} onClick={()=>setIsReferee(false)}>← Exit</button>
        </div>
        <div style={{flex:1, overflowY:'auto', padding:14}}>
          <RefereeDashboard socket={socket} gameState={gs} isReferee={true} />
        </div>
      </div>
    );
  }

  // ── FAN (joined) ─────────────────────────────────────────────────────────────
  if (!gs) {
    return <div style={{...S.page,alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:48,marginBottom:12}}>⏳</div><p style={{color:'#3a4a6a'}}>Connecting to Arena…</p></div></div>;
  }

  return (
    <div style={S.page}>
      {notification && <div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',background:'#0f1623',border:'1px solid #4fc3f7',color:'#fff',padding:'10px 20px',borderRadius:8,zIndex:9999,fontSize:13}}>{notification}</div>}

      {/* Header */}
      <div style={S.header}>
        <span style={{fontWeight:900, color:'#4fc3f7', fontSize:15}}>🏟️ RUHAGO N'INSHUTI</span>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          {isPremium && <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:'#f9a825',color:'#000',fontWeight:800}}>⭐ VIP</span>}
          <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:myRole==='team1'?'#1565c0':myRole==='team2'?'#b71c1c':'#1a2540',color:'#fff'}}>
            {myRole==='team1'?'🔵 Team 1':myRole==='team2'?'🔴 Team 2':'👁️ Fan'}
          </span>
          <span style={{fontSize:11,color:'#4a6080'}}>{myName}</span>
        </div>
      </div>

      {/* Banner */}
      {gs.arenaBanner && (
        <img src={gs.arenaBanner} alt="Arena Banner" style={{width:'100%',maxHeight:200,objectFit:'cover',display:'block',flexShrink:0}} onError={e=>{e.target.style.display='none';}} />
      )}

      <div style={{flex:1, overflowY:'auto', padding:14}}>

        {/* Welcome message */}
        {gs.welcomeMessage && (
          <div style={{...S.card('#1a3a1a'), background:'rgba(30,70,30,0.3)', textAlign:'center', padding:'12px 16px', marginBottom:14}}>
            <span style={{color:'#81c784', fontSize:13}}>{gs.welcomeMessage}</span>
          </div>
        )}

        {/* Video + QR */}
        {(gs.youtubeLink || qrCodes.length > 0) && (
          <div style={{display:'flex', flexWrap:'wrap', gap:10, marginBottom:14, alignItems:'flex-start'}}>
            {gs.youtubeLink && (
              <a href={gs.youtubeLink} target="_blank" rel="noopener noreferrer"
                style={{display:'inline-flex',alignItems:'center',gap:8,background:'#b71c1c',color:'#fff',padding:'10px 18px',borderRadius:8,textDecoration:'none',fontSize:13,fontWeight:700}}>
                ▶️ Watch Live
              </a>
            )}
            {qrCodes.map((qr,i) => (
              <div key={i} style={{background:'#fff',borderRadius:8,padding:4,width:76,height:76}}>
                <img src={qr} alt={'QR '+(i+1)} style={{width:'100%',height:'100%',objectFit:'contain'}} onError={e=>{e.target.parentElement.style.display='none';}} />
              </div>
            ))}
          </div>
        )}

        {/* LOBBY — waiting for match */}
        {!gs.gameStarted && (
          <div style={{...S.card('#1a3a1a'), textAlign:'center', padding:'24px 16px'}}>
            <div style={{fontSize:40, marginBottom:10}}>✅</div>
            <h2 style={{margin:'0 0 8px', color:'#66bb6a', fontSize:18, fontWeight:800}}>Payment Verified!</h2>
            <p style={{color:'#4a6080', margin:'0 0 8px', fontSize:13}}>
              {isTeamPlayer
                ? 'You are assigned to ' + (isTeam1?'🔵 Team 1':'🔴 Team 2') + '. Waiting for the Referee to start the draft.'
                : '⏳ The match will begin shortly. Stay tuned!'}
            </p>
            <p style={{color:'#2a3a55', fontSize:12, margin:0}}>👥 {gs.allViewers?.length||0} fans connected</p>
          </div>
        )}

        {/* MATCH header bar */}
        {gs.gameStarted && (
          <div style={{...S.card(), marginBottom:14, padding:'12px 16px'}}>
            <div style={{display:'flex', justifyContent:'space-around', alignItems:'center', marginBottom:8}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:13, fontWeight:700, color:'#42a5f5'}}>{gs.team1Player?.name||'Team 1'}</div>
                <div style={{fontSize:11, color:'#4a6080'}}>{gs.team1Picks?.length||0}/11 cards</div>
              </div>
              <div style={{fontSize:22, fontWeight:900, color:'#2a3a55'}}>VS</div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:13, fontWeight:700, color:'#ef5350'}}>{gs.team2Player?.name||'Team 2'}</div>
                <div style={{fontSize:11, color:'#4a6080'}}>{gs.team2Picks?.length||0}/11 cards</div>
              </div>
            </div>
            <div style={{textAlign:'center'}}>
              {isLocked
                ? <span style={{fontSize:11,padding:'3px 12px',borderRadius:10,background:'#1b5e20',color:'#a5d6a7',fontWeight:700}}>🔒 Match Locked</span>
                : <span style={{fontSize:11,padding:'3px 12px',borderRadius:10,background:gs.currentTurn==='team1'?'#1565c0':'#b71c1c',color:'#fff',fontWeight:700}}>
                    {gs.currentTurn==='team1'?'🔵 Team 1 picking…':'🔴 Team 2 picking…'}
                  </span>}
            </div>
          </div>
        )}

        {/* TEAM PLAYER VIEW */}
        {isTeamPlayer && gs.gameStarted && (
          <div>
            {/* Formation selector */}
            {!isLocked && (
              <div style={{...S.card(), marginBottom:14}}>
                <div style={{fontSize:11, color:'#4a6080', fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:1}}>⚙️ Formation</div>
                <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                  {FORMATIONS.map(f => (
                    <button key={f} onClick={()=>socket.emit('playerSetFormation',{team:myRole,formation:f})}
                      style={{...S.btn(f===myFormation?'#00695c':'#1a2540',false), fontSize:12, padding:'5px 12px', border:'1px solid '+(f===myFormation?'#4db6ac':'#1e2f50')}}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pitch + picks */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14}}>
              <div>
                <div style={{fontSize:11, color:'#4a6080', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:1}}>
                  {selectedCard ? '📌 Tap slot to place' : '🗺️ Tactical Pitch'}
                </div>
                <TacticalPitch
                  formation={myFormation}
                  tactics={myTactics}
                  myPicks={myPicks}
                  isLocked={isLocked}
                  teamColor={teamColor}
                  onSlotClick={slotIndex => {
                    if (!selectedCard) return;
                    socket.emit('playerSetPosition', { cardId: selectedCard, slotIndex });
                    setSelectedCard(null);
                  }}
                />
              </div>
              <div>
                <div style={{fontSize:11, color:'#4a6080', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:1}}>🃏 My Picks ({myPicks.length}/11)</div>
                <div style={{display:'flex', flexDirection:'column', gap:5, maxHeight:370, overflowY:'auto'}}>
                  {myPicks.map(card => {
                    const sel = String(selectedCard) === String(card.id);
                    return (
                      <div key={card.id} onClick={()=>!isLocked&&setSelectedCard(sel?null:String(card.id))}
                        style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,background:sel?'#0d2040':'#0c1220',border:'1px solid '+(sel?'#42a5f5':'#1a2540'),cursor:isLocked?'default':'pointer',transition:'all 0.15s'}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:teamColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:900,color:'#fff',flexShrink:0}}>{card.rating}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:700,color:sel?'#90caf9':'#ccc',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.name}</div>
                          <div style={{fontSize:10,color:'#4a6080'}}>{card.position}</div>
                        </div>
                        {sel&&!isLocked&&<span style={{fontSize:10,color:'#42a5f5',flexShrink:0}}>→ place</span>}
                      </div>
                    );
                  })}
                  {myPicks.length===0&&<div style={{color:'#2a3a55',fontSize:12,padding:8}}>No picks yet — draft starts below.</div>}
                </div>
              </div>
            </div>

            {/* Draft pool */}
            {!isLocked && (
              <div style={S.card()}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{fontSize:11,color:'#4a6080',fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>🏪 Draft Pool ({gs.availableCards?.length||0} left)</div>
                  {isMyTurn
                    ? <span style={{fontSize:11,padding:'3px 10px',borderRadius:10,background:'#1b5e20',color:'#a5d6a7',fontWeight:700}}>✅ YOUR TURN — Pick a card</span>
                    : <span style={{fontSize:11,padding:'3px 10px',borderRadius:10,background:'#1a2540',color:'#4a6080'}}>⏳ Opponent picking…</span>}
                </div>
                {myPicks.length>=11
                  ? <div style={{color:'#66bb6a',fontSize:13,padding:'8px 0'}}>✅ Roster full! Place your players on the pitch.</div>
                  : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:8,maxHeight:280,overflowY:'auto'}}>
                      {(gs.availableCards||[]).map(c => (
                        <div key={c.id} onClick={()=>isMyTurn&&myPicks.length<11&&socket.emit('playerPickCard',c.id)}
                          style={{padding:'8px 10px',borderRadius:8,background:isMyTurn?'#0c1a2e':'#0a0f1a',border:'1px solid '+(isMyTurn?'#1e3a5e':'#141d2e'),cursor:isMyTurn?'pointer':'not-allowed',opacity:isMyTurn?1:0.45,transition:'all 0.15s'}}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <div style={{width:26,height:26,borderRadius:'50%',background:'#1a2540',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'#90caf9',flexShrink:0}}>{c.rating}</div>
                            <div style={{minWidth:0}}>
                              <div style={{fontSize:11,fontWeight:600,color:'#ccc',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                              <div style={{fontSize:10,color:'#4a6080'}}>{c.position}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>}
              </div>
            )}
          </div>
        )}

        {/* SPECTATOR VIEW */}
        {!isTeamPlayer && gs.gameStarted && (
          <div style={S.card()}>
            <h3 style={{margin:'0 0 12px',color:'#f9a825',fontSize:14,fontWeight:700}}>👁️ Live Match</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'#42a5f5',marginBottom:6}}>🔵 {gs.team1Player?.name||'Team 1'}</div>
                {(gs.team1Picks||[]).map((c,i)=>(
                  <div key={i} style={{fontSize:11,padding:'3px 0',borderBottom:'1px solid #1a2540',color:'#aaa',display:'flex',justifyContent:'space-between'}}>
                    <span>{c.name}</span><span style={{color:'#4a6080'}}>{c.position}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'#ef5350',marginBottom:6}}>🔴 {gs.team2Player?.name||'Team 2'}</div>
                {(gs.team2Picks||[]).map((c,i)=>(
                  <div key={i} style={{fontSize:11,padding:'3px 0',borderBottom:'1px solid #1a2540',color:'#aaa',display:'flex',justifyContent:'space-between'}}>
                    <span>{c.name}</span><span style={{color:'#4a6080'}}>{c.position}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VOTING */}
        {gs.votingAllowed && (
          <div style={S.card('#1a3a1a')}>
            <h3 style={{margin:'0 0 10px',color:'#f9a825',fontSize:14,fontWeight:700}}>🗳️ Cast Your Vote</h3>
            <FanVotingStage socket={socket} gameState={gs} myTxId={myTxId} />
          </div>
        )}
      </div>
    </div>
  );
}
