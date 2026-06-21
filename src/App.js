$ cat > /home/user/fixed/App.js << 'ENDOFFILE'
// src/App.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import RefereeDashboard from './RefereeDashboard';
import FanVotingStage from './FanVotingStage';

const BACKEND_URL = "https://football-backend-ykso.onrender.com";
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
    {label:'ST1',top:25,left:35},{label:'ST2',top:25,left:65},
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

function TacticalPitch({ formation, tactics, myPicks, onSlotClick, isLocked, teamColor }) {
  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-4-2'];
  return (
    <div style={{position:'relative',width:'100%',paddingBottom:'130%',background:'linear-gradient(180deg,#1a6b2a 0%,#1e7a30 50%,#1a6b2a 100%)',border:'2px solid #fff',borderRadius:10,overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'50%',left:0,right:0,height:1,background:'rgba(255,255,255,0.4)'}}/>
        <div style={{position:'absolute',top:'44%',left:'20%',right:'20%',bottom:'3%',border:'1px solid rgba(255,255,255,0.3)',borderRadius:2}}/>
        <div style={{position:'absolute',top:'2%',left:'20%',right:'20%',height:'10%',border:'1px solid rgba(255,255,255,0.3)'}}/>
      </div>
      {slots.map((slot,idx)=>{
        const placed=tactics[idx];
        return (
          <div key={idx} onClick={()=>!isLocked&&onSlotClick&&onSlotClick(idx)}
            style={{position:'absolute',top:`${slot.top}%`,left:`${slot.left}%`,transform:'translate(-50%,-50%)',zIndex:10,textAlign:'center',cursor:isLocked?'default':'pointer'}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:placed?teamColor:'rgba(255,255,255,0.15)',border:`2px solid ${placed?'#fff':'rgba(255,255,255,0.4)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:'#fff',textShadow:'0 1px 3px rgba(0,0,0,0.9)'}}>
              {placed?(placed.name||'?').substring(0,4):slot.label}
            </div>
            {placed&&<div style={{position:'absolute',top:'105%',left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.75)',color:'#fff',fontSize:7,padding:'1px 4px',borderRadius:2,whiteSpace:'nowrap',maxWidth:56,overflow:'hidden',textOverflow:'ellipsis'}}>{(placed.name||'').substring(0,9)}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = {
  page: {minHeight:'100vh',background:'#0a0a14',color:'#eee',fontFamily:"'Segoe UI',sans-serif",display:'flex',flexDirection:'column'},
  card: {background:'#111827',border:'1px solid #1e2940',borderRadius:12,padding:20,marginBottom:16},
  btn: (bg,dis)=>({background:dis?'#2a2a3e':bg,color:dis?'#666':'#fff',border:'none',borderRadius:8,padding:'10px 18px',cursor:dis?'not-allowed':'pointer',fontSize:14,fontWeight:600,opacity:dis?0.6:1,margin:'3px 4px 3px 0',transition:'all 0.15s'}),
  inp: {width:'100%',padding:'12px 14px',borderRadius:8,border:'1px solid #2a3550',background:'#0d1117',color:'#eee',fontSize:14,boxSizing:'border-box',marginBottom:10,outline:'none'},
  lbl: {display:'block',fontSize:12,color:'#8899bb',marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5},
  err: {background:'rgba(239,83,80,0.15)',border:'1px solid #ef5350',borderRadius:8,padding:'10px 14px',color:'#ef9a9a',fontSize:13,marginBottom:12},
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
function App() {
  // Single source of truth: what phase the user is in
  // 'login' → not verified yet
  // 'verified' → payment OK, inside the app
  const [phase, setPhase] = useState('login');

  // Login form
  const [loginName, setLoginName]   = useState('');
  const [loginCode, setLoginCode]   = useState('');
  const [loginErr,  setLoginErr]    = useState('');
  const [loginBusy, setLoginBusy]   = useState(false);

  // Referee
  const [isRef,      setIsRef]      = useState(false);
  const [refToken,   setRefToken]   = useState('');
  const [refErr,     setRefErr]     = useState('');

  // My identity
  const [myTxId,    setMyTxId]      = useState('');
  const [myName,    setMyName]      = useState('');
  const [isPremium, setIsPremium]   = useState(false);

  // Game state from server
  const [gs,        setGs]          = useState(null);

  // Draft UI
  const [selCard,   setSelCard]     = useState(null);

  // Toast
  const [toast,     setToast]       = useState('');
  const toastRef = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(()=>setToast(''), 3500);
  };

  // ── Socket wiring ──────────────────────────────────────────────────────────
  useEffect(()=>{
    function onState(data){ setGs(data); }

    function onJoinResult({ success, error, isPremium: prem }){
      setLoginBusy(false);
      if(success){
        setIsPremium(!!prem);
        setPhase('verified');   // ← THE gate: only enters app if server says valid
        setLoginErr('');
      } else {
        setLoginErr(error || 'Payment not found. Check your MoMo transaction ID.');
      }
    }

    function onRefConfirm(ok){
      if(ok){ setIsRef(true); setRefErr(''); setPhase('verified'); }
      else   { setRefErr('Wrong token.'); }
    }

    function onErr(msg){ showToast('⚠️ '+msg); }

    function onClear(){
      setPhase('login'); setMyTxId(''); setMyName('');
      setIsPremium(false); setIsRef(false); setGs(null);
    }

    socket.on('gameStateUpdate', onState);
    socket.on('joinResult',      onJoinResult);
    socket.on('refConfirm',      onRefConfirm);
    socket.on('error',           onErr);
    socket.on('clearArenaForce', onClear);
    return ()=>{
      socket.off('gameStateUpdate', onState);
      socket.off('joinResult',      onJoinResult);
      socket.off('refConfirm',      onRefConfirm);
      socket.off('error',           onErr);
      socket.off('clearArenaForce', onClear);
    };
  },[]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const doJoin = useCallback(()=>{
    const n=loginName.trim(), c=loginCode.trim();
    if(!n){ setLoginErr('Enter your name.'); return; }
    if(!c){ setLoginErr('Enter your MoMo transaction ID.'); return; }
    setLoginErr(''); setLoginBusy(true);
    setMyTxId(c); setMyName(n);
    socket.emit('joinWaitingRoom',{ name:n, ticketCode:c });
  },[loginName,loginCode]);

  const doRefLogin = useCallback(()=>{
    if(!refToken.trim()){ setRefErr('Enter token.'); return; }
    socket.emit('claimReferee', refToken.trim());
  },[refToken]);

  const doPick = useCallback((cardId)=>{
    socket.emit('playerPickCard', cardId);
    setSelCard(null);
  },[]);

  const doFormation = useCallback((f)=>{
    if(!gs) return;
    const myRole = gs.allViewers?.find(v=>v.txId===myTxId)?.role;
    if(myRole==='team1'||myRole==='team2')
      socket.emit('playerSetFormation',{team:myRole,formation:f});
  },[gs,myTxId]);

  const doSlot = useCallback((slotIndex)=>{
    if(!selCard) return;
    socket.emit('playerSetPosition',{cardId:selCard,slotIndex});
    setSelCard(null);
  },[selCard]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const myViewer   = gs?.allViewers?.find(v=>v.txId===myTxId);
  const myRole     = myViewer?.role||'spectator';
  const isTeam1    = myRole==='team1';
  const isTeam2    = myRole==='team2';
  const isTeamPl   = isTeam1||isTeam2;
  const myPicks    = isTeam1?(gs?.team1Picks||[]):isTeam2?(gs?.team2Picks||[]):[];
  const myForm     = isTeam1?(gs?.team1Formation||'4-4-2'):isTeam2?(gs?.team2Formation||'4-4-2'):'4-4-2';
  const myTactics  = isTeam1?(gs?.team1Tactics||{}):(gs?.team2Tactics||{});
  const isMyTurn   = (isTeam1&&gs?.currentTurn==='team1')||(isTeam2&&gs?.currentTurn==='team2');
  const isLocked   = !!gs?.matchReady;
  const qrList     = (gs?.qrCodes||[]).filter(q=>q&&q.trim()!=='');

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: LOGIN SCREEN  (phase === 'login')
  // ══════════════════════════════════════════════════════════════════════════
  if(phase==='login'){
    return (
      <div style={{...S.page,alignItems:'center',justifyContent:'center',padding:20}}>
        <div style={{width:'100%',maxWidth:420}}>
          <div style={{textAlign:'center',marginBottom:28}}>
            <div style={{fontSize:52,marginBottom:6}}>🏟️</div>
            <h1 style={{margin:0,fontSize:24,fontWeight:900,color:'#4fc3f7',letterSpacing:-0.5}}>RUHAGO N'INSHUTI</h1>
            <p style={{margin:'4px 0 0',color:'#445577',fontSize:13}}>Arena Fan Experience</p>
          </div>

          {/* Fan entry */}
          <div style={S.card}>
            <h2 style={{margin:'0 0 16px',fontSize:15,color:'#f9a825'}}>🎫 Enter with MoMo Ticket</h2>
            {loginErr && <div style={S.err}>❌ {loginErr}</div>}
            <label style={S.lbl}>Your Name</label>
            <input style={S.inp} value={loginName} onChange={e=>setLoginName(e.target.value)}
              placeholder="Enter your full name"
              onKeyDown={e=>e.key==='Enter'&&doJoin()} />
            <label style={S.lbl}>MoMo Transaction ID</label>
            <input style={S.inp} value={loginCode} onChange={e=>setLoginCode(e.target.value)}
              placeholder="e.g. 123456789012"
              onKeyDown={e=>e.key==='Enter'&&doJoin()} />
            <button style={{...S.btn(loginBusy?'#333':'#1565c0',loginBusy),width:'100%',padding:'13px 18px',fontSize:15}}
              onClick={doJoin} disabled={loginBusy}>
              {loginBusy ? '⏳ Verifying payment…' : '🚪 Enter Arena'}
            </button>
            <p style={{fontSize:11,color:'#334455',margin:'10px 0 0',textAlign:'center'}}>
              Use the transaction ID from your MTN MoMo SMS
            </p>
          </div>

          {/* Referee */}
          <div style={{...S.card,background:'#0d0d1f',border:'1px solid #1a1a3e'}}>
            <h3 style={{margin:'0 0 10px',fontSize:13,color:'#7986cb'}}>🔐 Referee Access</h3>
            {refErr && <div style={S.err}>{refErr}</div>}
            <input style={{...S.inp,marginBottom:8}} type="password" value={refToken}
              onChange={e=>setRefToken(e.target.value)} placeholder="Referee token"
              onKeyDown={e=>e.key==='Enter'&&doRefLogin()} />
            <button style={S.btn('#303f9f',false)} onClick={doRefLogin}>🔓 Login as Referee</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: VERIFIED — Referee dashboard
  // ══════════════════════════════════════════════════════════════════════════
  if(phase==='verified' && isRef){
    return (
      <div style={S.page}>
        {toast && <div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',background:'#1e1e3e',border:'1px solid #4fc3f7',color:'#fff',padding:'10px 20px',borderRadius:8,zIndex:9999,fontSize:13}}>{toast}</div>}
        <div style={{background:'#0d0d1f',borderBottom:'1px solid #1e1e3e',padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <span style={{fontWeight:900,color:'#4fc3f7',fontSize:15}}>🏟️ REFEREE PANEL</span>
          <button style={S.btn('#333',false)} onClick={()=>{setIsRef(false);setPhase('login');}}>← Exit</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:16}}>
          <RefereeDashboard socket={socket} gameState={gs} isReferee={true}/>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: VERIFIED — Fan / Team player
  // ══════════════════════════════════════════════════════════════════════════
  if(phase==='verified'){
    // While game state loads
    if(!gs) return (
      <div style={{...S.page,alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center'}}><div style={{fontSize:48,marginBottom:12}}>⏳</div><p style={{color:'#445566'}}>Connecting…</p></div>
      </div>
    );

    return (
      <div style={S.page}>
        {/* Toast */}
        {toast && <div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',background:'#1e1e3e',border:'1px solid #4fc3f7',color:'#fff',padding:'10px 20px',borderRadius:8,zIndex:9999,fontSize:13}}>{toast}</div>}

        {/* ── HEADER ── */}
        <div style={{background:'#0d0d1f',borderBottom:'1px solid #1e1e3e',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <span style={{fontSize:15,fontWeight:900,color:'#4fc3f7'}}>🏟️ RUHAGO N'INSHUTI</span>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {isPremium && <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:'#f9a825',color:'#000',fontWeight:700}}>⭐ VIP</span>}
            <span style={{fontSize:12,padding:'2px 8px',borderRadius:10,
              background:myRole==='team1'?'#1565c0':myRole==='team2'?'#b71c1c':'#2a2a3e',color:'#fff'}}>
              {myRole==='team1'?'🔵 Team 1':myRole==='team2'?'🔴 Team 2':'👁️ Fan'}
            </span>
            <span style={{fontSize:12,color:'#445566'}}>{myName}</span>
          </div>
        </div>

        {/* ── ARENA BANNER ── */}
        {gs.arenaBanner && gs.arenaBanner.trim()!=='' && (
          <img src={gs.arenaBanner} alt="Arena Banner"
            style={{width:'100%',maxHeight:180,objectFit:'cover',display:'block',flexShrink:0}}
            onError={e=>{e.target.style.display='none';}}/>
        )}

        <div style={{flex:1,overflowY:'auto',padding:14,maxWidth:900,margin:'0 auto',width:'100%',boxSizing:'border-box'}}>

          {/* ── VIDEO + QR CODES ── */}
          {(gs.youtubeLink||qrList.length>0) && (
            <div style={{...S.card,display:'flex',flexWrap:'wrap',alignItems:'center',gap:14,padding:14,marginBottom:14}}>
              {gs.youtubeLink && gs.youtubeLink.trim()!=='' && (
                <a href={gs.youtubeLink} target="_blank" rel="noopener noreferrer"
                  style={{display:'inline-flex',alignItems:'center',gap:8,background:'#b71c1c',color:'#fff',padding:'10px 18px',borderRadius:8,textDecoration:'none',fontSize:13,fontWeight:700}}>
                  ▶️ Watch Video
                </a>
              )}
              {qrList.map((qr,i)=>(
                <div key={i} style={{background:'#fff',borderRadius:6,padding:4,width:80,height:80,flexShrink:0}}>
                  <img src={qr} alt={`QR ${i+1}`}
                    style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:4}}
                    onError={e=>{e.target.parentElement.style.display='none';}}/>
                </div>
              ))}
            </div>
          )}

          {/* ── LOBBY: game not started yet ── */}
          {!gs.gameStarted && (
            <div style={{...S.card,textAlign:'center',borderColor:'#2e7d32'}}>
              <div style={{fontSize:36,marginBottom:8}}>✅</div>
              <h2 style={{margin:'0 0 6px',color:'#66bb6a',fontSize:18}}>
                {isPremium?'⭐ VIP Access Granted!':'🎫 Payment Verified!'}
              </h2>
              <p style={{color:'#8899bb',margin:'0 0 10px',fontSize:14}}>
                {isTeamPl
                  ? `You are ${myRole==='team1'?'🔵 Team 1':'🔴 Team 2'}. Waiting for Referee to start.`
                  : '⏳ Match starting soon. You\'re in the lobby!'}
              </p>
              <p style={{color:'#445566',fontSize:12,margin:0}}>👥 {gs.allViewers?.length||0} fans connected</p>
            </div>
          )}

          {/* ── MATCH SCOREBOARD ── */}
          {gs.gameStarted && (
            <div style={{...S.card,padding:14,marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-around',alignItems:'center'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#42a5f5'}}>{gs.team1Player?.name||'Team 1'}</div>
                  <div style={{fontSize:11,color:'#445566'}}>{gs.team1Picks?.length||0}/11</div>
                </div>
                <div style={{fontSize:20,fontWeight:900,color:'#444'}}>VS</div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#ef5350'}}>{gs.team2Player?.name||'Team 2'}</div>
                  <div style={{fontSize:11,color:'#445566'}}>{gs.team2Picks?.length||0}/11</div>
                </div>
              </div>
              <div style={{textAlign:'center',marginTop:8}}>
                <span style={{fontSize:11,padding:'3px 12px',borderRadius:10,
                  background:gs.currentTurn==='team1'?'#1565c0':'#b71c1c',color:'#fff'}}>
                  {gs.currentTurn==='team1'?'🔵 Team 1\'s turn':'🔴 Team 2\'s turn'}
                </span>
                {isLocked && <span style={{fontSize:11,padding:'3px 12px',borderRadius:10,background:'#2e7d32',color:'#fff',marginLeft:8}}>🔒 Locked</span>}
              </div>
            </div>
          )}

          {/* ── TEAM PLAYER DRAFT & TACTICS ── */}
          {isTeamPl && gs.gameStarted && (
            <>
              {/* Formation */}
              {!isLocked && (
                <div style={{...S.card,marginBottom:14}}>
                  <div style={{fontSize:11,color:'#8899bb',fontWeight:700,marginBottom:8,textTransform:'uppercase'}}>⚙️ Formation</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {FORMATIONS.map(f=>(
                      <button key={f}
                        style={{...S.btn(f===myForm?'#00695c':'#1a2540',false),padding:'6px 12px',fontSize:12,
                          border:`1px solid ${f===myForm?'#4db6ac':'#2a3550'}`}}
                        onClick={()=>doFormation(f)}>{f}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pitch + Picks */}
              <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:14,marginBottom:14}}>
                <div>
                  <div style={{fontSize:11,color:'#8899bb',fontWeight:700,marginBottom:6,textTransform:'uppercase'}}>
                    {selCard
                      ? `📌 Click slot → place: ${myPicks.find(c=>String(c.id)===selCard)?.name||selCard}`
                      : '🗺️ Tactical Pitch'}
                  </div>
                  <TacticalPitch formation={myForm} tactics={myTactics} myPicks={myPicks}
                    onSlotClick={doSlot} isLocked={isLocked}
                    teamColor={isTeam1?'#1565c0':'#b71c1c'}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:'#8899bb',fontWeight:700,marginBottom:6,textTransform:'uppercase'}}>🃏 My Picks ({myPicks.length}/11)</div>
                  <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:380,overflowY:'auto'}}>
                    {myPicks.map(card=>{
                      const isSel=selCard===String(card.id);
                      return (
                        <div key={card.id}
                          onClick={()=>!isLocked&&setSelCard(isSel?null:String(card.id))}
                          style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:7,
                            background:isSel?'#1a3a6e':'#0d1117',
                            border:`1px solid ${isSel?'#42a5f5':'#1e2940'}`,
                            cursor:isLocked?'default':'pointer',transition:'all 0.15s'}}>
                          <div style={{width:28,height:28,borderRadius:'50%',background:isTeam1?'#1565c0':'#b71c1c',
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#fff',flexShrink:0}}>
                            {card.rating||'?'}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:700,color:isSel?'#90caf9':'#ddd',
                              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.name}</div>
                            <div style={{fontSize:10,color:'#556'}}>{card.position}</div>
                          </div>
                          {isSel&&!isLocked&&<span style={{fontSize:10,color:'#42a5f5',flexShrink:0}}>→ place</span>}
                        </div>
                      );
                    })}
                    {myPicks.length===0&&<div style={{color:'#445566',fontSize:12,padding:8}}>No picks yet — draft below!</div>}
                  </div>
                </div>
              </div>

              {/* Draft pool */}
              {!isLocked && (
                <div style={S.card}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                    <div style={{fontSize:11,color:'#8899bb',fontWeight:700,textTransform:'uppercase'}}>
                      🏪 Draft Pool ({gs.availableCards?.length||0} left)
                    </div>
                    {isMyTurn
                      ? <span style={{fontSize:11,padding:'3px 10px',borderRadius:10,background:'#00695c',color:'#fff',fontWeight:700}}>✅ Your turn!</span>
                      : <span style={{fontSize:11,padding:'3px 10px',borderRadius:10,background:'#2a2a3e',color:'#666'}}>⏳ Opponent's turn</span>}
                  </div>
                  {myPicks.length>=11
                    ? <p style={{color:'#66bb6a',fontWeight:700,margin:0}}>✅ Roster full! Now arrange on the pitch.</p>
                    : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,maxHeight:300,overflowY:'auto'}}>
                        {(gs.availableCards||[]).map(card=>(
                          <div key={card.id}
                            onClick={()=>isMyTurn&&myPicks.length<11&&doPick(card.id)}
                            style={{padding:'8px 10px',borderRadius:8,
                              background:isMyTurn?'#0d1929':'#0a0a14',
                              border:`1px solid ${isMyTurn?'#1e3a5e':'#1a1a2a'}`,
                              cursor:isMyTurn?'pointer':'not-allowed',opacity:isMyTurn?1:0.5,transition:'all 0.15s'}}>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div style={{width:26,height:26,borderRadius:'50%',background:'#1e2940',
                                display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'#90caf9',flexShrink:0}}>
                                {card.rating||'?'}
                              </div>
                              <div style={{minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:600,color:'#ddd',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.name}</div>
                                <div style={{fontSize:10,color:'#556'}}>{card.position}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              )}
            </>
          )}

          {/* ── SPECTATOR VIEW ── */}
          {!isTeamPl && gs.gameStarted && (
            <div style={S.card}>
              <h3 style={{margin:'0 0 12px',color:'#f9a825',fontSize:14}}>👁️ Live Match</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:'#42a5f5',marginBottom:6}}>🔵 {gs.team1Player?.name||'Team 1'}</div>
                  {(gs.team1Picks||[]).map((c,i)=>(
                    <div key={i} style={{fontSize:11,padding:'3px 0',borderBottom:'1px solid #1e1e3e',color:'#ccc'}}>
                      {c.name} <span style={{color:'#445566'}}>{c.position}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:'#ef5350',marginBottom:6}}>🔴 {gs.team2Player?.name||'Team 2'}</div>
                  {(gs.team2Picks||[]).map((c,i)=>(
                    <div key={i} style={{fontSize:11,padding:'3px 0',borderBottom:'1px solid #1e1e3e',color:'#ccc'}}>
                      {c.name} <span style={{color:'#445566'}}>{c.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── VOTING ── */}
          {gs.votingAllowed && (
            <div style={S.card}>
              <h3 style={{margin:'0 0 10px',color:'#f9a825',fontSize:14}}>🗳️ Cast Your Vote</h3>
              <FanVotingStage socket={socket} gameState={gs} myTxId={myTxId}/>
            </div>
          )}

        </div>
      </div>
    );
  }

  return null;
}

export default App;
ENDOFFILE

echo "Lines: $(wc -l < /home/user/fixed/App.js)"
node -e "
const fs=require('fs');
const c=fs.readFileSync('/home/user/fixed/App.js','utf8');
let o=0,cl=0;
for(const ch of c){if(ch==='{')o++;if(ch==='}')cl++;}
console.log('Braces {',o,'} ',cl, o===cl?'✅':'❌ MISMATCH');
const parens=c.match(/\(/g)||[];const parens2=c.match(/\)/g)||[];
console.log('Parens (',parens.length,')',parens2.length,parens.length===parens2.length?'✅':'❌ MISMATCH');
"
