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
  const [teamSize, setTeamSize] = useState(5);

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

  const handlePick = (card) => {
    if (socket.id !== currentTurnId) return alert("Wait for your turn!");
    socket.emit('pickCard', card.id);
  };

  if (!joined) return (
    <div style={{ textAlign: 'center', marginTop: '100px', background: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1>⚽ Football Draft Login</h1>
      <input value={name} onChange={e => setName(e.target.value)} style={{padding: '10px'}} placeholder="Enter Name" />
      <button onClick={() => { if(name) { socket.emit('joinLobby', { name }); setJoined(true); } }}>JOIN</button>
    </div>
  );

  return (
    <div style={{ textAlign: 'center', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh', padding: '20px' }}>
      {!gameStarted ? (
        <div>
          <h2>Lobby - {players.length} Players</h2>
          {players.map(p => <div key={p.id}>{p.name} {p.id === socket.id ? "(You)" : ""}</div>)}
          {isHost && players.length >= 2 && (
            <div style={{marginTop: '20px'}}>
              <p>Select Match Type:</p>
              <select value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value))} style={{padding: '10px'}}>
                <option value="2">2 vs 2</option>
                <option value="3">3 vs 3</option>
                <option value="5">5 vs 5</option>
                <option value="11">11 vs 11</option>
              </select>
              <br/><br/>
              <button onClick={() => socket.emit('hostStartGame', { teamSize })} style={{padding: '15px 30px', backgroundColor: '#28a745', color: 'white', fontWeight: 'bold'}}>START DRAFT</button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ width: '60%' }}>
            <h2 style={{color: socket.id === currentTurnId ? '#00ff00' : 'white'}}>
              {socket.id === currentTurnId ? "★ YOUR TURN ★" : "Opponent's Turn..."}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {availableCards.map(card => (
                <div key={card.id} onClick={() => handlePick(card)} style={{ border: '1px solid gold', padding: '10px', width: '100px', cursor: 'pointer', background: '#222' }}>
                  {card.name}<br/><small>{card.pos}</small>
                </div>
              ))}
            </div>
          </div>
          <div style={{ width: '30%', borderLeft: '1px solid #444' }}>
            <h3>Your Team ({myTeam.length}/{teamSize})</h3>
            {myTeam.map((p, i) => <div key={i}>[{p.pos}] {p.name}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
