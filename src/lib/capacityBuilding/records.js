function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function eventToForm(event = {}) {
  return {
    status: event.status || "completed",
    eventDateStart: event.eventDateStart || new Date().toISOString().slice(0, 10),
    eventDateEnd: event.eventDateEnd || "",
    regionId: event.regionId || "",
    divisionId: event.divisionId || "",
    planningUnitId: event.planningUnitId || "",
    venue: event.venue || "",
    facilitatorNames: Array.isArray(event.facilitatorNames)
      ? event.facilitatorNames.join(", ")
      : event.facilitatorNames || "",
    actualParticipants: event.actualParticipants ?? "",
    maleParticipants: event.maleParticipants ?? "",
    femaleParticipants: event.femaleParticipants ?? "",
    attendanceSheetName: event.attendanceSheetAttachmentId || "",
    eventReportName: event.eventReportAttachmentId || "",
    photoNames: Array.isArray(event.photoAttachmentIds)
      ? event.photoAttachmentIds.join(", ")
      : event.photoNames || "",
    remarks: event.remarks || "",
  };
}

export function formToCapacityEvent(form, { planItemId, previous, createdBy }) {
  const timestamp = new Date().toISOString();
  return {
    id: previous?.id || newId(),
    planItemId,
    status: form.status || "completed",
    eventDateStart: form.eventDateStart,
    eventDateEnd: form.eventDateEnd || undefined,
    regionId: form.regionId || undefined,
    divisionId: form.divisionId || undefined,
    planningUnitId: form.planningUnitId || undefined,
    venue: form.venue || undefined,
    facilitatorNames: form.facilitatorNames
      ? String(form.facilitatorNames)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    actualParticipants: Number(form.actualParticipants) || 0,
    maleParticipants: Number(form.maleParticipants) || 0,
    femaleParticipants: Number(form.femaleParticipants) || 0,
    attendanceSheetAttachmentId: form.attendanceSheetName || undefined,
    eventReportAttachmentId: form.eventReportName || undefined,
    photoAttachmentIds: form.photoNames
      ? String(form.photoNames)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    remarks: form.remarks || undefined,
    source: previous?.source || "manual",
    createdBy: previous?.createdBy || createdBy || "User",
    createdAt: previous?.createdAt || timestamp,
    updatedAt: timestamp,
    updatedBy: previous ? createdBy : undefined,
  };
}

export function upsertCapacityEvent(data, event) {
  const events = [...(data.capacityEvents || [])];
  const idx = events.findIndex((row) => row.id === event.id);
  if (idx >= 0) events[idx] = event;
  else events.push(event);
  return { ...data, capacityEvents: events };
}

export function deleteCapacityEvent(data, eventId) {
  return {
    ...data,
    capacityEvents: (data.capacityEvents || []).filter((event) => event.id !== eventId),
  };
}
