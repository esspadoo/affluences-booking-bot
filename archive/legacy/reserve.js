
function waitForConnection() {
    // Check if the user is already online
    if (navigator.onLine) {
        console.log("Internet is already connected!");
        // Proceed with the rest of the code
        mainProcess();
    } else {
        console.log("Waiting for internet connection...");
        
        // Wait until the 'online' event is triggered
        window.addEventListener('online', () => {
            console.log("Internet connection restored!");
            mainProcess();
        });
    }
}
	
function mainProcess(){	
	const axios = window.axios;
	setTimeout(3000);
	const out = document.getElementById("out");

	// CODICI BIBLIOTECA + POSTO, CODICI UTENTE E MAIL
	const mate_56 = 70083
	const gp_code = window.AFFLUENCES_CONFIG.userIdentifiers.MATE
	const gp_mail = window.AFFLUENCES_CONFIG.email
	
	//CODICE VALLISNERI
	const valli_29 = 70007
	const gp_code_v = window.AFFLUENCES_CONFIG.userIdentifiers.VALLI
	

	//CALCOLO DATA SETTIMANA
	function getNextSevenDays() {
	  const today = new Date(); // Get the current date
	  const datesArray = [];

	  for (let i = 1; i <= 7; i++) {
		// Add i days to the current date
		const nextDay = new Date(today);
		nextDay.setDate(today.getDate() + i);

		// Get the full year, month, and date, automatically handling overflows
		const year = nextDay.getFullYear();
		const month = String(nextDay.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, so we add 1
		const day = String(nextDay.getDate()).padStart(2, '0'); // Add leading zero if needed
		
		// Get the name of the day
		const dayName = nextDay.toLocaleDateString('en-US', { weekday: 'long' });
		
		// Format the date as 'year-month-day'
		const formattedDate = `${year}-${month}-${day}`;
		
		// Push the formatted date and day name as separate values
		datesArray.push({ date: formattedDate, dayName: dayName });
	  }

	  return datesArray;
	}

	console.log(getNextSevenDays());

	dArray = getNextSevenDays();
	for(let i=0; i<dArray.length;i++){
		nameDay = dArray[i].dayName;
		if(nameDay == "Sunday" || nameDay == "Saturday"){console.log("Domenica/Sabato non prenoto!!")}
		// LUNEDI
		if (nameDay == "Monday") {
			//MATE
			sendReservation(mate_56, gp_code, gp_mail, "13:30", "17:30",dArray[i].date,i);
			sendReservation(mate_56, gp_code, gp_mail, "17:30", "20:00",dArray[i].date,i);
			
			//VALLI
			//sendReservation(valli_29, gp_code_v, gp_mail, "13:30", "18:00",dArray[i].date,i);
		}

		// MARTEDI
		if (nameDay == "Tuesday") {
			//MATE
			sendReservation(mate_56, gp_code, gp_mail, "08:30", "12:30",dArray[i].date,i);
			sendReservation(mate_56, gp_code, gp_mail, "13:30", "17:30",dArray[i].date,i);
			
			
		}

		// MERCOLEDI
		if (nameDay == "Wednesday") {
			//MATE
			sendReservation(mate_56, gp_code, gp_mail, "13:30", "17:30",dArray[i].date,i);
			
			
		}

		// GIOVEDI
		if (nameDay == "Thursday") {
			//MATE
			sendReservation(mate_56, gp_code, gp_mail, "16:30", "20:30",dArray[i].date,i);
			
			
			//VALLI
			//sendReservation(valli_29, gp_code_v, gp_mail, "8:30", "13:00",dArray[i].date,i);
		}

		// VENERDI
		if (nameDay == "Friday") {
			//MATE
			sendReservation(mate_56, gp_code, gp_mail, "16:30", "20:00",dArray[i].date,i);
			
			//VALLI
		}
	}


	function sendReservation(placeCode, user_identifier, user_email, startTime, endTime, date,i) { 

		const giorni = ["lun", "mar", "mer", "gio", "ven"]
		let dout = "prenoto " + user_email + ": --> " + dArray[i].dayName + "  " + date + " dalle " + startTime + " alle " + endTime + "<br>";

		const config = {
			headers: {
				"accept-encoding": "gzip",
				"accept-language": "it",
				"content-length": 241,
				"content-type": "application/json; charset=utf-8",
				"host": "reservation.affluences.com",
				"user-agent": "Affluences/202412030 Dalvik/2.1.0 (Linux; U; Android 6.0; HUAWEI CRR-L09 Build/HUAWEICRR-L09)",
				"user-identifier": user_identifier
			}
		}

		const url = "https://reservation.affluences.com/api/reserve/" + placeCode;

		const data = {
			"email": user_email,
			"date": date,
			"start_time": startTime,
			"end_time": endTime,
			"person_count": 1,
			"note": null,
			"user_firstname": null,
			"user_lastname": null,
			"user_phone": null,
			"custom_fields_inputs": null,
			"auth_type": null
		}

		axios.post(url, data, config)
			
			.then(res => out.innerHTML += dout +"<br>" + res.data.successMessage + "<br><br><hr>")
			.catch(err => out.innerHTML += dout +"<br>"+ err.response.data.errorMessage + "<br><br><hr>")
	}
}

waitForConnection();
