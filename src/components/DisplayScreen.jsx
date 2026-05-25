import { formatDuration } from "../utils/stateUtils.js";

export default function DisplayScreen({ state, isPreview }) {
  const view = state.currentView;
  const currentSpeaker = state.speakers?.[0]?.name;
  const attendanceTotal = state.attendance.length;
  const attendancePresent = state.attendance.filter(
    (member) => member.status === "present"
  ).length;
  const attendanceRate = attendanceTotal
    ? Math.round((attendancePresent / attendanceTotal) * 100)
    : 0;
  const attendanceMajority = attendancePresent
    ? Math.floor(attendancePresent / 2) + 1
    : 0;
  const attendanceTwoThirds = attendancePresent
    ? Math.ceil((attendancePresent * 2) / 3)
    : 0;
  const voteCounts = state.attendance.reduce(
    (acc, member) => {
      if (member.vote === "yes") acc.yes += 1;
      if (member.vote === "no") acc.no += 1;
      if (member.vote === "abstain") acc.abstain += 1;
      if (member.vote === "absent") acc.absent += 1;
      return acc;
    },
    { yes: 0, no: 0, abstain: 0, absent: 0 }
  );

  return (
    <div className={isPreview ? "screen preview" : "screen"}>
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
          <h1>タイマー1</h1>
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

      {view === "speech" && (
        <div className="speech-layout">
          <div className="speech-panel">
            <h1>発言リスト</h1>
            <ol>
              {state.speakers.map((speaker) => (
                <li key={speaker.id}>{speaker.name}</li>
              ))}
            </ol>
          </div>
          <div className="speech-panel speech-timer">
            {currentSpeaker && (
              <p className="speech-current-speaker">{currentSpeaker}</p>
            )}
            {state.timerLabel?.trim() && (
              <p className="timer-label">{state.timerLabel}</p>
            )}
            <p className="clock-text">{formatDuration(state.timer.remaining)}</p>
          </div>
        </div>
      )}

      {view === "attendance" && (
        <div className="screen-list">
          <h1>国リスト</h1>
          <div className="attendance-stats display-stats">
            <div>出席数: {attendancePresent} / {attendanceTotal}</div>
            <div>出席率: {attendanceRate}%</div>
            <div>過半数: {attendanceMajority}</div>
            <div>出席数の3分の2: {attendanceTwoThirds}</div>
          </div>
          <ol className="country-list">
            {state.attendance.map((member) => (
              <li key={member.id}>
                {member.name}
                {member.status === "present" ? (
                  <span className="status-tag present">出席</span>
                ) : member.status === "absent" ? (
                  <span className="status-tag absent">欠席</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      )}

          {view === "vote" && (
        <div className="screen-list">
          <h1>投票</h1>
          <div className="helper">現在のDR: {state.currentVoteTabLabel ?? "DR1"}</div>
          <div className="attendance-stats display-stats">
            <div>賛成: {voteCounts.yes}</div>
            <div>反対: {voteCounts.no}</div>
            <div>棄権: {voteCounts.abstain}</div>
            <div>欠席: {voteCounts.absent}</div>
          </div>
          <div className="vote-table-wrapper">
            <table className="vote-table">
              <thead>
                <tr>
                  <th>国名</th>
                  <th>賛成</th>
                  <th>反対</th>
                  <th>棄権</th>
                  <th>欠席</th>
                </tr>
              </thead>
              <tbody>
                {state.attendance.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td className={member.votes?.[state.currentVoteKey] === "yes" ? "vote-mark" : ""}>
                      {member.votes?.[state.currentVoteKey] === "yes" ? "●" : ""}
                    </td>
                    <td className={member.votes?.[state.currentVoteKey] === "no" ? "vote-mark" : ""}>
                      {member.votes?.[state.currentVoteKey] === "no" ? "●" : ""}
                    </td>
                    <td className={member.votes?.[state.currentVoteKey] === "abstain" ? "vote-mark" : ""}>
                      {member.votes?.[state.currentVoteKey] === "abstain" ? "●" : ""}
                    </td>
                    <td className={member.votes?.[state.currentVoteKey] === "absent" ? "vote-mark" : ""}>
                      {member.votes?.[state.currentVoteKey] === "absent" ? "●" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {view === "motion" && (
        <div className="screen-list">
          <h1>動議</h1>
          <div className="motion-table-wrap">
            <table className="motion-table display-motion">
              <thead>
                <tr>
                  <th>国</th>
                  <th>動議</th>
                  <th>時間</th>
                  <th>方向性・理由</th>
                </tr>
              </thead>
              <tbody>
                {(state.motions ?? []).map((motion) => (
                  <tr key={motion.id}>
                    <td>{motion.country}</td>
                    <td>{motion.motion}</td>
                    <td>{motion.time}</td>
                    <td>{motion.direction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {view === "share" && (
        <div className="screen-share">
          <div className="share-controls">
            <h1>表示ウィンドウ</h1>
            <p className="helper">
              操作画面の「表示ウィンドウを開く」から接続してください。
            </p>
          </div>
          <div className="share-video-frame">
            <p className="helper">
              接続待ちです。表示ウィンドウが開かれるとここに同期内容が表示されます。
            </p>
          </div>
          {isPreview ? (
            <p className="helper">
              プレビュー表示中です。実際の表示ウィンドウを開くと同期されます。
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
