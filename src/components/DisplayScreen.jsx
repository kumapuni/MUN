import { formatDuration } from "../utils/stateUtils.js";

export default function DisplayScreen({ state, isPreview }) {
  const view = state.currentView;

  const screenClass = isPreview ? "screen preview" : "screen";

  return (
    <div className={screenClass}>
      {view === "title" && (
        <div className="screen-center">
          <h1>{state.titleText}</h1>
        </div>
      )}

      {view === "agenda" && (
        <div className="screen-center">
          <h1>議題</h1>
          <p className="large-text">{state.agendaText}</p>
        </div>
      )}

      {view === "clock" && (
        <div className="screen-center">
          <h1>現在時刻</h1>
          <p className="clock-text">{new Date().toLocaleTimeString("ja-JP")}</p>
        </div>
      )}

      {view === "timer" && (
        <div className="screen-center">
          <h1>タイマー</h1>
          {state.timerLabel?.trim() && (
            <p className="timer-label">{state.timerLabel}</p>
          )}
          <p className="clock-text">{formatDuration(state.timer.remaining)}</p>
        </div>
      )}

      {view === "speakers" && (
        <div className="screen-list">
          <h1>発言リスト</h1>
          <ol>
            {state.speakers.map((speaker) => (
              <li key={speaker.id}>{speaker.name}</li>
            ))}
          </ol>
        </div>
      )}

      {view === "attendance" && (
        <div className="screen-list">
          <h1>出席リスト</h1>
          <ol>
            {state.attendance.map((member) => (
              <li key={member.id}>{member.name}</li>
            ))}
          </ol>
        </div>
      )}

      {view === "file" && (
        <div className="screen-file">
          <h1>資料表示</h1>
          {state.fileView?.dataUrl ? (
            <iframe
              title="document"
              src={state.fileView.dataUrl}
              className="file-frame"
            />
          ) : (
            <p className="helper">操作画面でファイルを読み込んでください。</p>
          )}
        </div>
      )}
    </div>
  );
}
