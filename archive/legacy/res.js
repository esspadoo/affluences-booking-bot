function waitForConnection() {
  if (navigator.onLine) {
    mainProcess();
  } else {
    window.addEventListener('online', mainProcess);
  }
}

function mainProcess() {
  const out = document.getElementById("out");
  const axios = window.axios;
  const mate_56 = 70083;
  const gp_code = window.AFFLUENCES_CONFIG.userIdentifiers.MATE;
  const gp_mail = window.AFFLUENCES_CONFIG.email;

  const next7 = getNextSevenDays();

  // Costruiamo l’array di tutte le promise
  const tasks = [];

  next7.forEach(({ date, dayName }) => {
    const slotsByDay = {
      Monday:    [["08:30","12:30"], ["13:30","17:30"], ["17:30","20:00"]],
      Tuesday:   [["08:30","12:30"]],
      Wednesday: [["08:30","12:30"]],
      Thursday:  [["08:30","10:30"], ["15:00","19:00"]],
      Friday:    [["08:30","12:30"], ["13:30","17:30"], ["17:30","20:00"]]
    };
    const slots = slotsByDay[dayName] || [];
    slots.forEach(([startTime, endTime]) => {
      const url  = `https://reservation.affluences.com/api/reserve/${mate_56}`;
      const data = { email: gp_mail, date, start_time: startTime, end_time: endTime, person_count: 1 };
      const config = {
        headers: {
          "Content-Type": "application/json",
          "user-identifier": gp_code
        }
      };
      const logLine = `Prenoto ${gp_mail} – ${dayName} ${date} dalle ${startTime} alle ${endTime}<br>`;

      // Ogni promise ritorna un oggetto con logLine e msg
      const p = axios.post(url, data, config)
        .then(res => ({
          logLine,
          msg: res.data.successMessage || JSON.stringify(res.data)
        }))
        .catch(err => ({
          logLine,
          msg: err.response?.data?.errorMessage || err.message
        }));

      tasks.push(p);
    });
  });

  // Aspettiamo tutte le chiamate
  Promise.all(tasks).then(results => {
    results.forEach(({ logLine, msg }) => {
      out.innerHTML += logLine + msg + "<br><hr>";
    });
  });
}

function getNextSevenDays() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");
    return {
      date: `${yyyy}-${mm}-${dd}`,
      dayName: d.toLocaleDateString("en-US", { weekday: "long" })
    };
  });
}

waitForConnection();

