function drawPresenter() {
  const participants = ["U0C73125WUT", "U0C73125WUT"];

  const currentDate = new Date();
  const startOfYear = Date.UTC(currentDate.getUTCFullYear(), 0, 1);
  const startOfDay = Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate()
  );
  const executionNumber = Math.floor(
    (startOfDay - startOfYear) / (24 * 60 * 60 * 1000)
  ) + 1;
  const index = (executionNumber - 1) % participants.length;
  const presenter = participants[index];

  const url = PropertiesService
    .getScriptProperties()
    .getProperty("SLACK_WORKFLOW_URL");

  if (!url) {
    throw new Error("Configure the SLACK_WORKFLOW_URL script property.");
  }

  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ presenter })
  });
}

function configureTriggers() {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === "drawPresenter") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  const weekdays = [
    ScriptApp.WeekDay.MONDAY,
    ScriptApp.WeekDay.TUESDAY,
    ScriptApp.WeekDay.WEDNESDAY,
    ScriptApp.WeekDay.THURSDAY,
    ScriptApp.WeekDay.FRIDAY
  ];

  weekdays.forEach(weekday => {
    ScriptApp.newTrigger("drawPresenter")
      .timeBased()
      .inTimezone("America/Sao_Paulo")
      .onWeekDay(weekday)
      .atHour(11)
      .nearMinute(0)
      .everyWeeks(1)
      .create();
  });
}