/**
 * 現在時刻から指定された日付までの残り時間を人間が読みやすい形式で返す
 * @param targetDate 対象の日付
 * @returns 残り時間を表す文字列 (例: "3 hours left", "1 day left")
 */
export function getTimeRemaining(targetDate: Date): string {
  const now = new Date();

  // 現在時刻より前の場合は期限切れ
  if (targetDate.getTime() <= now.getTime()) {
    return "Expired";
  }

  const diffMs = targetDate.getTime() - now.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} left`;
  } else if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} left`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} left`;
  } else {
    return "Less than a minute left";
  }
}

/**
 * 日付が現在から24時間以内かどうかをチェック
 * @param date チェックする日付
 * @returns 24時間以内であればtrue
 */
export function isWithin24Hours(date: Date): boolean {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return diffMs > 0 && diffMs < 24 * 60 * 60 * 1000;
}
