let allowedStartTime, allowedEndTime;
let events = [];

const STORAGE_KEY = "schedule_app_data";

document.getElementById("set-time-range").addEventListener("click", () => {
    allowedStartTime = document.getElementById("start-time").value;
    allowedEndTime = document.getElementById("end-time").value;

    if (!allowedStartTime || !allowedEndTime || allowedStartTime >= allowedEndTime) {
        alert("Enter a valid start and end time.");
        return;
    }

    document.getElementById("time-limit-section").style.display = "none";
    document.getElementById("event-section").style.display = "block";

    saveToStorage();
});

document.getElementById("add-event").addEventListener("click", () => {
    const name = document.getElementById("event-name").value.trim();
    const dateStr = document.getElementById("event-date").value.trim();
    const start = document.getElementById("event-start").value;
    const end = document.getElementById("event-end").value;

    if (!name || !dateStr || !start || !end || start >= end) {
        alert("Please fill out the event fields correctly.");
        return;
    }

    const [d, m, y] = dateStr.split(":").map(Number);
    const parsedDate = new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

    if (isNaN(parsedDate)) {
        alert("Date must be in D:M:Y format.");
        return;
    }

    events.push({ name, date: parsedDate, start, end });
    saveToStorage();

    document.getElementById("event-name").value = "";
    document.getElementById("event-date").value = "";
    document.getElementById("event-start").value = "";
    document.getElementById("event-end").value = "";
});

document.getElementById("create-schedule").addEventListener("click", () => {
    if (events.length === 0) {
        alert("Add at least one event first.");
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

    let currentDate = new Date(events[0].date);

    events.forEach(event => {
        const row = document.createElement("tr");
        const dateStr = `${String(currentDate.getDate()).padStart(2, '0')}:${String(currentDate.getMonth() + 1).padStart(2, '0')}:${currentDate.getFullYear()}`;
        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${allowedStartTime} - ${allowedEndTime}</td>
            <td contenteditable="true">${event.name}</td>
        `;
        tbody.appendChild(row);
        currentDate.setDate(currentDate.getDate() + 1);
    });

    document.getElementById("schedule-section").style.display = "block";
    saveToStorage();
});

document.getElementById("download-excel").addEventListener("click", () => {
    const wb = XLSX.utils.book_new();
    const rows = [["Date", "Time (Fixed Range)", "Event Name"]];
    document.querySelectorAll("#schedule-table tbody tr").forEach(row => {
        const cells = row.querySelectorAll("td");
        rows.push([cells[0].textContent, cells[1].textContent, cells[2].textContent]);
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
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const tbody = document.querySelector("#schedule-table tbody");
        tbody.innerHTML = "";

        for (let i = 1; i < json.length; i++) {
            const [date, time, name] = json[i];
            if (!date || !time || !name) continue;
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${date}</td>
                <td>${time}</td>
                <td contenteditable="true">${name}</td>
            `;
            tbody.appendChild(row);
        }

        document.getElementById("schedule-section").style.display = "block";
    };
    reader.readAsArrayBuffer(file);
});

document.getElementById("reset-schedule").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset everything?")) {
        localStorage.removeItem("schedule_app_data");
        location.reload();
    }
});

function saveToStorage() {
    const data = {
        allowedStartTime,
        allowedEndTime,
        events: events.map(e => ({
            name: e.name,
            date: e.date.toISOString(),
            start: e.start,
            end: e.end
        }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
        const data = JSON.parse(stored);
        allowedStartTime = data.allowedStartTime;
        allowedEndTime = data.allowedEndTime;
        events = data.events.map(e => ({
            name: e.name,
            date: new Date(e.date),
            start: e.start,
            end: e.end
        }));

        document.getElementById("start-time").value = allowedStartTime;
        document.getElementById("end-time").value = allowedEndTime;

        if (allowedStartTime && allowedEndTime) {
            document.getElementById("time-limit-section").style.display = "none";
            document.getElementById("event-section").style.display = "block";
        }
    } catch (e) {
        console.error("Error loading from localStorage", e);
    }
}

loadFromStorage();
