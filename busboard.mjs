import fetch from "node-fetch";

const postcodeInfo = await fetch("http://api.postcodes.io/postcodes/nw51tl");
const postcodeInfo2 = await postcodeInfo.json();


const postcodeLong = postcodeInfo2.result.longitude;
const postcodeLat = postcodeInfo2.result.latitude;

const nearestStop = await fetch(`https://api.tfl.gov.uk/StopPoint/?lat=${postcodeLat}&lon=${postcodeLong}&stopTypes=NaptanPublicBusCoachTram`)
const nearestStop2 = await nearestStop.json();
const nearestStopsArray = nearestStop2.stopPoints;
let nearestStopsArray2 = []

nearestStopsArray.forEach(stop => nearestStopsArray2.push([stop.naptanId,stop.distance,stop.commonName,stop.indicator]));
//console.log(nearestStopsArray2);
console.log(`The two nearest stations are ${nearestStopsArray2[0][2]} (${nearestStopsArray2[0][3]}) and ${nearestStopsArray2[1][2]} (${nearestStopsArray2[1][3]})`)

for (let i=0; i<2; i++){
    const response = await fetch(`https://api.tfl.gov.uk/StopPoint/${nearestStopsArray2[i][0]}/Arrivals`);
    const arrivals = await response.json();
    arrivals.sort((a,b) => a.timeToStation - b.timeToStation)
    arrivals.forEach(arrival => console.log(`Bus to ${arrival.destinationName} is in ${arrival.timeToStation} seconds`));
}

