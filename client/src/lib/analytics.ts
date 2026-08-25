export function buildIntentDetail(event: string, detail?: Record<string, string | number>) {
  return { event, ...detail };
}

export function trackIntent(event: string, detail?: Record<string, string | number>) {
  const eventDetail = buildIntentDetail(event, detail);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("umaid:intent", { detail: eventDetail }));
  return eventDetail;
}
