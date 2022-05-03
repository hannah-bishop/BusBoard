import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fetch from "node-fetch";
const prompt = require("prompt-sync")();
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

let postcode = prompt("Please enter your postcode: ");
let postcodeInfo = await fetch(`http://api.postcodes.io/postcodes/${postcode}`);
let postcodeInfo2 = await postcodeInfo.json();

while (!postcodeInfo.ok || postcodeInfo2.result.region !== 'London'){
    try {
        postcodeInfo = await fetch(`http://api.postcodes.io/postcodes/${postcode}`);
        postcodeInfo2 = await postcodeInfo.json();
        if (!postcodeInfo.ok){
            logger.error(`invalid postcode: ${postcode}`);
            throw 'This postcode is not valid';
        }
        if (postcodeInfo2.result.region !== 'London'){
            logger.error(`postcode outside of London: ${postcode}`);
            throw 'This postcode is not covered by TFL';
        }
    }
    catch (e){
        console.log(e);
        postcode = prompt("Please enter the correct postcode: ");
    }
}

const postcodeLong = postcodeInfo2.result.longitude;
const postcodeLat = postcodeInfo2.result.latitude;
logger.info(`postcode longtitude: ${postcodeLong}, postcode latitude: ${postcodeLat}`)
let radius = prompt("Enter your desired radius :");
let nearestStop = await fetch(`https://api.tfl.gov.uk/StopPoint/?lat=${postcodeLat}&lon=${postcodeLong}&stopTypes=NaptanPublicBusCoachTram&radius=${radius}`)
let nearestStop2 = await nearestStop.json();

while( !nearestStop.ok || nearestStop2.stopPoints.length < 2){
    try{
        nearestStop = await fetch(`https://api.tfl.gov.uk/StopPoint/?lat=${postcodeLat}&lon=${postcodeLong}&stopTypes=NaptanPublicBusCoachTram&radius=${radius}`);
        nearestStop2 = await nearestStop.json();
      if(!nearestStop.ok){
        logger.error(`radius too large / not a number: ${radius}`);
        throw "You have not entered a number less than 86000";
    }
      if(nearestStop2.stopPoints.length < 2){
        logger.error(`radius not large enough: ${radius}`);
        throw "Not able to find at least 2 bustop within this radius";
      }
    } catch(e){
        console.log(e);
        radius = prompt("Enter the another radius :");
    }   
}

const nearestStopsArray = nearestStop2.stopPoints;
let nearestStopsArray2 = [];

nearestStopsArray.forEach(stop => nearestStopsArray2.push([stop.naptanId,stop.distance,stop.commonName,stop.indicator]));
nearestStopsArray2.forEach(id => logger.info(`Common Name: ${id[2]}, Indicator: ${id[3]}, naptanId: ${id[0]}`))
console.log(`The two nearest stations are ${nearestStopsArray2[0][2]} (${nearestStopsArray2[0][3]}) and ${nearestStopsArray2[1][2]} (${nearestStopsArray2[1][3]})`)

for (let i=0; i<2; i++){
    console.log(`${nearestStopsArray2[i][2]} (${nearestStopsArray2[i][3]})`)
    const response = await fetch(`https://api.tfl.gov.uk/StopPoint/${nearestStopsArray2[i][0]}/Arrivals`);
    const arrivals = await response.json();
    if (arrivals.length === 0){
        console.log('There are no buses coming to this stop');
        logger.info(`Bus stop closure for ${nearestStopsArray2[i][2]} (${nearestStopsArray2[i][3]})`)
    }
    arrivals.sort((a,b) => a.timeToStation - b.timeToStation);
    const arrivalsSlice = arrivals.slice(0,5);
    arrivalsSlice.forEach(arrival => console.log(`Bus to ${arrival.destinationName} is in ${arrival.timeToStation} seconds`));
}