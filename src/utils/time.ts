export function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  if (!timeStr.includes("T")) return timeStr;
  try {
    const date = new Date(timeStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}, ${day}/${month}/${year}`;
  } catch {
    return timeStr;
  }
}

export function formatMessageTime(timestamp: any): string {
  if (!timestamp) return "Vừa xong";
  try {
    const date = timestamp.toDate
      ? timestamp.toDate()
      : timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    if (isToday) return `${hours}:${minutes}`;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month} ${hours}:${minutes}`;
  } catch {
    return "Vừa xong";
  }
}

export function formatChatListTime(timestamp: any): string {
  if (!timestamp) return "";
  try {
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    if (isToday) return `${hours}:${minutes}`;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  } catch {
    return "";
  }
}
