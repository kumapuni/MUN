import { useCallback, useEffect, useMemo, useState } from "react";
import DisplayScreen from "./DisplayScreen.jsx";
import { defaultState, useSharedState } from "../hooks/useSharedState.js";
import {
  createCountryItem,
  createListItem,
  createMotionItem,
  formatDuration,
  moveItem,
  updateTimerState,
  withTimerRunning
} from "../utils/stateUtils.js";
import {
  loadFileDataUrl,
  removeFile,
  saveFile
} from "../utils/fileStore.js";
import { buildMinutesMarkdown, downloadTextFile } from "../utils/minutesExport.js";

const AVAILABLE_VIEWS = defaultState.availableViews;
const VOTE_TABS = ["DR1", "DR2", "DR3", "DR4"];
const voteKeyByTab = ["dr1", "dr2", "dr3", "dr4"];

export default function ControlApp() {
  const [state, setState] = useSharedState(true);
  const [speakerName, setSpeakerName] = useState("");
  const [attendanceName, setAttendanceName] = useState("");
  const [timerInput, setTimerInput] = useState(5);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [activeVoteTab, setActiveVoteTab] = useState(0);
  const currentVoteKey = voteKeyByTab[activeVoteTab];

  const openDisplayWindow = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?display=1`;
    window.open(url, "mun-display", "noopener,noreferrer");
  }, []);

  const exportMinutes = useCallback(() => {
    const markdown = buildMinutesMarkdown(state);
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(`minutes-${date}.md`, markdown);
  }, [state]);

  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, [setState]);

  const handleTimerSet = () => {
    const totalMs = Math.max(0, Number(timerInput) || 0) * 60 * 1000;
    setState((prev) => ({
      ...prev,
      timer: { ...prev.timer, duration: totalMs, remaining: totalMs, running: false, startedAt: null }
    }));
  };

  const handleTimerStart = () => setState((prev) => ({ ...prev, timer: withTimerRunning(prev.timer, true) }));
  const handleTimerPause = () => setState((prev) => ({ ...prev, timer: withTimerRunning(prev.timer, false) }));
  const handleTimerReset = () => setState((prev) => ({ ...prev, timer: { ...prev.timer, remaining: prev.timer.duration, running: false, startedAt: null } }));
  const handleTimerExtend = (seconds) => setState((prev) => ({ ...prev, timer: updateTimerState(prev.timer, seconds * 1000) }));

  const addSpeaker = () => {
    if (!speakerName.trim()) return;
    setState((prev) => ({ ...prev, speakers: [...prev.speakers, createListItem(speakerName.trim())] }));
    setSpeakerName("");
  };

  const addAttendance = () => {
    if (!attendanceName.trim()) return;
    setState((prev) => ({ ...prev, attendance: [...prev.attendance, createCountryItem(attendanceName.trim())] }));
    setAttendanceName("");
  };

  const addMotion = () => {
    setState((prev) => ({ ...prev, motions: [...(prev.motions ?? []), createMotionItem()] }));
  };

  const updateMotion = (id, updates) => {
    setState((prev) => ({
      ...prev,
      motions: (prev.motions ?? []).map((motion) => (motion.id === id ? { ...motion, ...updates } : motion))
    }));
  };

  const removeMotion = (id) => {
    setState((prev) => ({ ...prev, motions: (prev.motions ?? []).filter((motion) => motion.id !== id) }));
  };

  const handleSpeakerDrop = (fromId, toId) => setState((prev) => ({ ...prev, speakers: moveItem(prev.speakers, fromId, toId) }));
  const handleAttendanceDrop = (fromId, toId) => setState((prev) => ({ ...prev, attendance: moveItem(prev.attendance, fromId, toId) }));
  const handleSpeakerDone = (id) => setState((prev) => ({ ...prev, speakers: prev.speakers.filter((item) => item.id !== id) }));
  const handleAttendanceStatus = (id, status) => setState((prev) => ({ ...prev, attendance: prev.attendance.map((item) => (item.id === id ? { ...item, status } : item)) }));
  const handleVoteStatus = (id, vote) => setState((prev) => ({ ...prev, attendance: prev.attendance.map((item) => (item.id === id ? { ...item, votes: { ...(item.votes ?? {}), [currentVoteKey]: vote } } : item)) }));

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") return;
      try {
        const id = await saveFile({ name: file.name, type: file.type, dataUrl });
        setState((prev) => ({ ...prev, fileView: { id, name: file.name, type: file.type } }));
        setFilePreviewUrl(dataUrl);
      } catch {
        setFilePreviewUrl("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileClear = () => {
    if (state.fileView?.id) removeFile(state.fileView.id).catch(() => {});
    updateState({ fileView: { id: "", name: "", type: "" } });
    setFilePreviewUrl("");
  };

  useEffect(() => {
    let active = true;
    if (!state.fileView?.id) {
      setFilePreviewUrl("");
      return undefined;
    }
    loadFileDataUrl(state.fileView.id)
      .then((dataUrl) => { if (active) setFilePreviewUrl(dataUrl || ""); })
      .catch(() => { if (active) setFilePreviewUrl(""); });
    return () => { active = false; };
  }, [state.fileView?.id]);

  const currentTimer = useMemo(() => formatDuration(updateTimerState(state.timer).remaining), [state.timer]);
  const attendanceTotal = state.attendance.length;
  const attendancePresent = state.attendance.filter((member) => member.status === "present").length;
  const attendanceRate = attendanceTotal ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;
  const attendanceMajority = attendancePresent ? Math.floor(attendancePresent / 2) + 1 : 0;
  const attendanceTwoThirds = attendancePresent ? Math.ceil((attendancePresent * 2) / 3) : 0;

  const previewState = useMemo(() => ({
    ...state,
    fileView: { ...state.fileView, dataUrl: filePreviewUrl }
  }), [state, filePreviewUrl]);

  return (
    <div className="app-layout">
      <aside className="control-panel">
        <div className="panel-header">
          <div>
            <h1>MUN Display Tool</h1>
            <p>司会操作パネル</p>
          </div>
          <div className="header-actions">
            <button className="primary" onClick={openDisplayWindow}>表示ウィンドウを開く</button>
            <button className="secondary" onClick={exportMinutes}>議事録をエクスポート</button>
          </div>
        </div>

        <section className="panel-section">
          <h2>画面切り替え</h2>
          <div className="button-grid">
            {AVAILABLE_VIEWS.map((view) => (
              <button key={view.id} className={state.currentView === view.id ? "accent" : "secondary"} onClick={() => updateState({ currentView: view.id })}>
                {view.label}
              </button>
            ))}
          </div>
        </section>

        <section className="panel-section">
          <h2>タイトル</h2>
          <input className="text-input" value={state.titleText} onChange={(event) => updateState({ titleText: event.target.value })} />
        </section>

        <section className="panel-section">
          <h2>議題</h2>
          <textarea className="text-area" value={state.agendaText} onChange={(event) => updateState({ agendaText: event.target.value })} rows={3} />
        </section>

        <section className="panel-section">
          <h2>タイマー 1</h2>
          <div className="timer-row">
            <label>
              分数
              <input type="number" min="0" className="text-input" value={timerInput} onChange={(event) => setTimerInput(event.target.value)} />
            </label>
            <button className="secondary" onClick={handleTimerSet}>設定</button>
          </div>
          <div className="timer-row">
            <label>
              表示タイトル
              <input className="text-input" value={state.timerLabel} onChange={(event) => updateState({ timerLabel: event.target.value })} placeholder="例: モデレート" />
            </label>
          </div>
          <div className="timer-row">
            <button className="accent" onClick={handleTimerStart}>開始</button>
            <button className="secondary" onClick={handleTimerPause}>一時停止</button>
            <button className="secondary" onClick={handleTimerReset}>リセット</button>
          </div>
          <div className="timer-row">
            <button className="secondary" onClick={() => handleTimerExtend(30)}>+30秒</button>
            <button className="secondary" onClick={() => handleTimerExtend(60)}>+1分</button>
          </div>
          <div className="timer-preview">現在: {currentTimer}</div>
        </section>

        <section className="panel-section">
          <h2>発言リスト</h2>
          <div className="list-row">
            <input className="text-input" value={speakerName} onChange={(event) => setSpeakerName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSpeaker(); } }} placeholder="発言者名を入力" />
            <button className="secondary" onClick={addSpeaker}>追加</button>
          </div>
          <ul className="draggable-list">
            {state.speakers.map((speaker) => (
              <li key={speaker.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", speaker.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const fromId = event.dataTransfer.getData("text/plain"); handleSpeakerDrop(fromId, speaker.id); }}>
                <span>{speaker.name}</span>
                <button className="ghost" onClick={() => handleSpeakerDone(speaker.id)}>完了</button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel-section">
          <h2>国リスト</h2>
          <div className="list-row">
            <input className="text-input" value={attendanceName} onChange={(event) => setAttendanceName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAttendance(); } }} placeholder="国名を入力" />
            <button className="secondary" onClick={addAttendance}>追加</button>
          </div>
          <div className="attendance-stats">
            <div>出席数: {attendancePresent} / {attendanceTotal}</div>
            <div>出席率: {attendanceRate}%</div>
            <div>過半数: {attendanceMajority}</div>
            <div>出席数の3分の2: {attendanceTwoThirds}</div>
          </div>
          <ul className="draggable-list">
            {state.attendance.map((member) => (
              <li key={member.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", member.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const fromId = event.dataTransfer.getData("text/plain"); handleAttendanceDrop(fromId, member.id); }}>
                <span>
                  {member.name}
                  <span className={`status-tag ${member.status === "present" ? "present" : member.status === "absent" ? "absent" : "pending"}`}>{member.status === "present" ? "出席" : member.status === "absent" ? "欠席" : "未定"}</span>
                </span>
                <div className="list-actions">
                  <button className={`status-button present ${member.status === "present" ? "active" : ""}`} onClick={() => handleAttendanceStatus(member.id, "present")}>出席</button>
                  <button className={`status-button absent ${member.status === "absent" ? "active" : ""}`} onClick={() => handleAttendanceStatus(member.id, "absent")}>欠席</button>
                  <button className="ghost" onClick={() => setState((prev) => ({ ...prev, attendance: prev.attendance.filter((item) => item.id !== member.id) }))}>削除</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        
<section className="panel-section">
  <h2>投票</h2>

  <div className="button-grid">
    {VOTE_TABS.map((tab, index) => (
      <button
        key={tab}
        className={activeVoteTab === index ? "accent" : "secondary"}
        onClick={() => setActiveVoteTab(index)}
      >
        {tab}
      </button>
    ))}
  </div>

  <div className="attendance-stats display-stats">
    <div>
      賛成:{" "}
      {
        state.attendance.filter(
          (member) => member.votes?.[currentVoteKey] === "yes"
        ).length
      }
    </div>
    <div>
      反対:{" "}
      {
        state.attendance.filter(
          (member) => member.votes?.[currentVoteKey] === "no"
        ).length
      }
    </div>
    <div>
      棄権:{" "}
      {
        state.attendance.filter(
          (member) => member.votes?.[currentVoteKey] === "abstain"
        ).length
      }
    </div>
    <div>
      欠席:{" "}
      {
        state.attendance.filter(
          (member) => member.votes?.[currentVoteKey] === "absent"
        ).length
      }
    </div>
  </div>

  <div className="vote-table-wrapper">
    <table className="vote-table">
      <thead>
        <tr>
          <th>国名</th>
          <th>投票状態</th>
          <th>賛成</th>
          <th>反対</th>
          <th>棄権</th>
          <th>欠席</th>
        </tr>
      </thead>
      <tbody>
        {state.attendance.map((member) => {
          const currentVote = member.votes?.[currentVoteKey] ?? "";
          return (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>{currentVote ? currentVote : "未投票"}</td>
              <td>
                <button
                  className={`vote-button yes ${
                    currentVote === "yes" ? "active" : ""
                  }`}
                  onClick={() => handleVoteStatus(member.id, "yes")}
                >
                  ●
                </button>
              </td>
              <td>
                <button
                  className={`vote-button no ${
                    currentVote === "no" ? "active" : ""
                  }`}
                  onClick={() => handleVoteStatus(member.id, "no")}
                >
                  ●
                </button>
              </td>
              <td>
                <button
                  className={`vote-button abstain ${
                    currentVote === "abstain" ? "active" : ""
                  }`}
                  onClick={() => handleVoteStatus(member.id, "abstain")}
                >
                  ●
                </button>
              </td>
              <td>
                <button
                  className={`vote-button absent ${
                    currentVote === "absent" ? "active" : ""
                  }`}
                  onClick={() => handleVoteStatus(member.id, "absent")}
                >
                  ●
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>

  <p className="helper">
    {VOTE_TABS[activeVoteTab]} を編集しています。各国の投票はこのDRに対して保存されます。
  </p>
</section>
        <section className="panel-section">
          <h2>動議</h2>
          <button className="accent" onClick={addMotion}>動議を追加</button>
          <div className="motion-table-wrap">
            <table className="motion-table">
              <thead>
                <tr>
                  <th>国</th>
                  <th>動議</th>
                  <th>時間</th>
                  <th>方向性・理由</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {(state.motions ?? []).map((motion) => (
                  <tr key={motion.id}>
                    <td><input className="text-input" value={motion.country} onChange={(event) => updateMotion(motion.id, { country: event.target.value })} /></td>
                    <td><input className="text-input" value={motion.motion} onChange={(event) => updateMotion(motion.id, { motion: event.target.value })} /></td>
                    <td><input className="text-input" value={motion.time} onChange={(event) => updateMotion(motion.id, { time: event.target.value })} /></td>
                    <td><input className="text-input" value={motion.direction} onChange={(event) => updateMotion(motion.id, { direction: event.target.value })} /></td>
                    <td><button className="ghost" onClick={() => removeMotion(motion.id)}>削除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel-section">
          <h2>資料ファイル</h2>
          <p className="helper">PDFまたは画像のみ対応しています（PPTXは非対応です）。</p>
          <p className="helper">ブラウザ保存容量の上限があるため、目安として50MB以下でアップロードしてください。</p>
          <input type="file" className="file-input" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
          {state.fileView?.name && (
            <div className="file-meta">
              <div className="file-name">読み込み: {state.fileView.name}</div>
              <button className="ghost" onClick={handleFileClear}>クリア</button>
            </div>
          )}
        </section>
      </aside>

      <main className="preview-panel">
        <div className="preview-header">
          <h2>表示プレビュー</h2>
          <p>現在の画面: {AVAILABLE_VIEWS.find((v) => v.id === state.currentView)?.label}</p>
        </div>
        <div className="preview-screen">
          <DisplayScreen state={previewState} isPreview />
        </div>
      </main>
    </div>
  );
}
