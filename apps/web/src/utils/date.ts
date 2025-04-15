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

/**
 * Formats a date for the chat list based on whether it's today, this year, or older.
 * @param date The date to format.
 * @returns Formatted date string (e.g., "14:30", "15 Jul", "15 Jul 2023").
 */
export function formatChatListTimestamp(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Use 24-hour format
  };

  const dayMonthOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  const fullDateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  if (now.toDateString() === d.toDateString()) {
    // Today: Show time (HH:mm)
    return d.toLocaleTimeString(undefined, timeOptions);
  } else if (now.getFullYear() === d.getFullYear()) {
    // This year: Show date and month (d MMM)
    return d.toLocaleDateString(undefined, dayMonthOptions);
  } else {
    // Older: Show full date (d MMM yyyy)
    return d.toLocaleDateString(undefined, fullDateOptions);
  }
}

export const formatTime = (date: Date | undefined) => {
  if (!date) return "";
  try {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return "";
  }
};
