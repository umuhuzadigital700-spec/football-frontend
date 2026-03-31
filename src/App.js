import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://football-backend-ykso.onrender.com');

function App() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [availableCards, setAvailableCards] = useState([]);
  const [myTeam, setMyTeam] = useState([]);
  const [currentTurnId, setCurrentTurnId] = useState(null);

  useEffect(() => {
    socket.on('playersUpdate', (updated) => {
      setPlayers(updated);
      if (updated.length > 0 && updated[0].id === socket.id) setIsHost(true);
    });

    socket.on('startDraft', (data) => {
      setAvailableCards(data.cards);
      setCurrentTurnId(data.currentTurnId);
      setGameStarted(true);
    });

    socket.on('cardPicked', (data) => {
      setAvailableCards(data.remainingCards);
      setCurrentTurnId(data.nextTurnId);
      if (data.pickerId === socket.id) {
        setMyTeam(prev => [...prev, data.card]);
      }
    });

    return () => socket.removeAllListeners();
  }, []);

  // THE CALCULATOR
  const calculateScore = (team) => {
    return team.reduce((total, p) => {
      return total + (p.goals * 5) + (p.assists * 3) + (p.tackles * 2) + (p.saves * 4);
    }, 0);
  };

  const handlePick = (card) => {
    if (socket.id !== currentTurnId) return alert("Not your turn!");
    
    const limits = { "GK": 1, "DEF": 4, "MID": 4, "FWD": 2 };
    if (myTeam.filter(p => p.pos === card.pos).length >= limits[card.pos]) {
      return alert(`Position ${card.pos} is full!`);
    }

    socket.emit('pickCard', card.id);
  };

  if (!joined) return (
    <div style={{ textAlign: 'center', marginTop: '100px', background: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1>⚽ Football Draft Login</h1>
      <input value={name} onChange={e => setName(e.target.value)} style={{padding: '10px'}} placeholder="Enter Name" />
      <button onClick={() => { socket.emit('joinLobby', { name }); setJoined(true); }} style={{padding: '10px', marginLeft: '10px'}}>JOIN</button>
    </div>
  );

  return (
    <div style={{ textAlign: 'center', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh', padding: '20px' }}>
      <h1>⚽ Arena: {gameStarted ? "Match Day" : "Lobby"}</h1>
      
      {!gameStarted ? (
        <div style={{ border: '2px solid #333', padding: '20px', borderRadius: '10px' }}>
          <h3>Waiting Area</h3>
          {players.map(p => <div key={p.id}>{p.name} {p.id === socket.id ? "(You)" : ""}</div>)}
          {isHost && players.length >= 2 && (
            <button onClick={() => socket.emit('hostStartGame')} style={{marginTop: '20px', padding: '15px 30px', backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>START DRAFT</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* LEFT: AVAILABLE CARDS */}
          <div style={{ width: '60%' }}>
            <h2 style={{ color: socket.id === currentTurnId ? '#00ff00' : '#ff4d4d' }}>
              {socket.id === currentTurnId ? "YOUR TURN TO PICK!" : "OPPONENT IS THINKING..."}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
              {availableCards.map(card => (
                <div key={card.id} onClick={() => handlePick(card)} style={{ border: '2px solid #ffd700', padding: '10px', borderRadius: '10px', width: '120px', cursor: 'pointer', background: '#222' }}>
                  <div style={{fontWeight: 'bold'}}>{card.name}</div>
                  <div style={{fontSize: '0.8rem', color: '#aaa'}}>{card.pos}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: YOUR SQUAD & SCORE */}
          <div style={{ width: '35%', borderLeft: '2px solid #444', paddingLeft: '20px' }}>
            <h2>Your Squad (11)</h2>
            <div style={{ backgroundColor: '#28a745', padding: '10px', borderRadius: '10px', marginBottom: '20px' }}>
              <h3 style={{margin: 0}}>Total Points: {calculateScore(myTeam).toFixed(0)}</h3>
            </div>
            {myTeam.map((p, i) => (
              <div key={i} style={{ textAlign: 'left', marginBottom: '5px', borderBottom: '1px solid #333' }}>
                <b>[{p.pos}]</b> {p.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;