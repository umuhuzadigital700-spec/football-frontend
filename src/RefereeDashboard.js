import React, { useState, useEffect } from 'react';

function RefereeDashboard({ socket, gameState, isReferee }) {
  // 1. Move ALL Hooks to the very top so they always run
  const [matchInput1, setMatchInput1] = useState('');
  const [matchInput2, setMatchInput2] = useState('');

  useEffect(() => {
    if (gameState && gameState.currentMatch) {
      setMatchInput1(gameState.currentMatch.team1Title || '');
      setMatchInput2(gameState.currentMatch.team2Title || '');
    }
  }, [gameState]);

  useEffect(() => {
    // Keep this hook active at the top level
  }, []);

  // 2. NOW we check if the user is a referee. If not, we safely render nothing.
  if (!isReferee) return null;

  const handleCreateMatch = () => {
    if (!matchInput1 || !matchInput2) return alert('Uzuza amakipe yombi!');
    socket.emit('refCreateMatch', { team1: matchInput1, team2: matchInput2 });
  };

  const currentMatch = gameState.currentMatch;
  const votingActive = gameState.votingActive;

  return (
    <div style={{ background: '#111', border: '2px dashed gold', padding: '15px', marginTop: '15px', borderRadius: '8px' }}>
      <h3 style={{ color: 'gold', margin: '0 0 10px 0', textAlign: 'center' }}>⚙️ REFEREE MATCH CONTROL PANEL</h3>
      
      {!currentMatch ? (
        <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
          <input 
            value={matchInput1} 
            onChange={e => setMatchInput1(e.target.value)} 
            placeholder="Team 1 Name (e.g. Rayon Sports)" 
            style={{ padding: '8px', background: '#222', color: 'white', border: '1px solid #444' }}
          />
          <input 
            value={matchInput2} 
            onChange={e => setMatchInput2(e.target.value)} 
            placeholder="Team 2 Name (e.g. APR FC)" 
            style={{ padding: '8px', background: '#222', color: 'white', border: '1px solid #444' }}
          />
          <button onClick={handleCreateMatch} style={{ background: 'gold', color: 'black', padding: '10px', fontWeight: 'bold', cursor: 'pointer', border: 'none', marginTop: '5px' }}>
            CREATE LIVE FAN MATCH VOTE
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', marginBottom: '10px', fontWeight: 'bold' }}>
            LIVE: <span style={{ color: '#0ff' }}>{currentMatch.team1Title}</span> VS <span style={{ color: '#f44' }}>{currentMatch.team2Title}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
            {!votingActive ? (
              <button onClick={() => socket.emit('refOpenVoting')} style={{ background: 'green', color: 'white', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
                🟢 OPEN VOTING LINES
              </button>
            ) : (
              <button onClick={() => socket.emit('refCloseVoting')} style={{ background: 'orange', color: 'black', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
                🔴 CLOSE VOTING LINES
              </button>
            )}

            <button onClick={() => socket.emit('refEndMatch')} style={{ background: 'purple', color: 'white', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
              🏁 END MATCH ENGINE
            </button>
          </div>

          <div style={{ background: '#000', padding: '8px', borderRadius: '4px', fontSize: '0.85rem', color: '#aaa' }}>
            Status: {votingActive ? <span style={{ color: 'lime' }}>Fans are voting live!</span> : <span style={{ color: 'orange' }}>Voting lines locked.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default RefereeDashboard;
