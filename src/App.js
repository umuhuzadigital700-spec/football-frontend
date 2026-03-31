import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://football-backend-ykso.onrender.com');

function App() {
  // --- CLIENT STATE ---
  const [localName, setLocalName] = useState(""); // Spectator's name
  const [joined, setJoined] = useState(false);  // If in the arena
  const [isReferee, setIsReferee] = useState(false); // If I am the authority
  const [showRefLogin, setShowRefLogin] = useState(false); // Show the secret input
  const [refToken, setRefToken] = useState("");   // Token input
  const [errorMessage, setErrorMessage] = useState("");

  // --- MIRRORED GAME STATE (from Backend) ---
  const [arenaState, setArenaState] = useState({
    refereeId: null,
    lobbyOpen: false,
    allViewers: [],
    availableCards: [],
    team1: [],
    team2: [],
    currentTurn: "team1",
    teamSize: 11,
    gameStarted: false
  });

  useEffect(() => {
    // REAL-TIME SYNCHRONIZATION: I see everything the server sees.
    socket.on('gameStateUpdate', (newState) => {
      setArenaState(newState);
      // If the backend says my socket.id is the ref, I enable the controls.
      if (newState.refereeId === socket.id) {
        setIsReferee(true);
      } else {
        setIsReferee(false);
      }
    });

    socket.on('refereeConfirmed', (status) => {
        if(status) {
            setIsReferee(true);
            setShowRefLogin(false);
            setJoined(true); // Auto-join arena after claiming authority
        }
    });

    socket.on('error', (msg) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 4000); // Clear after 4s
    });

    return () => socket.removeAllListeners();
  }, []);

  // Spectator Join Function
  const joinArena = () => {
    if(!localName) return alert("Please enter a name.");
    socket.emit('joinWaitingRoom', { name: localName });
    setJoined(true);
  };

  // Referee Authority Functions
  const claimAuthority = () => {
    socket.emit('claimReferee', refToken);
  };

  const handleRefPick = (cardId) => {
    if (!isReferee) return;
    // The referee uses the current turn defined by the server to execute the pick
    socket.emit('refPickCard', { cardId: cardId, targetTeam: arenaState.currentTurn });
  };

  // --- RENDER 1: Spectator Login / Closed Lobby ---
  if (!joined) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', background: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
        <h1 style={{fontSize: '3rem'}}>⚽ Draft Arena Kigali </h1>
        
        {errorMessage && <p style={{color: 'red', fontWeight: 'bold'}}>{errorMessage}</p>}

        {!arenaState.lobbyOpen ? (
          <div style={{border: '2px solid #ff4d4d', padding: '30px', margin: '20px', borderRadius: '15px'}}>
            <h2>Lobby Status: <span style={{color: '#ff4d4d'}}>CLOSED</span></h2>
            <p>The Referee has closed the arena. Spectators cannot enter at this time.</p>
          </div>
        ) : (
          <div>
            <h2>Lobby Status: <span style={{color: '#28a745'}}>OPEN</span></h2>
            <p>Welcome to the Waiting Room. Enter your name to spectate.</p>
            <input value={localName} onChange={e => setLocalName(e.target.value)} style={{padding: '15px', fontSize: '1.2rem'}} placeholder="Enter Your Name" />
            <br/><br/>
            <button onClick={joinArena} style={{padding: '15px 40px', fontSize: '1.2rem', backgroundColor: '#28a745', cursor: 'pointer', fontWeight: 'bold'}}>ENTER ARENA</button>
          </div>
        )}

        {/* Secret Referee Claim Section */}
        <div style={{marginTop: '50px', borderTop: '1px solid #333', paddingTop: '20px'}}>
            {showRefLogin ? (
                <div>
                    <input type="password" value={refToken} onChange={e => setRefToken(e.target.value)} style={{padding: '10px'}} placeholder="Enter Secret Ref Token" />
                    <button onClick={claimAuthority} style={{marginLeft: '10px'}}>CLAIM AUTHORITY</button>
                    <button onClick={() => setShowRefLogin(false)} style={{marginLeft: '10px', backgroundColor: '#555'}}>CANCEL</button>
                </div>
            ) : (
                <button onClick={() => setShowRefLogin(true)} style={{backgroundColor: '#333', color: '#aaa', border: '1px solid #444'}}>Authority Login</button>
            )}
        </div>
      </div>
    );
  }

  // --- RENDER 2: The Spectator Area & Referee Console ---
  return (
    <div style={{ backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* ARENA HEADER (Visible to everyone) */}
      <div style={{textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px'}}>
        <h1 style={{margin: 0}}>⚽ Draft Arena: Match Day</h1>
        <p style={{margin: '5px 0'}}>Spectators in Arena: <span style={{color: 'gold', fontWeight: 'bold'}}>{arenaState.allViewers.length}</span></p>
        
        {errorMessage && <p style={{color: 'red', fontWeight: 'bold'}}>{errorMessage}</p>}

        {/* REFEREE CONSOLE (Only visible to you) */}
        {isReferee && (
            <div style={{border: '3px solid gold', background: '#222', padding: '20px', margin: '20px', borderRadius: '15px'}}>
                <h3 style={{color: 'gold', margin: '0 0 10px 0'}}>★★ REFEREE AUTHORITY CONSOLE ★★</h3>
                
                <div style={{display: 'flex', justifyContent: 'center', gap: '20px'}}>
                    {/* Toggle Lobby */}
                    <button onClick={() => socket.emit('refToggleLobby')} style={{padding: '10px 20px', backgroundColor: arenaState.lobbyOpen ? '#ff4d4d' : '#28a745'}}>
                        {arenaState.lobbyOpen ? "CLOSE LOBBY" : "OPEN LOBBY"}
                    </button>

                    {/* Reset Game */}
                    <button onClick={() => socket.emit('refResetGame')} style={{padding: '10px 20px', backgroundColor: '#6c757d'}}>
                        RESET MATCH TO ZERO
                    </button>

                    {/* Match Config Section */}
                    {!arenaState.gameStarted && (
                        <div style={{border: '1px solid #444', padding: '10px', display: 'flex', gap: '10px', alignItems: 'center'}}>
                            <label>Match Type: </label>
                            <select value={arenaState.teamSize} onChange={(e) => socket.emit('gameStateUpdate', {...arenaState, teamSize: parseInt(e.target.value)})} style={{padding: '5px'}}>
                                <option value="1">1 vs 1</option>
                                <option value="2">2 vs 2</option>
                                <option value="3">3 vs 3</option>
                                <option value="5">5 vs 5</option>
                                <option value="11">11 vs 11</option>
                            </select>
                            <button onClick={() => socket.emit('refStartDraft', { teamSize: arenaState.teamSize })} style={{backgroundColor: '#007bff'}}>START {arenaState.teamSize}v{arenaState.teamSize} DRAFT</button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* THE ARENA BOARD (Visible to everyone, Referee makes picks) */}
      {!arenaState.gameStarted ? (
        <div style={{textAlign: 'center'}}>
            <h2>Waiting Area...</h2>
            {arenaState.refereeId ? (
                <p>The Referee is present. Waiting for the match to start.</p>
            ) : (
                <p style={{color: '#ff4d4d'}}>WAITING FOR REFEREE AUTHORITY...</p>
            )}
            <p>You must Hard Refresh (Ctrl+F5) to see changes if you claim authority.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          
          {/* LEFT: AVAILABLE CARDS (~100 Players) */}
          <div style={{ width: '55%' }}>
            <h2 style={{color: arenaState.currentTurn === 'team1' ? '#00e676' : '#ff1744', textTransform: 'uppercase'}}>
                {arenaState.currentTurn === 'complete' ? "Draft Complete" : `Current Pick: ${arenaState.currentTurn}`}
            </h2>
            <p style={{color: '#aaa'}}>Available Players: {arenaState.availableCards.length}</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxHeight: '70vh', overflowY: 'auto', border: '1px solid #333', padding: '10px' }}>
              {arenaState.availableCards.map(card => (
                <div key={card.id} onClick={() => handleRefPick(card.id)} style={{ border: '1px solid #ffcc00', padding: '8px', width: '90px', cursor: isReferee ? 'pointer' : 'default', background: '#222', borderRadius: '5px', fontSize: '0.8rem' }}>
                  <div style={{fontWeight: 'bold'}}>{card.name}</div>
                  <div style={{color: '#aaa'}}>{card.pos}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: THE TWO TEAMS SCORES */}
          <div style={{ width: '40%', borderLeft: '2px solid #333', paddingLeft: '20px' }}>
            <h2>Arena Squads ({arenaState.teamSize}v{arenaState.teamSize})</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px'}}>
                {/* Team 1 */}
                <div style={{flex: 1, background: '#121212', padding: '10px', borderRadius: '10px', border: arenaState.currentTurn === 'team1' ? '2px solid #00e676' : '1px solid #333'}}>
                    <h3 style={{color: '#00e676'}}>Team 1 ({arenaState.team1.length}/{arenaState.teamSize})</h3>
                    {arenaState.team1.map((p, i) => <div key={i}><b>[{p.pos}]</b> {p.name}</div>)}
                </div>
                {/* Team 2 */}
                <div style={{flex: 1, background: '#121212', padding: '10px', borderRadius: '10px', border: arenaState.currentTurn === 'team2' ? '2px solid #ff1744' : '1px solid #333'}}>
                    <h3 style={{color: '#ff1744'}}>Team 2 ({arenaState.team2.length}/{arenaState.teamSize})</h3>
                    {arenaState.team2.map((p, i) => <div key={i}><b>[{p.pos}]</b> {p.name}</div>)}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
