// src/RefereeDashboard.js
import React, { useState, useEffect, useCallback } from 'react';

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

function MiniPitch({ formation, tactics, color, label }) {
  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-4-2'];
  return (
    <div>
      <div style={{fontSize:11,color:'#4a6080',fontWeight:700,marginBottom:4,textTransform:'uppercase',letterSpacing:1}}>{label} — {formation}</div>
      <div style={{position:'relative',width:'100%',paddingBottom:'100%',background:'linear-gradient(180deg,#1a5c24 0%,#1e6b2a 100%)',borderRadius:8,overflow:'hidden',border:'1px solid rgba(255,255,255,0.15)'}}>
        {slots.map((slot,idx)=>{
          const p=tactics&&tactics[idx];
          return (
            <div key={idx} style={{position:'absolute',top:slot.top+'%',left:slot.left+'%',transform:'translate(-50%,-50%)',textAlign:'center',zIndex:2}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:p?color:'rgba(255,255,255,0.1)',border:'1px solid '+(p?'#fff':'rgba(255,255,255,0.3)'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:6,fontWeight:700,color:'#fff',textShadow:'0 1px 2px rgba(0,0,0,0.9)'}}>
                {p?(p.name||'?').substring(0,4):slot.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TABS = ['Arena','Fans','Teams','Draft','Voting'];

export default function RefereeDashboard({ socket, gameState: gs, isReferee }) {
  const [tab, setTab] = useState('Arena');
  const [bannerUrl, setBannerUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [qrInputs, setQrInputs] = useState(['','','','','','']);
  const [msg, setMsg] = useState('');
  const [ballots, setBallots] = useState({});
  const [typeBUrl, setTypeBUrl] = useState('');
  const [typeBLoading, setTypeBLoading] = useState(false);

  function flash(m) { setMsg(m); setTimeout(()=>setMsg(''),3500); }

  // ── Arena tab ────────────────────────────────────────────────────────────────
  const sendBanner = () => { socket.emit('refSetBanner', bannerUrl.trim()||null); flash('✅ Banner updated'); };
  const sendYoutube = () => { socket.emit('refSetYoutube', youtubeUrl.trim()||null); flash('✅ YouTube link updated'); };
  const sendWelcome = () => { socket.emit('refSetWelcome', welcomeMsg.trim()); flash('✅ Welcome message updated'); };
  const sendQR = () => { socket.emit('refSetQRCodes', qrInputs); flash('✅ QR codes updated'); };

  // ── Voting tab ───────────────────────────────────────────────────────────────
  const loadBallots = (matchId) => {
    socket.emit('refGetBallots', { matchId });
  };
  useEffect(() => {
    socket.on('refBallotData', ({ matchId, ballots: b }) => {
      setBallots(prev => ({ ...prev, [matchId]: b }));
    });
    return () => socket.off('refBallotData');
  }, [socket]);

  const loadTypeBFromSheet = async () => {
    if (!typeBUrl.trim()) { flash('❌ Enter a Google Apps Script URL'); return; }
    setTypeBLoading(true);
    try {
      const r = await fetch(typeBUrl.trim() + '?action=getMatches');
      const data = await r.json();
      if (Array.isArray(data)) {
        socket.emit('refLoadTypeBMatches', data);
        flash('✅ Loaded ' + data.length + ' Type B match(es)');
      } else {
        flash('❌ Invalid response from script');
      }
    } catch (e) {
      flash('❌ Failed to load: ' + e.message);
    }
    setTypeBLoading(false);
  };

  if (!gs) return <div style={{color:'#4a6080',padding:20}}>Loading…</div>;

  const viewers = gs.allViewers || [];
  const unassigned = viewers.filter(v => v.role === 'spectator');
  const team1Viewer = viewers.find(v => v.role === 'team1');
  const team2Viewer = viewers.find(v => v.role === 'team2');

  // ── Styles ───────────────────────────────────────────────────────────────────
  const card = (border) => ({ background:'#0f1623', border:'1px solid '+(border||'#1a2540'), borderRadius:10, padding:14, marginBottom:12 });
  const inp = { width:'100%', padding:'10px 12px', borderRadius:7, border:'1px solid #1e2f50', background:'#080c14', color:'#e0e0e0', fontSize:13, boxSizing:'border-box', marginBottom:8, outline:'none' };
  const btn = (bg, disabled) => ({ background:disabled?'#1a2540':bg, color:disabled?'#4a6080':'#fff', border:'none', borderRadius:7, padding:'8px 14px', cursor:disabled?'not-allowed':'pointer', fontSize:12, fontWeight:600, margin:'3px 4px 3px 0', opacity:disabled?0.5:1 });
  const tabBtn = (active) => ({ background:active?'#1565c0':'#0f1623', color:active?'#fff':'#4a6080', border:'1px solid '+(active?'#1565c0':'#1a2540'), borderRadius:7, padding:'7px 14px', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.2s' });

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',color:'#e0e0e0'}}>
      {msg && <div style={{position:'sticky',top:0,background:'#0f1623',border:'1px solid #4fc3f7',color:'#4fc3f7',padding:'8px 14px',borderRadius:8,marginBottom:12,zIndex:100,fontSize:13,textAlign:'center'}}>{msg}</div>}

      {/* Tab bar */}
      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map(t => <button key={t} style={tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {/* ── ARENA TAB ─────────────────────────────────────────────────────────── */}
      {tab==='Arena' && (
        <div>
          <div style={card('#1e3a5e')}>
            <div style={{fontSize:13,fontWeight:700,color:'#4fc3f7',marginBottom:10}}>📊 Arena Status</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
              {[
                {label:'Fans Online',value:viewers.length,color:'#42a5f5'},
                {label:'Phase',value:gs.roomPhase,color:'#f9a825'},
                {label:'Voting',value:gs.votingAllowed?'OPEN':'CLOSED',color:gs.votingAllowed?'#66bb6a':'#ef5350'},
              ].map(s=>(
                <div key={s.label} style={{background:'#080c14',border:'1px solid #1a2540',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                  <div style={{fontSize:18,fontWeight:900,color:s.color}}>{s.value}</div>
                  <div style={{fontSize:10,color:'#4a6080',marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button style={btn('#b71c1c',false)} onClick={()=>{if(window.confirm('Reset all teams?'))socket.emit('refReset');}}>🔄 Reset Teams</button>
              <button style={btn('#1b5e20',false)} onClick={()=>socket.emit('refRestart')}>▶️ Restart Draft</button>
              <button style={btn('#4a0000',false)} onClick={()=>{if(window.confirm('CLEAR EVERYTHING?'))socket.emit('refClearArena');}}>🗑️ Clear Arena</button>
            </div>
          </div>

          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#4fc3f7',marginBottom:10}}>🖼️ Arena Media</div>
            <div style={{fontSize:11,color:'#4a6080',marginBottom:4,textTransform:'uppercase',letterSpacing:1}}>Banner Image URL</div>
            <input style={inp} value={bannerUrl} onChange={e=>setBannerUrl(e.target.value)} placeholder="https://example.com/banner.jpg" />
            <button style={btn('#1565c0',false)} onClick={sendBanner}>Set Banner</button>
            {gs.arenaBanner && <div style={{fontSize:11,color:'#4a6080',marginTop:4}}>Current: {gs.arenaBanner.substring(0,50)}…</div>}

            <div style={{borderTop:'1px solid #1a2540',margin:'12px 0'}}/>
            <div style={{fontSize:11,color:'#4a6080',marginBottom:4,textTransform:'uppercase',letterSpacing:1}}>YouTube / Video URL</div>
            <input style={inp} value={youtubeUrl} onChange={e=>setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            <button style={btn('#b71c1c',false)} onClick={sendYoutube}>Set Video</button>

            <div style={{borderTop:'1px solid #1a2540',margin:'12px 0'}}/>
            <div style={{fontSize:11,color:'#4a6080',marginBottom:4,textTransform:'uppercase',letterSpacing:1}}>Welcome Message</div>
            <input style={inp} value={welcomeMsg} onChange={e=>setWelcomeMsg(e.target.value)} placeholder="Welcome to tonight's match!" />
            <button style={btn('#00695c',false)} onClick={sendWelcome}>Set Message</button>
          </div>

          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#4fc3f7',marginBottom:10}}>📱 QR Codes (up to 6)</div>
            {qrInputs.map((q,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:11,color:'#4a6080',width:18,flexShrink:0}}>#{i+1}</span>
                <input style={{...inp,marginBottom:0,flex:1}} value={q} onChange={e=>{const n=[...qrInputs];n[i]=e.target.value;setQrInputs(n);}} placeholder={'QR image URL '+(i+1)} />
              </div>
            ))}
            <button style={btn('#1565c0',false)} onClick={sendQR}>💾 Save QR Codes</button>
          </div>
        </div>
      )}

      {/* ── FANS TAB ───────────────────────────────────────────────────────────── */}
      {tab==='Fans' && (
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:700,color:'#4fc3f7',marginBottom:12}}>👥 Connected Fans ({viewers.length})</div>
          {viewers.length===0 && <div style={{color:'#2a3a55',fontSize:13}}>No fans connected yet.</div>}
          {viewers.map(v=>(
            <div key={v.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderRadius:8,background:'#080c14',border:'1px solid #1a2540',marginBottom:6}}>
              <div>
                <span style={{fontSize:13,fontWeight:600,color:'#ccc'}}>{v.name}</span>
                <span style={{fontSize:10,color:'#4a6080',marginLeft:8}}>#{v.txId}</span>
                {v.isPremium && <span style={{fontSize:10,padding:'1px 6px',borderRadius:10,background:'#f57f17',color:'#000',fontWeight:700,marginLeft:6}}>VIP</span>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:v.role==='team1'?'#1565c0':v.role==='team2'?'#b71c1c':'#1a2540',color:'#fff'}}>
                  {v.role==='team1'?'🔵 T1':v.role==='team2'?'🔴 T2':'Fan'}
                </span>
                <button style={btn('#b71c1c',false)} onClick={()=>socket.emit('refRemoveViewer',{userId:v.id})}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TEAMS TAB ──────────────────────────────────────────────────────────── */}
      {tab==='Teams' && (
        <div>
          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#4fc3f7',marginBottom:12}}>🎯 Assign Team Players</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              <div style={{background:'#080c14',border:'1px solid #1565c0',borderRadius:8,padding:10,textAlign:'center'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#42a5f5',marginBottom:4}}>🔵 TEAM 1</div>
                <div style={{fontSize:13,color:team1Viewer?'#ccc':'#2a3a55'}}>{team1Viewer?team1Viewer.name:'Not assigned'}</div>
              </div>
              <div style={{background:'#080c14',border:'1px solid #b71c1c',borderRadius:8,padding:10,textAlign:'center'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#ef5350',marginBottom:4}}>🔴 TEAM 2</div>
                <div style={{fontSize:13,color:team2Viewer?'#ccc':'#2a3a55'}}>{team2Viewer?team2Viewer.name:'Not assigned'}</div>
              </div>
            </div>
            <div style={{fontSize:11,color:'#4a6080',marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>Unassigned Fans</div>
            {unassigned.length===0 && <div style={{color:'#2a3a55',fontSize:12}}>No unassigned fans.</div>}
            {unassigned.map(v=>(
              <div key={v.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderRadius:8,background:'#080c14',border:'1px solid #1a2540',marginBottom:6}}>
                <span style={{fontSize:13,color:'#ccc'}}>{v.name}</span>
                <div style={{display:'flex',gap:6}}>
                  <button style={btn('#1565c0',!!team1Viewer)} onClick={()=>socket.emit('refAssignRole',{userId:v.id,role:'team1'})}>→ Team 1</button>
                  <button style={btn('#b71c1c',!!team2Viewer)} onClick={()=>socket.emit('refAssignRole',{userId:v.id,role:'team2'})}>→ Team 2</button>
                </div>
              </div>
            ))}
          </div>

          {gs.gameStarted && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <MiniPitch formation={gs.team1Formation} tactics={gs.team1Tactics} color="#1565c0" label="🔵 Team 1" />
              <MiniPitch formation={gs.team2Formation} tactics={gs.team2Tactics} color="#b71c1c" label="🔴 Team 2" />
            </div>
          )}
        </div>
      )}

      {/* ── DRAFT TAB ──────────────────────────────────────────────────────────── */}
      {tab==='Draft' && (
        <div>
          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#4fc3f7',marginBottom:12}}>⚽ Draft Control</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
              <button style={btn('#1b5e20',gs.gameStarted)} onClick={()=>socket.emit('refStartDraft')}>▶️ Start Draft</button>
              <button style={btn('#1565c0',!gs.gameStarted||gs.matchReady)} onClick={()=>socket.emit('refLockMatch')}>🔒 Lock Match</button>
              <button style={btn('#f57f17',!gs.matchLocked||gs.matchReady)} onClick={()=>socket.emit('refMatchReady')}>✅ Mark Ready</button>
              <button style={btn('#4a148c',!gs.matchReady)} onClick={()=>socket.emit('refSaveLiveSession')}>💾 Save Session</button>
            </div>

            <div style={{background:'#080c14',border:'1px solid #1a2540',borderRadius:8,padding:12,marginBottom:10}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <div style={{fontSize:11,color:'#42a5f5',fontWeight:700,marginBottom:4}}>🔵 Team 1 — {gs.team1Picks?.length||0}/11</div>
                  {(gs.team1Picks||[]).map((c,i)=>(
                    <div key={i} style={{fontSize:11,padding:'2px 0',borderBottom:'1px solid #1a2540',color:'#aaa',display:'flex',justifyContent:'space-between'}}>
                      <span>{c.name}</span><span style={{color:'#4a6080'}}>{c.position}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:11,color:'#ef5350',fontWeight:700,marginBottom:4}}>🔴 Team 2 — {gs.team2Picks?.length||0}/11</div>
                  {(gs.team2Picks||[]).map((c,i)=>(
                    <div key={i} style={{fontSize:11,padding:'2px 0',borderBottom:'1px solid #1a2540',color:'#aaa',display:'flex',justifyContent:'space-between'}}>
                      <span>{c.name}</span><span style={{color:'#4a6080'}}>{c.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{fontSize:11,color:'#4a6080'}}>
              {gs.matchLocked && <span style={{color:'#ef5350',marginRight:8}}>🔒 Locked</span>}
              {gs.matchReady && <span style={{color:'#66bb6a',marginRight:8}}>✅ Ready</span>}
              Turn: <strong style={{color:gs.currentTurn==='team1'?'#42a5f5':'#ef5350'}}>{gs.currentTurn==='team1'?'Team 1':'Team 2'}</strong>
              {' · '}{gs.availableCards?.length||0} cards remaining
            </div>
          </div>
        </div>
      )}

      {/* ── VOTING TAB ─────────────────────────────────────────────────────────── */}
      {tab==='Voting' && (
        <div>
          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#4fc3f7',marginBottom:10}}>🗳️ Voting Gate</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
              <button style={btn('#1b5e20',gs.votingAllowed)} onClick={()=>socket.emit('refToggleVotingGate',{allowed:true,mode:'BOTH'})}>🟢 Open Voting</button>
              <button style={btn('#b71c1c',!gs.votingAllowed)} onClick={()=>socket.emit('refToggleVotingGate',{allowed:false,mode:'BOTH'})}>🔴 Close Voting</button>
            </div>
            <div style={{fontSize:12,color:'#4a6080'}}>
              Status: <strong style={{color:gs.votingAllowed?'#66bb6a':'#ef5350'}}>{gs.votingAllowed?'OPEN':'CLOSED'}</strong>
            </div>
          </div>

          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#4fc3f7',marginBottom:10}}>📋 Load Type B Matches</div>
            <input style={inp} value={typeBUrl} onChange={e=>setTypeBUrl(e.target.value)} placeholder="Apps Script URL ending in /exec" />
            <button style={btn('#1565c0',typeBLoading)} onClick={loadTypeBFromSheet} disabled={typeBLoading}>
              {typeBLoading?'Loading…':'📥 Load from Google Sheet'}
            </button>
          </div>

          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#4fc3f7',marginBottom:10}}>📊 Match Sessions ({(gs.votingMatches||[]).length})</div>
            {(gs.votingMatches||[]).length===0 && <div style={{color:'#2a3a55',fontSize:12}}>No sessions saved yet.</div>}
            {(gs.votingMatches||[]).map(m => {
              const aStats = (gs.typeAStats||{})[m.matchId] || {};
              const bStats = (gs.typeBStats||{})[m.matchId] || {};
              const myBallots = ballots[m.matchId];
              const totalVotes = m.matchType==='A'
                ? ((aStats.team1Votes||0)+(aStats.team2Votes||0))
                : Object.keys(bStats).length;
              return (
                <div key={m.matchId} style={{background:'#080c14',border:'1px solid #1a2540',borderRadius:8,padding:12,marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                    <div>
                      <span style={{fontSize:12,fontWeight:700,color:'#ccc'}}>{m.name}</span>
                      <span style={{fontSize:10,padding:'1px 7px',borderRadius:10,background:m.matchType==='A'?'#1565c0':'#4a148c',color:'#fff',marginLeft:6}}>Type {m.matchType}</span>
                    </div>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:m.status==='OPEN'?'#1b5e20':'#4a0000',color:m.status==='OPEN'?'#a5d6a7':'#ef9a9a',fontWeight:700}}>{m.status}</span>
                  </div>
                  <div style={{fontSize:11,color:'#4a6080',marginBottom:8}}>{totalVotes} vote(s) · {m.matchId}</div>
                  {m.matchType==='A' && aStats.team1Votes!==undefined && (
                    <div style={{display:'flex',gap:8,marginBottom:6}}>
                      <span style={{fontSize:11,color:'#42a5f5'}}>🔵 {aStats.team1Votes||0}</span>
                      <span style={{fontSize:11,color:'#ef5350'}}>🔴 {aStats.team2Votes||0}</span>
                    </div>
                  )}
                  {m.matchType==='B' && Object.keys(bStats).length>0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:6}}>
                      {Object.entries(bStats).map(([name,avg])=>(
                        <span key={name} style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#1a2540',color:'#90caf9'}}>{name}: {avg}</span>
                      ))}
                    </div>
                  )}
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    <button style={btn('#1b5e20',m.status==='OPEN')} onClick={()=>socket.emit('refToggleVotingStatus',{matchId:m.matchId,newStatus:'OPEN'})}>Open</button>
                    <button style={btn('#b71c1c',m.status==='CLOSED')} onClick={()=>socket.emit('refToggleVotingStatus',{matchId:m.matchId,newStatus:'CLOSED'})}>Close</button>
                    <button style={btn('#1565c0',false)} onClick={()=>loadBallots(m.matchId)}>
                      {myBallots?'🔄 Refresh':'📋 Ballots'}
                    </button>
                  </div>
                  {myBallots && (
                    <div style={{marginTop:8,maxHeight:120,overflowY:'auto',background:'#0a0f1a',borderRadius:6,padding:8}}>
                      {myBallots.length===0
                        ? <div style={{fontSize:11,color:'#2a3a55'}}>No ballots yet.</div>
                        : myBallots.map((b,i)=>(
                            <div key={i} style={{fontSize:10,padding:'2px 0',borderBottom:'1px solid #1a2540',color:'#888',display:'flex',justifyContent:'space-between'}}>
                              <span>{b.txId}</span>
                              <span>{b.teamVote||JSON.stringify(b.scores||{}).substring(0,40)}</span>
                            </div>
                          ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
