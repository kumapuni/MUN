export function escapeMarkdown(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/`/g, "\\`")
    .replace(/#/g, "\\#")
    .replace(/-/g, "\\-");
}

export function buildMinutesMarkdown(state) {
  const title = state.agendaText?.trim() || "議題未設定";
  const now = new Date();
  const dateText = now.toLocaleString("ja-JP");

  const lines = [];
  lines.push(`# ${escapeMarkdown(title)}`);
  lines.push("");
  lines.push(`- 出力日時: ${escapeMarkdown(dateText)}`);
  lines.push(`- 画面タイトル: ${escapeMarkdown(state.titleText || "")}`);
  lines.push("");

  lines.push("## 発言リスト");
  if ((state.speakers?.length ?? 0) === 0) {
    lines.push("- なし");
  } else {
    state.speakers.forEach((speaker, index) => {
      lines.push(`- ${index + 1}. ${escapeMarkdown(speaker.name)}`);
    });
  }
  lines.push("");

  lines.push("## 国リスト");
  if ((state.attendance?.length ?? 0) === 0) {
    lines.push("- なし");
  } else {
    state.attendance.forEach((member, index) => {
      const status = member.status === "present" ? "出席" : member.status === "absent" ? "欠席" : "未定";
      lines.push(`- ${index + 1}. ${escapeMarkdown(member.name)} (${status})`);
    });
  }
  lines.push("");

  lines.push("## 投票結果");
  const voteLabel = (vote) => {
    if (vote === "yes") return "賛成";
    if (vote === "no") return "反対";
    if (vote === "abstain") return "棄権";
    if (vote === "absent") return "欠席";
    return "未投票";
  };
  if ((state.attendance?.length ?? 0) === 0) {
    lines.push("- なし");
  } else {
    lines.push("| 国名 | 投票 |");
    lines.push("| --- | --- |");
    state.attendance.forEach((member) => {
      lines.push(`| ${escapeMarkdown(member.name)} | ${voteLabel(member.vote)} |`);
    });
  }
  lines.push("");

  lines.push("## 動議");
  if ((state.motions?.length ?? 0) === 0) {
    lines.push("- なし");
  } else {
    lines.push("| 国 | 動議 | 時間 | 方向性・理由 |");
    lines.push("| --- | --- | --- | --- |");
    state.motions.forEach((motion) => {
      lines.push(
        `| ${escapeMarkdown(motion.country || "")} | ${escapeMarkdown(motion.motion || "")} | ${escapeMarkdown(motion.time || "")} | ${escapeMarkdown(motion.direction || "")} |`
      );
    });
  }

  return lines.join("\n");
}

export function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
