// Google Calendar API Utilities

/**
 * Creates an event in the user's primary Google Calendar.
 */
export const createGoogleCalendarEvent = async (
  apt: {
    professionalName: string;
    specialty?: string;
    date: string;
    time: string;
  },
  token: string
): Promise<string | null> => {
  try {
    const startDateTime = `${apt.date}T${apt.time}:00`;
    const [hours, minutes] = apt.time.split(":").map(Number);
    let endHours = hours;
    let endMinutes = minutes + 30;
    if (endMinutes >= 60) {
      endHours += 1;
      endMinutes -= 60;
    }
    const endTimeStr = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
    const endDateTime = `${apt.date}T${endTimeStr}:00`;

    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `Consulta ViTTA - ${apt.professionalName}`,
        description: `Consulta agendada via aplicativo ViTTA.\nProfissional: ${apt.professionalName}\nEspecialidade: ${apt.specialty || "Clínico Geral"}`,
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
        },
        reminders: {
          useDefault: true
        }
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.id;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.error("Failed to create Google Calendar event:", errData);
      return null;
    }
  } catch (err) {
    console.error("Error creating Google Calendar event:", err);
    return null;
  }
};

/**
 * Updates an existing event in the user's primary Google Calendar.
 */
export const updateGoogleCalendarEvent = async (
  eventId: string,
  apt: {
    professionalName: string;
    specialty?: string;
    date: string;
    time: string;
  },
  token: string
): Promise<boolean> => {
  try {
    const startDateTime = `${apt.date}T${apt.time}:00`;
    const [hours, minutes] = apt.time.split(":").map(Number);
    let endHours = hours;
    let endMinutes = minutes + 30;
    if (endMinutes >= 60) {
      endHours += 1;
      endMinutes -= 60;
    }
    const endTimeStr = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
    const endDateTime = `${apt.date}T${endTimeStr}:00`;

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `Consulta ViTTA - ${apt.professionalName}`,
        description: `Consulta agendada via aplicativo ViTTA.\nProfissional: ${apt.professionalName}\nEspecialidade: ${apt.specialty || "Clínico Geral"}\n(Remarcada/Alterada)`,
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
        },
        reminders: {
          useDefault: true
        }
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("Error updating Google Calendar event:", err);
    return false;
  }
};

/**
 * Deletes an event from the user's primary Google Calendar.
 */
export const deleteGoogleCalendarEvent = async (
  eventId: string,
  token: string
): Promise<boolean> => {
  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  } catch (err) {
    console.error("Error deleting Google Calendar event:", err);
    return false;
  }
};
