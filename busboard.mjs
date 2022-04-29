import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fetch from "node-fetch";
const prompt = require("prompt-sync")();

let postcode = prompt("Please enter your postcode: ")
let postcodeInfo = await fetch(`http://api.postcodes.io/postcodes/${postcode}`);
let postcodeInfo2 = await postcodeInfo.json();

while (!postcodeInfo.ok || postcodeInfo2.result.region !== 'London'){
    try {
        postcodeInfo = await fetch(`http://api.postcodes.io/postcodes/${postcode}`);
        postcodeInfo2 = await postcodeInfo.json();
        if (!postcodeInfo.ok){
            throw 'This postcode is not valid'
        }
        if (postcodeInfo2.result.region !== 'London'){
            throw 'This postcode is not covered by TFL'
        }
    }
    catch (e){
        console.log(e)
        postcode = prompt("Please enter the correct postcode: ")
    }
}


const postcodeLong = postcodeInfo2.result.longitude;
const postcodeLat = postcodeInfo2.result.latitude;


const nearestStop = await fetch(`https://api.tfl.gov.uk/StopPoint/?lat=${postcodeLat}&lon=${postcodeLong}&stopTypes=NaptanPublicBusCoachTram`)
const nearestStop2 = await nearestStop.json();
const nearestStopsArray = nearestStop2.stopPoints;
let nearestStopsArray2 = [];

nearestStopsArray.forEach(stop => nearestStopsArray2.push([stop.naptanId,stop.distance,stop.commonName,stop.indicator]));
console.log(`The two nearest stations are ${nearestStopsArray2[0][2]} (${nearestStopsArray2[0][3]}) and ${nearestStopsArray2[1][2]} (${nearestStopsArray2[1][3]})`)

for (let i=0; i<2; i++){
    console.log(`${nearestStopsArray2[i][2]} (${nearestStopsArray2[i][3]})`)
    const response = await fetch(`https://api.tfl.gov.uk/StopPoint/${nearestStopsArray2[i][0]}/Arrivals`);
    const arrivals = await response.json();
    arrivals.sort((a,b) => a.timeToStation - b.timeToStation);
    const arrivalsSlice = arrivals.slice(0,5);
    arrivalsSlice.forEach(arrival => console.log(`Bus to ${arrival.destinationName} is in ${arrival.timeToStation} seconds`));
}

