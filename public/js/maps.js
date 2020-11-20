let metaLayers = {
    "storage": {
        "name": "Soil water storage",
        "units": "mm",
        "palette": "Spectral",
        "textLabels": ['0','25','50','75','100','125','150','175','200','225','250'],
        "positionLabels": [0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250],
        "range": [0,250],
        "url": "maps/",
        "filename": "storage_",
        "extension": ".tif",
        "description": "Soil water storage in the top 50 cm of the soil profile at 1 km spatial resolution. This map combines the output of a model with actual soil moisture observations from stations of the Kansas Mesonet."
    },
    "vegetation": {
        "name": "Enhanced Vegetation Index",
        "units": "unitless",
        "palette": "Greens",
        "range": [0,1],
        "textLabels": ["0","0.1","0.2","0.3","0.4","0.5","0.6","0.7","0.8","0.9","1.0"],
        "positionLabels": [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        "url": "maps/",
        "filename": "evi2_16_day_",
        "extension": ".tif",
        "description": "Two-band 16-day composite vegetation index obtained from NASA's Moderate Resolution Imaging Spectroradiometer (MODIS) at 1 km resolution. The map illustrates the relative amount of vegetation."
    }
}

// GLOBAL VARIABLES
let layer;
let s;
let controlLayers;
let baseMaps = {}; // No basemaps for now in this project;
let overlayMaps; // Added/removed dynamically when loading the maps
let legend;

let maxDate = new Date().getTime();
let minDate = currentDate - 7*86400000; 


// Slider planting and forecasting date
var dateSlider = document.getElementById('dateSlider');
let dateSliderValue = document.getElementById('dateSliderValue');
noUiSlider.create(dateSlider, { connect: true, range:{min: minDate, max:timestamp(2020,11,31)}, step: 86400000, start: [maxDate] });
dateSlider.noUiSlider.on('update', function (values, handle) { 
    if(handle == 0){ 
        dateSliderValue.innerHTML = 'Date: ' + formatDateSlider(parseInt(values[handle]));
    }
});

// Update management slider with observations boundaries
dateSlider.noUiSlider.updateOptions( {range: {'min': startDate, 'max': endDate} }); // Update the range of the date slider       
dateSlider.noUiSlider.set([startDate,forecastDate]); // Set the date slider using the first and last dates of the observations dataset

function formatDateSlider(dateInMilli) {
    // Input date must be in milliseconds
    date = new Date(dateInMilli);
    let year = date.getFullYear().toString();
    let month  = date.getMonth();
    let day =  date.getDate().toString();
    let monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return day + '-' + monthShortNames[month] + '-' + year;
  }

let controlDate;
if(currentDate.getHours() < 8){
    controlDate = new Date(currentDate.getTime() - 2*86400000);
} else {
    controlDate = new Date(currentDate.getTime() - 86400000);
}

let maxDate = controlDate; // This will only run on page load, so maxDate will not be updated on other calls.
let minDate = new Date(controlDate.getTime() - 7*86400000); 
let datePicker = document.getElementById("date-picker");
let layerPicker = document.getElementById("map-layers");
setControlDate(controlDate);


function setControlDate(date){
    let year = date.getFullYear().toString();
    let month = (date.getMonth() + 1).toString();
    let day = date.getDate().toString();
    datePicker.value = year + '-' + month + '-' + day;
    controlDate = date;
}


function dateToMapDate(date){
    mapDate = date.getFullYear() + ('0' + (date.getMonth()+1)).slice(-2) + ('0' + date.getDate()).slice(-2)
    return mapDate
}




let plusButton = document.getElementById('plus-date');
plusButton.addEventListener('click', function(){
    let existingDate = new Date(datePicker.value);
    controlDate = new Date( Math.min( existingDate.getTime() + 86400000 + existingDate.getTimezoneOffset()*60*1000, maxDate.getTime() ) );
    console.log(controlDate);
    setControlDate(controlDate);
    loadLayer(metaLayers[layerPicker.value], controlDate);
})

layerPicker.addEventListener('change', function(){loadLayer(metaLayers[layerPicker.value], controlDate)}, false);

// LEAFLET variables
let map = L.map("map", {zoomSnap: 0.5, zoomControl: false}).setView([38.5, -98.5], 8);
new L.Control.Zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let ksCountiesLayer = L.geoJson(kscounties,{
    style: defaultStyle,
    onEachFeature: onEachFeature
}).addTo(map);


// Initialize map
loadLayer(metaLayers[layerPicker.value], controlDate)


var info = L.control();
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'county-name'); // create a div with a class "info"
    this.update();
    return this._div;
};

info.update = function (properties) {
    this._div.innerHTML = (properties ?
        '<b>County: ' + properties.NAME + '</b><br/>'
        : 'Hover over a county');
};

info.addTo(map);


function defaultStyle(feature) {
    return {
        fillColor: 'white',
        fillOpacity: 0.1,
        weight: 1,
        opacity: 1,
        color: '#ff1493'
    };
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        fillColor: 'white',
        fillOpacity: 0.2,
        weight: 3,
        color: '#ff1493',
        dashArray: '5'
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    ksCountiesLayer.resetStyle(e.target);
    info.update();
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
    });
}

function loadLayer(metadata,date){
    let fileDate = date.getFullYear() + ('0' + (date.getMonth()+1)).slice(-2) + ('0' + date.getDate()).slice(-2); 
    mapUrl = metadata.url + metadata.filename + fileDate + metadata.extension;
    fetch(mapUrl).then(r => r.arrayBuffer()).then(function(buffer) {
        s = L.ScalarField.fromGeoTIFF(buffer);
        if (map.hasLayer(layer)){
            map.removeLayer(layer); // Remove existing map
            controlLayers.remove(); // Remove existing control layers
        }
        layer = L.canvasLayer.scalarField(s,{
                                        color: chroma.scale(metadata.palette).domain(metadata.range).classes(10),
                                        opacity: 1,
                                        setZIndex: 1,
                                        inFilter: (v) => v < 255
                                        }).addTo(map); // Add new map

        layer.on("click", function(e) {
            if (e.value !== null) {
                let v = e.value.toFixed(1);
                let html = '<span> <b>Latitude</b>: ' + e.latlng.lat.toFixed(5) + '</span> <br/>';
                html += '<span> <b>Longitude</b>: ' + e.latlng.lng.toFixed(5) + '</span> <br/>';
                html += '<span> <b>' + metadata.name + '</b>: ' + v + ' ' + metadata.units + '</span> <br/>';
                popup = L.popup()
                    .setLatLng(e.latlng)
                    .setContent(html)
                    .openOn(map);
            }
        });

        // Remove existing map legend
        if(legend !== undefined){legend.remove()}

        // Add map legend
        legend = L.control.colorBar(chroma.scale(metadata.palette).domain(metadata.range), metadata.range, {
            title: metadata.name + ' (' + metadata.units + ') \xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0 Soil Water Processes Lab - Kansas State University - ' + controlDate.toLocaleDateString(),
            units: metadata.units,
            steps: 50,
            decimals: 1,
            width: 500,
            height: 10,
            position: 'bottomleft',
            background: 'white',
            textColor: 'black',
            textLabels: metadata.textLabels,
            labels: metadata.positionLabels,
            labelFontSize: 12
        })

        // Control layers
        overlayMaps = {
            "Counties": ksCountiesLayer,
            "Current map": layer
        };
        
        // Restore control layers
        controlLayers = L.control.layers(baseMaps, overlayMaps);
        controlLayers.addTo(map);
        document.getElementById("map-description").innerText = metadata.description;
        legend.addTo(map);
    });
    
}


