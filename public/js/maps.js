// ADD BASEMAPS
let layer;
let s;
let controlLayers;
let baseMaps = {}; // No basemaps for now in this project;
let overlayMaps; // Added/removed dynamically when loading the maps

let map = L.map("map", {zoomSnap: 0.5, zoomControl: false}).setView([38.5, -98.5], 7.6);;
new L.Control.Zoom({ position: 'bottomright' }).addTo(map);



L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let mapUrl = 'maps/storage_20201017.tif'
mapRange = [0,250];
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

