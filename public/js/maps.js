// ADD BASEMAPS
let layer;
let s;
let controlLayers;
let baseMaps = {}; // No basemaps for now in this project;
let overlayMaps; // Added/removed dynamically when loading the maps

let map = L.map("map", {zoomSnap: 0.5, zoomControl: false}).setView([38.5, -98.5], 8);;
new L.Control.Zoom({ position: 'bottomright' }).addTo(map);



L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let mapUrl = 'maps/evi2_16_day_20201020.tif'
mapName = 'Storage'
mapUnits = 'mm'
mapRange = [0,1];
mapPalette = 'Spectral';

fetch(mapUrl).then(r => r.arrayBuffer()).then(function(buffer) {
    s = L.ScalarField.fromGeoTIFF(buffer);
    if (map.hasLayer(layer)){
        map.removeLayer(layer); // Remove existing map
        controlLayers.remove(); // Remove existing control layers
    }
    layer = L.canvasLayer.scalarField(s,{
                                    color: chroma.scale(mapPalette).domain(mapRange).classes(10),
                                    opacity: 1,
                                    setZIndex: 1,
                                    inFilter: (v) => v < 255
                                    }).addTo(map); // Add new map
    
    // Restore control layers
    controlLayers = L.control.layers(baseMaps, overlayMaps);
    controlLayers.addTo(map);
});

legendLabels(mapName,mapUnits, mapPalette, 10, mapRange[0], mapRange[1])


function legendLabels(title,units,palette,N,minRange,maxRange){
    let interval = (maxRange - minRange)/N;
    let paletterRange = chroma.scale(palette).colors(N);
    let htmlLegend = '';

    for(let i=0; i<N; i++){
        let a = minRange + i * interval;
        let b = a + interval;

        if(Math.abs(maxRange-minRange) < N){
            a = a.toFixed(1);
            b = b.toFixed(1);
        } else {
            a = a.toFixed(0);
            b = b.toFixed(0);
        }
        htmlLegend += '<i style="background-color:' + paletterRange[i] + ';  height: 10px; width:100px">'+ a + '-' + b + '</i>' 
    }
    document.getElementById("legend-labels").innerHTML = htmlLegend;
    console.log(htmlLegend)
    document.getElementById("legend-title").innerHTML = title + ' (' + units + ')';
}

