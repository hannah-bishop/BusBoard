import fetch from "node-fetch";

const response = await fetch("https://api.tfl.gov.uk/StopPoint/490008660N/Arrivals");
const arrivals = await response.json();
arrivals.forEach(arrival => console.log(`The next bus to ${arrival.destinationName} is in ${arrival.timeToStation} seconds`));

