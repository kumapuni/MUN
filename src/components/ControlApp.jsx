import { useCallback, useMemo, useState } from "react";
import DisplayScreen from "./DisplayScreen.jsx";
import { defaultState, useSharedState } from "../hooks/useSharedState.js";
import {
  createListItem,
  formatDuration,
  moveItem,
  updateTimerState,
  withTimerRunning
} from "../utils/stateUtils.js";

export default function ControlApp() {
  const [state, setState] = useSharedState(true);
  const [speakerName, setSpeakerName] = useState("");
  const [attendanceName, setAttendanceName] = useState("");
  const [timerInput, setTimerInput] = useState(5);

  const openDisplayWindow = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?display=1`;
    window.open(url, "mun-display", "noopener,noreferrer");
  }, []);

  const updateState = useCallback(
    (updates) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    [setState]
  );

  const handleTimerSet = () => {
    const totalMs = Math.max(0, Number(timerInput) || 0) * 60 * 1000;
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        duration: totalMs,
        remaining: totalMs,
        running: false,
        startedAt: null
      }
    }));
  };

  const handleTimerStart = () => {
    setState((prev) => ({
      ...prev,
      timer: withTimerRunning(prev.timer, true)
    }));
  };

  const handleTimerPause = () => {
    setState((prev) => ({
      ...prev,
      timer: withTimerRunning(prev.timer, false)
    }));
  };

  const handleTimerReset = () => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        remaining: prev.timer.duration,
        running: false,
        startedAt: null
      }
    }));
  };

  const handleTimerExtend = (seconds) => {
    setState((prev) => ({
      ...prev,
      timer: updateTimerState(prev.timer, seconds * 1000)
    }));
  };

  const addSpeaker = () => {
    if (!speakerName.trim()) return;
    setState((prev) => ({
      ...prev,
      speakers: [...prev.speakers, createListItem(speakerName.trim())]
    }));
    setSpeakerName("");
  };

  const addAttendance = () => {
    if (!attendanceName.trim()) return;
    setState((prev) => ({
      ...prev,
      attendance: [...prev.attendance, createListItem(attendanceName.trim())]
    }));
    setAttendanceName("");
  };

  const handleSpeakerDrop = (fromId, toId) => {
    setState((prev) => ({
      ...prev,
      speakers: moveItem(prev.speakers, fromId, toId)
    }));
  };

  const handleAttendanceDrop = (fromId, toId) => {
    setState((prev) => ({
      ...prev,
      attendance: moveItem(prev.attendance, fromId, toId)
    }));
  };

  const handleSpeakerDone = (id) => {
    setState((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((item) => item.id !== id)
    }));
  };

  const handleAttendanceRemove = (id) => {
    setState((prev) => ({
      ...prev,
      attendance: prev.attendance.filter((item) => item.id !== id)
    }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setState((prev) => ({
        ...prev,
        fileView: {
          name: file.name,
          type: file.type,
          dataUrl: reader.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const currentTimer = useMemo(() => {
    const remaining = updateTimerState(state.timer).remaining;
    return formatDuration(remaining);
  }, [state.timer]);

  return (
    <div className="app-layout">
      <aside className="control-panel">
        <div className="panel-header">
          <div>
            <h1>MUN Display Tool</h1>
            <p>司会操作パネル</p>
          </div>
          <button className="primary" onClick={openDisplayWindow}>
            表示ウィンドウを開く
          </button>
        </div>

        <section className="panel-section">
          <h2>画面切り替え</h2>
          <div className="button-grid">
            {defaultState.availableViews.map((view) => (
              <button
                key={view.id}
                className={
                  state.currentView === view.id ? "accent" : "secondary"
                }
                onClick={() => updateState({ currentView: view.id })}
              >
                {view.label}
              </button>
            ))}
          </div>
        </section>

        <section className="panel-section">
          <h2>タイトル</h2>
          <input
            className="text-input"
            value={state.titleText}
            onChange={(event) => updateState({ titleText: event.target.value })}
          />
        </section>

        <section className="panel-section">
          <h2>議題</h2>
          <textarea
            className="text-area"
            value={state.agendaText}
            onChange={(event) => updateState({ agendaText: event.target.value })}
            rows={3}
          />
        </section>

        <section className="panel-section">
          <h2>タイマー</h2>
          <div className="timer-row">
            <label>
              分数
              <input
                type="number"
                min="0"
                className="text-input"
                value={timerInput}
                onChange={(event) => setTimerInput(event.target.value)}
              />
            </label>
            <button className="secondary" onClick={handleTimerSet}>
              設定
            </button>
          </div>
          <div className="timer-row">
            <label>
              表示タイトル
              <input
                className="text-input"
                value={state.timerLabel}
                onChange={(event) =>
                  updateState({ timerLabel: event.target.value })
                }
                placeholder="例: モデレート"
              />
            </label>
          </div>
          <div className="timer-row">
            <button className="accent" onClick={handleTimerStart}>
              開始
            </button>
            <button className="secondary" onClick={handleTimerPause}>
              一時停止
            </button>
            <button className="secondary" onClick={handleTimerReset}>
              リセット
            </button>
          </div>
          <div className="timer-row">
            <button
              className="secondary"
              onClick={() => handleTimerExtend(30)}
            >
              +30秒
            </button>
            <button
              className="secondary"
              onClick={() => handleTimerExtend(60)}
            >
              +1分
            </button>
          </div>
          <div className="timer-preview">現在: {currentTimer}</div>
        </section>

        <section className="panel-section">
          <h2>発言リスト</h2>
          <div className="list-row">
            <input
              className="text-input"
              value={speakerName}
              onChange={(event) => setSpeakerName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSpeaker();
                }
              }}
              placeholder="発言者名を入力"
            />
            <button className="secondary" onClick={addSpeaker}>
              追加
            </button>
          </div>
          <ul className="draggable-list">
            {state.speakers.map((speaker) => (
              <li
                key={speaker.id}
                draggable
                onDragStart={(event) =>
                  event.dataTransfer.setData("text/plain", speaker.id)
                }
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const fromId = event.dataTransfer.getData("text/plain");
                  handleSpeakerDrop(fromId, speaker.id);
                }}
              >
                <span>{speaker.name}</span>
                <button
                  className="ghost"
                  onClick={() => handleSpeakerDone(speaker.id)}
                >
                  完了
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel-section">
          <h2>出席リスト</h2>
          <div className="list-row">
            <input
              className="text-input"
              value={attendanceName}
              onChange={(event) => setAttendanceName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addAttendance();
                }
              }}
              placeholder="出席者名を入力"
            />
            <button className="secondary" onClick={addAttendance}>
              追加
            </button>
          </div>
          <ul className="draggable-list">
            {state.attendance.map((member) => (
              <li
                key={member.id}
                draggable
                onDragStart={(event) =>
                  event.dataTransfer.setData("text/plain", member.id)
                }
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const fromId = event.dataTransfer.getData("text/plain");
                  handleAttendanceDrop(fromId, member.id);
                }}
              >
                <span>{member.name}</span>
                <button
                  className="ghost"
                  onClick={() => handleAttendanceRemove(member.id)}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel-section">
          <h2>資料ファイル</h2>
          <p className="helper">
            PPTX/XLSXはブラウザの対応状況によっては表示できない場合があります。可能ならPDFを推奨します。
          </p>
          <input
            type="file"
            className="file-input"
            accept=".pdf,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />
          {state.fileView?.name && (
            <div className="file-name">読み込み: {state.fileView.name}</div>
          )}
        </section>
      </aside>

      <main className="preview-panel">
        <div className="preview-header">
          <h2>表示プレビュー</h2>
          <p>
            現在の画面: {defaultState.availableViews.find((v) => v.id === state.currentView)?.label}
          </p>
        </div>
        <div className="preview-screen">
          <DisplayScreen state={state} isPreview />
        </div>
      </main>
    </div>
  );
}
