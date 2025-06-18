let allowedStartTime, allowedEndTime;
let events = [];

document.getElementById("set-time-range").addEventListener("click", () => {
    const start = document.getElementById("start-time").value;
    const end = document.getElementById("end-time").value;

    if (!start || !end || start >= end) {
        alert("Enter a valid time range (start must be before end).");
        return;
    }

    allowedStartTime = start;
    allowedEndTime = end;

    document.getElementById("time-limit-section").style.display = "none";
    document.getElementById("event-section").style.display = "block";
});

document.getElementById("add-event").addEventListener("click", () => {
    const name = document.getElementById("event-name").value.trim();
    const dateStr = document.getElementById("event-date").value.trim();
    const start = document.getElementById("event-start").value;
    const end = document.getElementById("event-end").value;

    if (!name || !dateStr || !start || !end || start >= end) {
        alert("Please fill all fields correctly.");
        return;
    }

    const [d, m, y] = dateStr.split(":").map(Number);
    const parsedDate = new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

    if (isNaN(parsedDate)) {
        alert("Invalid date format. Use D:M:Y.");
        return;
    }

    events.push({
        name,
        date: parsedDate,
        originalDateStr: dateStr,
        start,
        end
    });

    document.getElementById("event-name").value = "";
    document.getElementById("event-date").value = "";
    document.getElementById("event-start").value = "";
    document.getElementById("event-end").value = "";
});

document.getElementById("create-schedule").addEventListener("click", () => {
    if (events.length === 0) {
        alert("Add at least one event.");
        return;
    }

    events.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        if (a.start < b.start) return -1;
        if (a.start > b.start) return 1;
        return a.name.localeCompare(b.name);
    });

    const tbody = document.querySelector("#schedule-table tbody");
    tbody.innerHTML = "";

    events.forEach(event => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${event.originalDateStr}</td>
            <td>${allowedStartTime} - ${allowedEndTime}</td>
            <td>${event.name}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById("schedule-section").style.display = "block";
});
