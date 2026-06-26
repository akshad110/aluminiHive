const CALL_WINDOW_FEATURES =
  "noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes";

export function openMentorshipCall(
  channelName: string,
  type: "video" | "audio",
  role: "student" | "mentor",
  userId: string,
  userName: string
): Window | null {
  const params = new URLSearchParams({
    channel: channelName,
    type,
    role,
    userId,
    userName,
  });
  const url = `${window.location.origin}/call?${params.toString()}`;
  return window.open(url, "_blank", CALL_WINDOW_FEATURES);
}
