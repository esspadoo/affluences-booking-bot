// reserve.js

function waitForConnection() {
  if (navigator.onLine) {
    mainProcess();
  } else {
    window.addEventListener("online", mainProcess);
  }
}

function mainProcess() {
  const axios = window.axios;
  const gp_mail = window.AFFLUENCES_CONFIG.email;
  const mate = { id: 70083, code: window.AFFLUENCES_CONFIG.userIdentifiers.MATE, name: "MATE" };
  const valli = { id: 70007, code: window.AFFLUENCES_CONFIG.userIdentifiers.VALLI, name: "VALLI" };
  
  // Prendo i prossimi 5 giorni lavorativi da Lunedì a Venerdì (saltando weekend)
  const days = getNextWorkdays(5, "Monday"); // inizia da Lunedì

  const slots = generateTimeSlots(); // 30 minuti da 8:30 a 20:00 per visualizzazione

  const libraries = [mate, valli];

  // Creo le tabelle
  createTables(libraries, days, slots);

  // Per memorizzare le prenotazioni e risposte
  const tasks = [];

  days.forEach(({ date, dayName }) => {
    // Per ogni giorno eseguo le prenotazioni grosso modo come nel tuo snippet
    libraries.forEach(lib => {
      // Ottengo gli intervalli grossi da prenotare in base al giorno e biblioteca
      const intervals = getBookingIntervals(lib.name, dayName);

      intervals.forEach(({ start, end }) => {
        const url = `https://reservation.affluences.com/api/reserve/${lib.id}`;
        const data = {
          email: gp_mail,
          date,
          start_time: start,
          end_time: end,
          person_count: 1
        };
        const config = {
          headers: {
            "Content-Type": "application/json",
            "user-identifier": lib.code
          }
        };

        const p = axios.post(url, data, config)
          .then(res => ({ lib: lib.name, day: dayName, start, end, status: "success", msg: res.data.successMessage }))
          .catch(err => {
            const errData = err.response?.data || {};
			const errMsg = errData.errorMessage || err.message;
			let status;

			if (errData.error === "already_have_reservation") {
				status = "already";
			} else {
				status = "fail";
			}

			return { lib: lib.name, day: dayName, start, end, status, msg: errMsg };
          });
        tasks.push(p);
      });
    });
  });

  Promise.all(tasks).then(results => {
    results.forEach(({ lib, day, start, end, status, msg }) => {
      // Coloro tutti gli slot da 30 min inclusi nell'intervallo prenotato
      const slotsToColor = getSlotsInInterval(start, end);
      slotsToColor.forEach(slot => {
        const cell = document.querySelector(`td[data-lib='${lib}'][data-day='${day}'][data-slot='${slot}']`);
        if(cell){
          cell.style.backgroundColor =
			status === "success" ? "#d4edda" :  // verde
			status === "already" ? "#fff3cd" : // arancione chiaro
			"#f8d7da";                         // rosso
          cell.textContent = (status === "success" || status === "already") ? "✔" : "✖";
          cell.title = msg;
        }
      });
    });
  });
}

function getNextWorkdays(n, startDayName) {
  // Torna i prossimi n giorni lavorativi a partire dal prossimo startDayName
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const today = new Date();
  let result = [];
  // Trova il primo giorno startDayName >= oggi
  let i = 0;
  while(true){
    let d = new Date(today);
    d.setDate(today.getDate() + i);
    let dn = dayNames[d.getDay()];
    if(dn === startDayName) break;
    i++;
  }
  // Ora prendi n giorni lavorativi da qui (Lun-Ven)
  let count = 0;
  while(count < n){
    let d = new Date(today);
    d.setDate(today.getDate() + i);
    let dn = dayNames[d.getDay()];
    if(dn !== "Saturday" && dn !== "Sunday"){
      result.push({
        date: d.toISOString().split("T")[0],
        dayName: dn
      });
      count++;
    }
    i++;
  }
  return result;
}

// Genera slot da 8:30 a 20:00 ogni 30 minuti (per visualizzazione)
function generateTimeSlots() {
  const start = new Date();
  start.setHours(8, 30, 0, 0);
  const end = new Date();
  end.setHours(20, 0, 0, 0);
  const slots = [];

  while (start < end) {
    const endSlot = new Date(start.getTime() + 30 * 60000);
    slots.push(`${start.toTimeString().slice(0,5)}-${endSlot.toTimeString().slice(0,5)}`);
    start.setTime(endSlot.getTime());
  }
  return slots;
}

// Data hardcoded delle prenotazioni da fare per giorno e biblioteca (come da tuo snippet)
function getBookingIntervals(libName, dayName){
  // Gli intervalli che hai indicato
  // Nota: le ore devono essere in formato "HH:mm"
  const intervals = [];

  if(dayName === "Saturday" || dayName === "Sunday") return intervals;

  if(dayName === "Monday" || dayName === "Wednesday"){
    if(libName === "MATE"){
      //intervals.push({start:"08:30", end:"12:30"});
      intervals.push({start:"13:30", end:"17:30"});
      intervals.push({start:"17:30", end:"20:00"});
    }
    /*if(libName === "VALLI"){
      intervals.push({start:"08:30", end:"13:00"});
      intervals.push({start:"13:30", end:"18:00"});
    }*/
  }
  if(dayName === "Tuesday"){
    if(libName === "MATE"){
      intervals.push({start:"08:30", end:"12:30"});
      intervals.push({start:"13:30", end:"17:30"});
      intervals.push({start:"17:30", end:"20:00"});
    }
    /*if(libName === "VALLI"){
      intervals.push({start:"08:30", end:"13:00"});
      intervals.push({start:"13:30", end:"18:00"});
    }*/
  }
  if(dayName === "Thursday"){
    if(libName === "MATE"){
      intervals.push({start:"16:30", end:"20:00"});
    }
    /*if(libName === "VALLI"){
      intervals.push({start:"08:30", end:"13:00"});
      intervals.push({start:"13:30", end:"18:00"});
    }*/
  }
  if(dayName === "Friday"){
    if(libName === "MATE"){
      intervals.push({start:"16:30", end:"20:00"});
    }
    /*if(libName === "VALLI"){
      intervals.push({start:"08:30", end:"13:00"});
      intervals.push({start:"13:30", end:"18:00"});
    }*/
  }
  return intervals;
}

// Dato un intervallo grosso, torna tutti gli slot da 30 minuti contenuti in esso (stringhe slot come "08:30-09:00")
function getSlotsInInterval(start, end){
  const slots = generateTimeSlots();
  // Restituisco solo gli slot che rientrano nell'intervallo [start,end)
  return slots.filter(slot => {
    const [slotStart, slotEnd] = slot.split("-");
    return slotStart >= start && slotEnd <= end;
  });
}

// Crea le tabelle per ogni biblioteca
function createTables(libraries, days, slots) {
  const container = document.getElementById("out");
  container.innerHTML = "";

  libraries.forEach(lib => {
    const table = document.createElement("table");
    table.className = "table table-bordered table-sm mb-4";

    const caption = document.createElement("caption");
    caption.className = "text-center fw-bold";
    caption.textContent = `Biblioteca ${lib.name}`;
    table.appendChild(caption);

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.innerHTML = `<th>Giorno</th>` + slots.map(s => `<th>${s.split("-")[0]}</th>`).join("");
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    days.forEach(day => {
      const row = document.createElement("tr");
      const dayNumber = new Date(day.date).getDate();
      row.innerHTML = `<th>${day.dayName} ${dayNumber}</th>` + slots.map(s => `<td data-lib='${lib.name}' data-day='${day.dayName}' data-slot='${s}'></td>`).join("");
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.appendChild(table);
  });
}

waitForConnection();
