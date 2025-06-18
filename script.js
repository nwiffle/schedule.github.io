let allowedStartTime, allowedEndTime;
let events = [];

document.getElementById("set-time-range").addEventListener("click", () => {
  allowedStartTime = document.getElementById("start-time").value;
  allowedEndTime = document.getElementById("end-time").value;

  if (!allowedStartTime || !allowedEndTime || allowedStartTime >= allowedEndTime) {
    alert("Please set a valid time range.");
    return;
  }

  document.getElementById("event-section").style.display = "block";
  document.getElementById("time-limit-section").style.display = "none";
});

document.getElementById("add-event").addEventListener("click", () => {
  const name = document.getElementById("event-name").value.trim();
  const dateStr = document.getElementById("event-date").value.trim();
  const start = document.getElementById("event-start").value;
  const end = document.getElementById("event-end").value;

  if (!name || !dateStr || !start || !end || start >= end) {
    alert("Fill out all fields correctly.");
    return;
  }

  const [d, m, y] = dateStr.split(":").map(Number);
  const date = new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);

  events.push({ name, date, start, end });
  document.getElementById("event-name").value = "";
  document.getElementById("event-date").value = "";
  document.getElementById("event-start").value = "";
  document.getElementById("event-end").value = "";
});

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toTimeString(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

document.getElementById("create-schedule").addEventListener("click", () => {
  if (events.length === 0) return;

  const tbody = document.querySelector("#schedule-table tbody");
  tbody.innerHTML = "";

  events.sort((a, b) => {
    if (a.date - b.date !== 0) return a.date - b.date;
    return toMinutes(a.start) - toMinutes(b.start);
  });

  const scheduleStart = toMinutes(allowedStartTime);
  const scheduleEnd = toMinutes(allowedEndTime);
  const scheduleDuration = scheduleEnd - scheduleStart;

  let currentDate = new Date(events[0].date);
  let currentDayOffset = 0;
  let availableMin = scheduleStart;

  events.forEach(event => {
    const duration = toMinutes(event.end) - toMinutes(event.start);

    if (availableMin + duration > scheduleEnd) {
      // Not enough space in current day, spill to next day
      currentDayOffset += 1;
      availableMin = scheduleStart;
    }

    const scheduledDate = new Date(currentDate);
    scheduledDate.setDate(scheduledDate.getDate() + currentDayOffset);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${scheduledDate.toLocaleDateString("en-GB")}</td>
      <td>${toTimeString(availableMin)}</td>
      <td>${toTimeString(availableMin + duration)}</td>
      <td contenteditable="true">${event.name}</td>
    `;
    tbody.appendChild(row);

    availableMin += duration;
  });

  document.getElementById("schedule-section").style.display = "block";
});

document.getElementById("download-excel").addEventListener("click", () => {
  const wb = XLSX.utils.book_new();
  const rows = [["Date", "Start Time", "End Time", "Event Name"]];
  document.querySelectorAll("#schedule-table tbody tr").forEach(row => {
    const cells = row.querySelectorAll("td");
    rows.push([...cells].map(td => td.textContent));
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Schedule");
  XLSX.writeFile(wb, "olympic_schedule.xlsx");
});

document.getElementById("reset-schedule").addEventListener("click", () => {
  if (confirm("Are you sure you want to reset the schedule?")) {
    location.reload();
  }
});
