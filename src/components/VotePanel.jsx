import React, { useState, useEffect, useRef } from 'react';

export default function VotePanel({ drName }) {
  const [columns, setColumns] = useState(['賛成', '反対', '棄権']);
  const [rows, setRows] = useState([{ name: '国1' }, { name: '国2' }]);
  const [timer, setTimer] = useState({ running: false, duration: 60, remaining: 60 });
  const timerRef = useRef();

  useEffect(() => {
    if (!timer.running) return;
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev.remaining <= 0) {
          clearInterval(timerRef.current);
          return { ...prev, running: false, remaining: 0 };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timer.running]);

  const startTimer = () => setTimer(prev => ({ ...prev, running: true }));
  const stopTimer = () => setTimer(prev => ({ ...prev, running: false }));
  const resetTimer = () => setTimer(prev => ({ ...prev, remaining: prev.duration, running: false }));

  return (
    <div className="vote-panel" style={{border: "1px solid #fff", padding: 10, borderRadius: 10, background: "#111827", color: "#fff", minWidth: 240 }}>
      <h2>{drName}</h2>
      <div style={{marginBottom: 10}}>
        <span>Timer: {timer.remaining}s </span>
        <button onClick={startTimer}>開始</button>
        <button onClick={stopTimer}>停止</button>
        <button onClick={resetTimer}>リセット</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>国名</th>
            {columns.map(col => <th key={col}>{col}</th>)}
            <th>
              <button onClick={() => setColumns(cols => [...cols, `新規${cols.length+1}`])}>列追加</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              <td>{row.name}</td>
              {columns.map((col, colIdx) =>
                <td key={colIdx}><input type="checkbox" /></td>
              )}
              <td>
                <button onClick={() => setRows(rs => rs.filter((_, i) => i !== rowIdx))}>行削除</button>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={columns.length + 2}>
              <button onClick={() => setRows(rs => [...rs, { name: `国${rs.length + 1}` }])}>行追加</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
