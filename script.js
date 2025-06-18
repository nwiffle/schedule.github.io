let allowedStartTime, allowedEndTime;
let events = [];

const GAP_MINUTES = 5;

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

function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTimeStr(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

document.getElementById("create-schedule").addEventListener("click", () => {
  if (events.length === 0) return;

  const tbody = document.querySelector("#schedule-table tbody");
  tbody.innerHTML = "";

  // Sort events by actual event date + start time
  events.sort((a, b) => {
    if (a.date - b.date !== 0) return a.date - b.date;
    return toMinutes(a.start) - toMinutes(b.start);
  });

  const scheduleStart = toMinutes(allowedStartTime);
  const scheduleEnd = toMinutes(allowedEndTime);
  let currentDate = new Date(events[0].date);
  let availableTime = toMinutes(events[0].start);

  events.forEach(event => {
    let eventStartMin = toMinutes(event.start);
    let eventEndMin = toMinutes(event.end);
    let duration = eventEndMin - eventStartMin;

    let scheduledStart, scheduledEnd;

    if (
      event.date > currentDate ||
      availableTime < scheduleStart ||
      availableTime > scheduleEnd - duration
    ) {
      // Use original time if in range
      scheduledStart = Math.max(scheduleStart, eventStartMin);
      if (scheduledStart + duration > scheduleEnd) {
        // Spill into next day
        currentDate.setDate(currentDate.getDate() + 1);
        scheduledStart = scheduleStart;
      }
    } else {
      scheduledStart = availableTime + GAP_MINUTES;
      if (scheduledStart + duration > scheduleEnd) {
        currentDate.setDate(currentDate.getDate() + 1);
        scheduledStart = scheduleStart;
      }
    }

    scheduledEnd = scheduledStart + duration;
    availableTime = scheduledEnd;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${currentDate.toLocaleDateString("en-GB")}</td>
      <td>${toTimeStr(scheduledStart)}</td>
      <td>${toTimeStr(scheduledEnd)}</td>
      <td contenteditable="true">${event.name}</td>
    `;
    tbody.appendChild(row);
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
  XLSX.writeFile(wb, "schedule.xlsx");
});

document.getElementById("import-file").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const tbody = document.querySelector("#schedule-table tbody");
    tbody.innerHTML = "";

    for (let i = 1; i < json.length; i++) {
      const [date, start, end, name] = json[i];
      if (!date || !start || !end || !name) continue;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${date}</td>
        <td>${start}</td>
        <td>${end}</td>
        <td contenteditable="true">${name}</td>
      `;
      tbody.appendChild(row);
    }

    document.getElementById("schedule-section").style.display = "block";
  };
  reader.readAsArrayBuffer(file);
});

document.getElementById("reset-schedule").addEventListener("click", () => {
  if (confirm("Reset all data?")) {
    location.reload();
  }
});
