// src/FanVotingStage.js
import React, { useState, useMemo } from 'react';

function ScoreSlider({ name, role, value, onChange, disabled }) {
  const color = value >= 8 ? '#66bb6a' : value >= 6 ? '#f9a825' : value >= 4 ? '#ff7043' : '#ef5350';
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #1a2540'}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:600,color:'#ccc',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
        <div style={{fontSize:10,color:'#4a6080'}}>{role}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
        <input type="range" min={1} max={10} step={1} value={value} disabled={disabled}
          onChange={e=>onChange(Number(e.target.value))}
          style={{width:80,accentColor:color,cursor:disabled?'not-allowed':'pointer'}} />
        <div style={{width:24,textAlign:'center',fontSize:13,fontWeight:900,color:color}}>{value}</div>
      </div>
    </div>
  );
}

function getPlayers(match) {
  if (!match) return [];
  if (match.matchType === 'A') return [];
  // Type B — parse from players field or picks
  if (match.players && Array.isArray(match.players)) return match.players;
  // Try to extract from name list strings
  if (match.playerList && typeof match.playerList === 'string') {
    return match.playerList.split(',').map(s => {
      const m = s.trim().match(/^(.*?)\s*\(([^)]+)\)\s*$/);
      return m ? { name: m[1].trim(), role: m[2].trim() } : { name: s.trim(), role: '' };
    }).filter(p => p.name);
  }
  // Type A with picks — use both teams' picks as player list
  const p1 = (match.team1Picks || []).map(c => ({ name: c.name||'Unknown', role: c.position||'' }));
  const p2 = (match.team2Picks || []).map(c => ({ name: c.name||'Unknown', role: c.position||'' }));
  return [...p1, ...p2];
}

export default function FanVotingStage({ socket, gameState: gs, myTxId }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [teamVote, setTeamVote] = useState('');
  const [scores, setScores] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const votingMatches = useMemo(() => (gs?.votingMatches || []).filter(m => m.status === 'OPEN'), [gs]);
  const voteRegistry = gs?.voteRegistry || {};
  const typeAStats = gs?.typeAStats || {};
  const typeBStats = gs?.typeBStats || {};

  const hasVoted = (matchId) => {
    if (submitted[matchId]) return true;
    const reg = voteRegistry[matchId] || [];
    return reg.includes(myTxId);
  };

  const openMatch = (m) => {
    setSelectedMatch(m);
    setTeamVote('');
    setError('');
    setSuccess('');
    const players = getPlayers(m);
    const init = {};
    players.forEach(p => { init[p.name] = 5; });
    setScores(init);
  };

  const submitBallot = () => {
    if (!selectedMatch) return;
    setError('');
    if (selectedMatch.matchType === 'A') {
      if (!teamVote) { setError('Please select a team to vote for.'); return; }
      socket.emit('fanSubmitBallot', { txId: myTxId, matchId: selectedMatch.matchId, teamVote, matchType: 'A' });
    } else {
      if (Object.keys(scores).length === 0) { setError('No players to score.'); return; }
      socket.emit('fanSubmitBallot', { txId: myTxId, matchId: selectedMatch.matchId, scores, matchType: 'B' });
    }
    socket.once('ballotResult', res => {
      if (res.success) {
        setSubmitted(prev => ({ ...prev, [selectedMatch.matchId]: true }));
        setSuccess('✅ Vote submitted! Thank you.');
        setSelectedMatch(null);
      } else {
        setError(res.error || 'Vote failed. Please try again.');
      }
    });
  };

  if (!gs?.votingAllowed) {
    return (
      <div style={{textAlign:'center',padding:'20px 16px',color:'#4a6080',fontSize:13}}>
        ⏳ Voting is not open yet. Stay tuned!
      </div>
    );
  }

  if (votingMatches.length === 0) {
    return (
      <div style={{textAlign:'center',padding:'20px 16px',color:'#4a6080',fontSize:13}}>
        📋 No open matches to vote on right now.
      </div>
    );
  }

  const card = { background:'#0c1220', border:'1px solid #1a2540', borderRadius:10, padding:14, marginBottom:10 };
  const btn = (bg, disabled) => ({ background:disabled?'#1a2540':bg, color:disabled?'#4a6080':'#fff', border:'none', borderRadius:8, padding:'10px 18px', cursor:disabled?'not-allowed':'pointer', fontSize:13, fontWeight:700, margin:'4px 4px 0 0', opacity:disabled?0.5:1 });

  // ── Match selected ─────────────────────────────────────────────────────────
  if (selectedMatch) {
    const voted = hasVoted(selectedMatch.matchId);
    const players = getPlayers(selectedMatch);
    const aStats = typeAStats[selectedMatch.matchId] || {};
    const bStats = typeBStats[selectedMatch.matchId] || {};
    const totalAVotes = (aStats.team1Votes||0) + (aStats.team2Votes||0);

    return (
      <div>
        <button onClick={()=>setSelectedMatch(null)} style={{background:'none',border:'none',color:'#4a6080',cursor:'pointer',fontSize:13,padding:'0 0 10px',display:'flex',alignItems:'center',gap:4}}>
          ← Back to matches
        </button>

        <div style={card}>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:800,color:'#fff',marginBottom:2}}>{selectedMatch.name}</div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:selectedMatch.matchType==='A'?'#1565c0':'#4a148c',color:'#fff',fontWeight:700}}>Type {selectedMatch.matchType}</span>
              <span style={{fontSize:10,color:'#4a6080'}}>{selectedMatch.matchId}</span>
            </div>
          </div>

          {error && <div style={{background:'rgba(183,28,28,0.15)',border:'1px solid #b71c1c',borderRadius:8,padding:'8px 12px',color:'#ef9a9a',fontSize:12,marginBottom:10}}>❌ {error}</div>}
          {success && <div style={{background:'rgba(27,94,32,0.2)',border:'1px solid #2e7d32',borderRadius:8,padding:'8px 12px',color:'#a5d6a7',fontSize:12,marginBottom:10}}>{success}</div>}

          {voted ? (
            <div style={{textAlign:'center',padding:'16px 0'}}>
              <div style={{fontSize:28,marginBottom:8}}>✅</div>
              <div style={{fontSize:14,fontWeight:700,color:'#66bb6a',marginBottom:12}}>You already voted on this match!</div>
              {selectedMatch.matchType==='A' && (
                <div style={{display:'flex',justifyContent:'center',gap:24}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:24,fontWeight:900,color:'#42a5f5'}}>{aStats.team1Votes||0}</div>
                    <div style={{fontSize:11,color:'#4a6080'}}>🔵 {selectedMatch.coach1||'Team 1'}</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:24,fontWeight:900,color:'#ef5350'}}>{aStats.team2Votes||0}</div>
                    <div style={{fontSize:11,color:'#4a6080'}}>🔴 {selectedMatch.coach2||'Team 2'}</div>
                  </div>
                </div>
              )}
              {selectedMatch.matchType==='B' && Object.keys(bStats).length>0 && (
                <div style={{marginTop:8}}>
                  {Object.entries(bStats).sort((a,b)=>b[1]-a[1]).map(([name,avg])=>(
                    <div key={name} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0',borderBottom:'1px solid #1a2540',color:'#ccc'}}>
                      <span>{name}</span><span style={{color:'#f9a825',fontWeight:700}}>{avg}/10</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedMatch.matchType === 'A' ? (
            // TYPE A VOTE
            <div>
              <div style={{fontSize:12,color:'#4a6080',marginBottom:10}}>Who wins this match?</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                {[
                  {key:'team1',label:selectedMatch.coach1||'Team 1',color:'#1565c0',icon:'🔵'},
                  {key:'team2',label:selectedMatch.coach2||'Team 2',color:'#b71c1c',icon:'🔴'},
                ].map(t=>(
                  <div key={t.key} onClick={()=>setTeamVote(t.key)}
                    style={{padding:'16px 12px',borderRadius:10,textAlign:'center',cursor:'pointer',border:'2px solid '+(teamVote===t.key?t.color:'#1a2540'),background:teamVote===t.key?t.color+'22':'#080c14',transition:'all 0.15s'}}>
                    <div style={{fontSize:24,marginBottom:4}}>{t.icon}</div>
                    <div style={{fontSize:13,fontWeight:700,color:teamVote===t.key?'#fff':'#ccc'}}>{t.label}</div>
                    {totalAVotes>0 && (
                      <div style={{fontSize:11,color:'#4a6080',marginTop:4}}>
                        {aStats[t.key==='team1'?'team1Votes':'team2Votes']||0} vote(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button style={{...btn('#1565c0',!teamVote),width:'100%',padding:'12px'}} onClick={submitBallot}>
                🗳️ Submit Vote
              </button>
            </div>
          ) : (
            // TYPE B VOTE
            <div>
              <div style={{fontSize:12,color:'#4a6080',marginBottom:10}}>Rate each player (1–10)</div>
              <div style={{maxHeight:320,overflowY:'auto',marginBottom:12}}>
                {players.length===0
                  ? <div style={{color:'#2a3a55',fontSize:12,padding:'8px 0'}}>No players to score for this match.</div>
                  : players.map(p=>(
                      <ScoreSlider key={p.name} name={p.name} role={p.role} value={scores[p.name]||5}
                        onChange={v=>setScores(prev=>({...prev,[p.name]:v}))} disabled={false} />
                    ))}
              </div>
              <button style={{...btn('#4a148c',players.length===0),width:'100%',padding:'12px'}} onClick={submitBallot}>
                🗳️ Submit Ratings
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Match list ─────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{fontSize:11,color:'#4a6080',fontWeight:700,marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>
        Open Matches ({votingMatches.length})
      </div>
      {votingMatches.map(m => {
        const voted = hasVoted(m.matchId);
        const aStats = typeAStats[m.matchId] || {};
        const totalVotes = m.matchType==='A' ? (aStats.team1Votes||0)+(aStats.team2Votes||0) : 0;
        return (
          <div key={m.matchId} style={{...card, cursor:voted?'default':'pointer', opacity: voted ? 0.75 : 1}}
            onClick={()=>openMatch(m)}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.name}</div>
                <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:m.matchType==='A'?'#1565c0':'#4a148c',color:'#fff',fontWeight:700}}>Type {m.matchType}</span>
                  <span style={{fontSize:10,color:'#4a6080'}}>{totalVotes} vote(s)</span>
                  {voted && <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#1b5e20',color:'#a5d6a7',fontWeight:700}}>✅ Voted</span>}
                </div>
              </div>
              {!voted && <span style={{fontSize:16,marginLeft:10,color:'#42a5f5'}}>→</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
