// GLOBAL VARIABLES
apiRoot = 'https://soilwater.ksu.edu/api/1km/'; // Server host
//apiRoot = 'http://localhost:3000/api/1km/'; // Local host
let apiDir;
let mapName;
let mapUnits;
let mapRange;
let mapPalette;

let currentDate = new Date();
let yesterdayDate = new Date((currentDate.getTime() - 86400000));
let controlDate = new Date(yesterdayDate.getFullYear(), yesterdayDate.getMonth(), yesterdayDate.getDate(), 0, 0, 0, 0);
let minDate = new Date(2018,0,1,0,0,0,0).getTime();
let maxdate;
if(currentDate.getHours() < 8){
    maxDate = yesterdayDate.getTime() - 86400000;
} else {
    maxDate = yesterdayDate.getTime();
}
let fileDate = controlDate.getFullYear() + ('0' + (controlDate.getMonth()+1)).slice(-2) + ('0' + controlDate.getDate()).slice(-2); 

