import { useEffect, useRef, useState } from "react";
import { formatDuration } from "../utils/stateUtils.js";

export default function DisplayScreen({ state, isPreview }) {
  const view = state.currentView;
  const [shareStream, setShareStream] = useState(null);
  const [shareError, setShareError] = useState("");
  const shareVideoRef = useRef(null);

  const screenClass = isPreview ? "screen preview" : "screen";
  const currentSpeaker = state.speakers?.[0]?.name;

  const stopShare = () => {
    if (shareStream) {
      shareStream.getTracks().forEach((track) => track.stop());
    }
    setShareStream(null);
  };

  const startShare = async () => {
    setShareError("");
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setShareError("このブラウザでは画面共有が利用できません。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          stopShare();
        });
      });
      setShareStream(stream);
    } catch {
      setShareError("画面共有を開始できませんでした。");
    }
  };

  useEffect(() => {
    if (view !== "share") {
      stopShare();
    }
  }, [view]);

  useEffect(() => {
    const video = shareVideoRef.current;
    if (!video) return;
    video.srcObject = shareStream || null;
  }, [shareStream]);

  useEffect(() => () => stopShare(), []);

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

      {view === "share" && (
        <div className="screen-share">
          <div className="share-controls">
            <h1>アプリ画面共有</h1>
            {isPreview ? (
              <p className="helper">表示画面側で「共有開始」を押してください。</p>
            ) : (
              <div className="share-buttons">
                <button className="accent" onClick={startShare}>
                  共有開始
                </button>
                <button className="secondary" onClick={stopShare}>
                  停止
                </button>
              </div>
            )}
            {shareError && <p className="helper">{shareError}</p>}
          </div>
          {!isPreview && (
            <div className="share-video-frame">
              {shareStream ? (
                <video
                  ref={shareVideoRef}
                  className="share-video"
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <p className="helper">共有を開始するとここに映ります。</p>
              )}
            </div>
          )}
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
