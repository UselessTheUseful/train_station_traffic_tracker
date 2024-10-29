const stations_list = document.querySelector("#stations_list")
const station_info = document.querySelector("#station_info")

fetch("https://rata.digitraffic.fi/api/v1/metadata/stations")
    .then(response => response.json())
    .then(data => create_stations_list(data))
    .catch(error => {console.error('Error fetching data');}); 

    function create_stations_list(stations) {
    for (let x in stations) {
        if (stations[x].passengerTraffic) {
            let station = document.createElement("li");

            station.innerHTML = stations[x].stationName;
            station.id = stations[x].stationShortCode;

            station.addEventListener("click", load_station_data);

            stations_list.appendChild(station);
        }
    }
}

function load_station_data() {
    let station = this.id;

    fetch(`https://rata.digitraffic.fi/api/v1/live-trains/station/${station}?version=0&arrived_trains=5&arriving_trains=5&departed_trains=5&departing_trains=5&include_nonstopping=false`)
    .then(response => response.json())
    .then(data => create_time_table(data, station))
}

function create_time_table(trains, id) {
    let titles = `<tr><th>Train</th><th>Commuter Line</th><th>Arrival</th><th>Departure</th></tr>`;
    let times = "";
    
    
    for (let train in trains) {
        let schedule = trains[train].timeTableRows;
        let train_type = trains[train].trainType
        let commuter_line = trains[train].commuterLineID
        let scheduled_time = {};

        times += "<tr>";

        times += `<th>${train_type} (${schedule.at(0).stationShortCode}-${schedule.at(-1).stationShortCode})</th>`;
        if (commuter_line == "") {
            times += `<th>N/A</th>`;
        } else {
            times += `<th>${commuter_line}</th>`;
        }

        for (let x in schedule) {
            if (schedule[x].stationShortCode == id) {
                if (schedule[x].type == "ARRIVAL") {
                    scheduled_time.arrival = schedule[x].scheduledTime;
                } else if (schedule[x].type == "DEPARTURE") {
                    scheduled_time.departure = schedule[x].scheduledTime
                }
            }
        }

        if (scheduled_time.arrival == undefined) {
            scheduled_time.arrival = "Starting station";
        }

        if (scheduled_time.departure == undefined) {
            scheduled_time.departure = "Final station";
        }

        times += `<th>${scheduled_time.arrival}</th><th>${scheduled_time.departure}</th>`

        times += "</tr>";
    }

    station_info.innerHTML = titles + times
}