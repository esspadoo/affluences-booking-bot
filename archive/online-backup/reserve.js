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
        
        

        const isMobile = window.innerWidth <= 768;

        if (!isMobile) {
        // --- Desktop table coloring (unchanged) ---
        const cell = document.querySelector(`td[data-lib='${lib}'][data-day='${day}'][data-slot='${slot}']`);
        if (cell) {
            cell.style.backgroundColor =
            status === "success" ? "#d4edda" :
            status === "already" ? "#fff3cd" :
            "#f8d7da";
            cell.textContent = (status === "success" || status === "already") ? "✔" : "✖";
            cell.title = msg;
        }
        } else {
        // --- Mobile card badges ---
        const body = document.querySelector(`div[data-lib='${lib}'][data-day='${day}']`);
        if (body) {
            const placeholder = body.querySelector(".text-muted");
            if (placeholder) placeholder.remove();

            const badge = document.createElement("span");
            badge.className = "badge rounded-pill px-2 py-1";
            badge.style.minWidth = "3.5rem";
            badge.style.fontSize = "0.85rem";
            badge.textContent = slot.split("-")[0]; // only start time
            badge.title = msg;

            if (status === "success") {
            badge.classList.add("bg-success-subtle", "text-success");
            } else if (status === "already") {
            badge.classList.add("bg-warning-subtle", "text-warning");
            } else {
            badge.classList.add("bg-danger-subtle", "text-danger");
            }

            body.appendChild(badge);
        }
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

  if(dayName === "Monday"){
    if(libName === "MATE"){
      intervals.push({start:"08:30", end:"12:30"});
      intervals.push({start:"13:00", end:"17:00"});
      intervals.push({start:"17:00", end:"20:00"});
    }
    if(libName === "VALLI"){
      intervals.push({start:"08:30", end:"13:00"});
      intervals.push({start:"13:00", end:"17:30"});
    }
  }
  
  if(dayName === "Tuesday"){
    if(libName === "MATE"){
      intervals.push({start:"08:30", end:"12:30"});
      intervals.push({start:"13:00", end:"17:00"});
      intervals.push({start:"17:00", end:"20:00"});
    }
    if(libName === "VALLI"){
      intervals.push({start:"08:30", end:"13:00"});
      intervals.push({start:"13:00", end:"17:30"});
    }
  }
  
  if(dayName === "Wednesday"){
    if(libName === "MATE"){
      intervals.push({start:"08:30", end:"12:30"});
      intervals.push({start:"13:00", end:"17:00"});
      intervals.push({start:"17:00", end:"20:00"});
    }
    if(libName === "VALLI"){
      intervals.push({start:"08:30", end:"13:00"});
      intervals.push({start:"13:00", end:"17:30"});
    }
  }
  
  if(dayName === "Thursday"){
    if(libName === "MATE"){
      intervals.push({start:"08:30", end:"12:30"});
      intervals.push({start:"13:00", end:"17:00"});
      intervals.push({start:"17:00", end:"20:00"});
    }
    if(libName === "VALLI"){
      intervals.push({start:"08:30", end:"13:00"});
      intervals.push({start:"13:00", end:"17:30"});
    }
  }
  if(dayName === "Friday"){
    if(libName === "MATE"){
      intervals.push({start:"08:30", end:"12:30"});
      intervals.push({start:"13:00", end:"17:00"});
      intervals.push({start:"17:00", end:"20:00"});
    }
    if(libName === "VALLI"){
      intervals.push({start:"08:30", end:"13:00"});
      intervals.push({start:"13:00", end:"17:30"});
    }
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

  const isMobile = window.innerWidth <= 768;

  if (!isMobile) {
    // --- Desktop: original table layout ---
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
        row.innerHTML =
          `<th>${day.dayName} ${dayNumber}</th>` +
          slots.map(
            s => `<td data-lib='${lib.name}' data-day='${day.dayName}' data-slot='${s}'></td>`
          ).join("");
        tbody.appendChild(row);
      });
      table.appendChild(tbody);

      container.appendChild(table);
    });
  } else {
    // --- Mobile: card-based layout ---
    libraries.forEach(lib => {
      const libCard = document.createElement("div");
      libCard.className = "card mb-3 shadow-sm";
      libCard.innerHTML = `
        <div class="card-header bg-primary-subtle fw-bold text-center">
          Biblioteca ${lib.name}
        </div>
      `;
      const libBody = document.createElement("div");
      libBody.className = "card-body";

      days.forEach(day => {
        const daySection = document.createElement("div");
        daySection.className = "mb-3 border-bottom pb-2";
        daySection.innerHTML = `
          <h6 class="fw-semibold mb-2">${day.dayName} ${new Date(day.date).getDate()}</h6>
          <div id="mobile-body-${lib.name}-${day.dayName}" 
               data-lib="${lib.name}" 
               data-day="${day.dayName}" 
               class="d-flex flex-wrap gap-1 small text-center">
            <span class="text-muted">Nessuna prenotazione ancora disponibile</span>
          </div>
        `;
        libBody.appendChild(daySection);
      });

      libCard.appendChild(libBody);
      container.appendChild(libCard);
    });
  }
}




waitForConnection();
