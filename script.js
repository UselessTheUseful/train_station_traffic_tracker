// turning elements from html to variables
const stations_list_element = document.querySelector("#stations_list");
const station_info = document.querySelector("#station_info");
const station_title = document.querySelector("#station_title");
const search_bar = document.querySelector("#search")
let stations_nodelist;

// event listener for search bar
search_bar.addEventListener("input", search)

// fetch all stations 
fetch("https://rata.digitraffic.fi/api/v1/metadata/stations")
    .then(response => response.json())
    .then(data => create_stations_list(data)) // create a list of fetched stations and display it in browser
    .catch(error => {console.error('Error fetching stations data:' + error);}); 

function create_stations_list(stations) {
    // go through given list of stations
    for (let x in stations) {
        // check if station takes passenger traffic
        if (stations[x].passengerTraffic) {
            // create list element and save station name and short code to the element
            let station = document.createElement("li");
            station.innerHTML = stations[x].stationName;
            station.id = stations[x].stationShortCode;

            // add event listener to load the stations data
            station.addEventListener("click", load_station_data);

            // add station element to list element
            stations_list_element.appendChild(station);
        }
    }

    // save the stations into a node list for use in search function
    stations_nodelist = document.querySelectorAll("li")
}

function load_station_data() {
    let station = this.id;

    station_title.innerHTML = this.innerHTML;

    // fetch all trains that stop at specified station
    fetch(`https://rata.digitraffic.fi/api/v1/live-trains/station/${station}?version=0&arrived_trains=5&arriving_trains=5&departed_trains=5&departing_trains=5&include_nonstopping=false`)
    .then(response => response.json())
    .then(data => create_scheduled_time_table(data, station)) // create a table displaying the data
}

function create_scheduled_time_table(trains, station) {
    // create table titles row
    let titles = `<tr>
                        <th>Train</th>
                        <th>Commuter Line</th>
                        <th>Arrival</th>
                        <th>Departure</th>
                        <th>Track</th>
                    </tr>`;
    
    let table_content = "";
    
    // go through all trains that stop at this stations and add their data to the table
    for (let train in trains) {
        // get data for specific train
        let schedule = trains[train].timeTableRows;
        let train_type = trains[train].trainType;
        let commuter_line = trains[train].commuterLineID;
        let train_path = `(${schedule.at(0).stationShortCode}-${schedule.at(-1).stationShortCode})`

        // loot through stops to find relevant information only on the train's arrival and departure at given station
        let arrival = {}
        let departure = {}
        let track
        for (let x in schedule) {
            if (schedule[x].stationShortCode == station) {
                if (schedule[x].type == "ARRIVAL") {
                    arrival = schedule[x]
                } else if (schedule[x].type == "DEPARTURE") {
                    departure = schedule[x]
                }
            }
            track = schedule[x].commercialTrack
        }

        // add row for this trains data
        table_content += "<tr>";

        // add train type and path to table content
        table_content += `<th>${train_type} ${train_path}</th>`;

        // add commuter line if exists to table content
        if (commuter_line == "") {
            table_content += `<th>N/A</th>`;
        } else {
            table_content += `<th>${commuter_line}</th>`;
        }

        // arrival time and departure time formatting
        if (arrival.scheduledTime == undefined) {
            // check if starting station 
            arrival.scheduledTime = "Starting station";
        } else {
            // switch from utc to local time by making it a date then turning it back into a string
            arrival.scheduledTime = new Date(arrival.scheduledTime);
            arrival.scheduledTime = arrival.scheduledTime.toString().slice(4,21);
        }
        if (departure.scheduledTime == undefined) {
            departure.scheduledTime = "Final station";
        } else {
            departure.scheduledTime = new Date(departure.scheduledTime);
            departure.scheduledTime = departure.scheduledTime.toString().slice(4,21);
        }

        // add estimated delay information if delay is 1 minute or longer
        if (Number(arrival.differenceInMinutes) > 0) {
            arrival.scheduledTime += " +" + arrival.differenceInMinutes + "min";
        }
        if (Number(departure.differenceInMinutes) > 0) {
            departure.scheduledTime += " +" + departure.differenceInMinutes + "min";
        }

        //adding arrival and departure times to table content
        table_content += `<th>${arrival.scheduledTime}</th><th>${departure.scheduledTime}</th>`;

        //adding track where train stops to table content
        table_content +=  `<th>${track}</th>`

        // close row
        table_content += "</tr>";
    }

    // displaying data on the page and overwriting any previous displayed data
    station_info.innerHTML = titles + table_content;
}

function search() {
    // go through all stations using node list created in create_stations_list function
    for (let i = 0; i < stations_nodelist.length; i++) {
        // get stations name and current search term
        let station_name = stations_nodelist[i].innerHTML.toLowerCase()
        let search_query = search_bar.value.toLowerCase()

        // display only stations that include given search term
        if (station_name.includes(search_query)) {
            stations_nodelist[i].style.display = "";
        } else {
            stations_nodelist[i].style.display = "none";
        }
    }
}