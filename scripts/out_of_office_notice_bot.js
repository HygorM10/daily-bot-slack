function sendCalendarEventsToWebhook() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const properties = PropertiesService.getScriptProperties();
    const retentionDays = Number(
      properties.getProperty("NOTIFIED_EVENT_RETENTION_DAYS"),
    );
    const calendarId = properties.getProperty("CALENDAR_ID");
    const webhookUrl = properties.getProperty("SLACK_WEBHOOK_URL");

    if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
      throw new Error(
        "NOTIFIED_EVENT_RETENTION_DAYS must be a positive integer.",
      );
    }
    if (!calendarId) {
      throw new Error("CALENDAR_ID is not configured in Script Properties.");
    }
    if (!webhookUrl) {
      throw new Error("SLACK_WEBHOOK_URL is not configured in Script Properties.");
    }

    const notifiedEvents = JSON.parse(
      properties.getProperty("NOTIFIED_EVENT") || "[]",
    );

    const calendar = CalendarApp.getCalendarById(calendarId);

    if (!calendar) {
      throw new Error("Invalid CALENDAR_ID.");
    }

    const now = new Date();
    const events = calendar.getEvents(
      now,
      new Date(now.getTime() + 60 * 60 * 1000),
    );

    if (events.length === 0) {
      Logger.log("No events to send.");
      return;
    }

    events.forEach((event) => {
      const eventId = event.getId();
      const startTime = event.getStartTime().toISOString();
      const alreadyNotified = notifiedEvents.some(
        (savedEvent) =>
          savedEvent.eventId === eventId &&
          savedEvent.startTime === startTime,
      );

      if (alreadyNotified) {
        Logger.log(`Event already notified: ${eventId}`);
        return;
      }

      const isAllDayEvent = event.isAllDayEvent();
      const response = UrlFetchApp.fetch(webhookUrl, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          eventTitle: event.getTitle(),
          startTime: isAllDayEvent ? "All day" : formatTime(event.getStartTime()),
          endTime: isAllDayEvent ? "All day" : formatTime(event.getEndTime()),
        }),
        muteHttpExceptions: true,
      });

      const responseCode = response.getResponseCode();

      if (responseCode < 200 || responseCode >= 300) {
        throw new Error(
          `Failed to notify event "${event.getTitle()}". ` +
          `Webhook returned HTTP ${responseCode}: ${response.getContentText()}`,
        );
      }

      notifiedEvents.push({
        eventId,
        eventTitle: event.getTitle(),
        startTime,
        notifiedAt: new Date().toISOString(),
      });
      properties.setProperty("NOTIFIED_EVENT", JSON.stringify(notifiedEvents));
      Logger.log(`Event notified and saved: ${eventId}`);
    });
  } finally {
    lock.releaseLock();
  }
}

function cleanupNotifiedEvents(
  properties,
  retentionDays,
) {
  const calledByTrigger = !properties;

  if (calledByTrigger) {
    properties = PropertiesService.getScriptProperties();
    retentionDays = Number(
      properties.getProperty("NOTIFIED_EVENT_RETENTION_DAYS"),
    );
  }

  const lock = calledByTrigger ? LockService.getScriptLock() : null;

  if (lock) {
    lock.waitLock(30000);
  }

  try {
    if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
      throw new Error(
        "NOTIFIED_EVENT_RETENTION_DAYS must be a positive integer.",
      );
    }

    const events = JSON.parse(
      properties.getProperty("NOTIFIED_EVENT") || "[]",
    );
    const expirationTime =
      Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const activeEvents = events.filter((event) => {
      const notifiedAt = Date.parse(event.notifiedAt);
      return !Number.isNaN(notifiedAt) && notifiedAt > expirationTime;
    });

    properties.setProperty("NOTIFIED_EVENT", JSON.stringify(activeEvents));
    Logger.log(
      `Removed ${events.length - activeEvents.length} expired notified events.`,
    );
  } finally {
    if (lock) {
      lock.releaseLock();
    }
  }
}

function formatTime(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "hh:mm a");
}

function createCalendarTrigger() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach((trigger) => {
    if (
      [
        "sendCalendarEventsToWebhook",
        "cleanupNotifiedEvents",
      ].includes(trigger.getHandlerFunction())
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  for (let hour = 8; hour <= 19; hour++) {
    ScriptApp.newTrigger("sendCalendarEventsToWebhook")
      .timeBased()
      .atHour(hour)
      .nearMinute(0)
      .everyDays(1)
      .create();
  }

  ScriptApp.newTrigger("cleanupNotifiedEvents")
    .timeBased()
    .atHour(3)
    .nearMinute(0)
    .everyDays(1)
    .create();
}
