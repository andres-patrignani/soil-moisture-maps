let ksCountiesLayer;

// MAP RELATED FUNCTIONS
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

ksCountiesLayer = L.geoJson(kscounties,{
    style: defaultStyle,
    onEachFeature: onEachFeature
 }).addTo(map);

 map.fitBounds(ksCountiesLayer.getBounds());


 // INFO CARD
 var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'has-text-danger is-size-6'); // create a div with a class "info"
    this.update();
    return this._div;
};

info.update = function (properties) {
    this._div.innerHTML = (properties ?
        '<b>County: ' + properties.NAME + '</b><br/>'
        : 'Hover over a county');
};

info.addTo(map);


function requestMapApi(mapUrl, mapName, mapUnits, mapRange, mapPalette){
    console.log('Loaded: ' + mapUrl)
    document.getElementById("countyStatsTable").style.display = 'none';
    document.getElementById("map").style.display = 'block';
    document.getElementById("mapLegend").style.display = 'block';
    let popup;
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
        layer.on("click", function(e) {
            if (e.value !== null) {
                let v = e.value.toFixed(0);
                let html = '<span> <b>Latitude</b>: ' + e.latlng.lat.toFixed(5) + '</span> <br/>';
                html += '<span> <b>Longitude</b>: ' + e.latlng.lng.toFixed(5) + '</span> <br/>';
                html += '<span> <b>' + mapName + '</b>: ' + v + ' ' + mapUnits + '</span> <br/>';
                popup = L.popup()
                    .setLatLng(e.latlng)
                    .setContent(html)
                    .openOn(map);
            }
        });

        // Load data associated with current map
        stateStatsFn();
        errorStatsFn();
        overlayMaps = {
            "Counties": ksCountiesLayer,
            "Map": layer
        };
        
        // Restore control layers
        controlLayers = L.control.layers(baseMaps, overlayMaps);
        controlLayers.addTo(map);

    });
}

// CONTROLS
var dateTextBox = document.getElementById('dateTextBox');
dateTextBox.value = setControlDate(controlDate.getTime());

var minusButton = document.getElementById('minusButton');
minusButton.addEventListener('click', function(){
    controlDate = new Date(Math.max( getControlDate() - 86400000, minDate));
    console.log('Executed minusB')
    loadNewLayer(controlDate,apiDir)
})

var plusButton = document.getElementById('plusButton');
plusButton.addEventListener('click', function(){
    controlDate = new Date(Math.min( getControlDate() + 86400000, maxDate));
    console.log(controlDate)
    loadNewLayer(controlDate,apiDir)
})

var datePicker = document.getElementById("dateTextBox");
datePicker.addEventListener('change', function(){
    console.log('Executed picker')
    loadNewLayer(new Date(getControlDate()),apiDir)
})

function loadNewLayer(controlDate,apiDir){
    fileDate = controlDate.getFullYear() + ('0' + (controlDate.getMonth()+1)).slice(-2) + ('0' + controlDate.getDate()).slice(-2); 
    if(apiDir.slice(0,5) === 'countystats'){
        rankingTable(apiRoot + apiDir + fileDate);
    } else {
        requestMapApi(apiRoot + apiDir + fileDate, mapName, mapUnits, mapRange, mapPalette); 
    }
    dateTextBox.value = setControlDate(controlDate.getTime());
};


function getControlDate(){
    let dateString = document.getElementById("dateTextBox").value;
    let dateParts = dateString.split('-');
    let year = parseFloat(dateParts[0]);
    let month = parseFloat(dateParts[1]);
    let day = parseFloat(dateParts[2]);
    let dateNumber = new Date(year,month-1,day).getTime();
    return dateNumber;
}

function setControlDate(dateNumber){
    let dateString = new Date(dateNumber);
    let year = dateString.getFullYear();
    let month = dateString.getMonth() + 1;
    let day = dateString.getDate();
    if(day<10){
        day = '0' + day;
    }

    if(month<10){
        month = '0' + month;
    }
    return year + '-' + month + '-' + day;
}


// MAP FUNCTIONS
function storageFn(){
    apiDir = 'storage/';
    mapName = 'Soil water storage';
    mapUnits = 'milimeters';
    mapRange = [0, 250];
    mapPalette = 'Spectral';
    requestMapApi(apiRoot + apiDir + fileDate, mapName, mapUnits, mapRange, mapPalette); // Initiate map
    legendLabels(mapName, mapUnits, mapPalette, 10, mapRange[0], mapRange[1]);
    useTemplate('storageDescription', 'mapDescriptions');
}

function pawFn(){
    apiDir = 'paw/';
    mapName = 'Plant available water';
    mapUnits = '%';
    mapRange = [0, 100];
    mapPalette = 'RdYlBu';
    requestMapApi(apiRoot + apiDir + fileDate, mapName, mapUnits, mapRange, mapPalette); // Initiate map
    legendLabels(mapName, mapUnits, mapPalette, 10, mapRange[0], mapRange[1]);
    useTemplate('pawDescription', 'mapDescriptions');
}

function pawForecastFn(){
    apiDir = 'pawforecast/';
    mapName = 'Plant available Water';
    mapUnits = '%';
    mapRange = [0, 100];
    mapPalette = 'Spectral';
    requestMapApi(apiRoot + apiDir + fileDate, mapName, mapUnits, mapRange, mapPalette); // Initiate map
    legendLabels(mapName, mapUnits, mapPalette, 10, mapRange[0], mapRange[1]);
    useTemplate('forecastDescription', 'mapDescriptions');
}

function precipitationDeficitFn(){
    apiDir = 'precipitationdeficit/';
    mapName = 'Precipitation deficit';
    mapUnits = 'milimeters';
    mapRange = [0, 100];
    mapPalette = 'OrRd';
    requestMapApi(apiRoot + apiDir + fileDate, mapName, mapUnits, mapRange, mapPalette); // Initiate map
    legendLabels(mapName, mapUnits, mapPalette, 10, mapRange[0], mapRange[1])
    useTemplate('deficitDescription', 'mapDescriptions');
}

function precipitationCumulativeFn(){
    apiDir = 'precipitationcumulative/'; // Replace with apiFolder
    mapName = 'Cumulative Precipitation';
    mapUnits = 'milimeters';
    mapRange = [0, 250];
    mapPalette = 'Blues';
    requestMapApi(apiRoot + apiDir + fileDate, mapName, mapUnits, mapRange, mapPalette); // Initiate map
    legendLabels(mapName, mapUnits, mapPalette, 10, mapRange[0], mapRange[1])
    useTemplate('precipitationDescription', 'mapDescriptions');
}

function countyStatsFn(){
    apiDir = 'countystats/';
    rankingTable(apiRoot + apiDir + fileDate);
    useTemplate('countyStatsDescription','mapDescriptions');
}

function stateStatsFn(){
    fetch(apiRoot + 'statestats/' + fileDate)
    .then((resp) => resp.json())
    .then(function(stateData){
        document.getElementById('driestCounty').innerHTML = stateData.driestCounty;
        document.getElementById('droughtAreaKm').innerHTML = stateData.droughtAreaKm.toLocaleString('en',{useGrouping:true});
        document.getElementById('droughtAreaPercent').innerHTML = stateData.droughtAreaPercent;
        document.getElementById('droughtAreaKmForecast').innerHTML = stateData.droughtAreaKmForecast.toLocaleString('en',{useGrouping:true});
        document.getElementById('droughtPopulation').innerHTML = (Math.round(stateData.droughtPopulation/10)*10).toLocaleString('en',{useGrouping:true});
    })
}

function errorStatsFn(){
    if(mapName !== 'Soil water storage'){
        document.getElementById("mapStats").style.display= 'none';
    } else {
        document.getElementById("mapStats").style.display= 'block';
        fetch(apiRoot + 'errorstats/' + fileDate)
        .then((resp) => resp.json())
        .then(function(errorData){
            document.getElementById('medianAbsoluteDeviation').innerHTML = errorData.medianAbsoluteDeviation + ' mm';
            document.getElementById('rootMeanSquaredError').innerHTML = errorData.rootMeanSquaredError + ' mm';
            document.getElementById('meanBiasError').innerHTML = errorData.meanBiasError + ' mm';
            document.getElementById('numberStationsAssimilated').innerHTML = errorData.kansasMesonetStations.length;
        })
    }
}

function rankingTable(tableUrl){
    document.getElementById("countyStatsTable").style.display= 'block';
    document.getElementById("map").style.display = 'none';
    document.getElementById("mapLegend").style.display = 'none';
    fetch(tableUrl)
        .then((resp) => resp.json())
        .then(function(countyData){
            let htmlTable = "";
            for(i=0; i<countyData.length; i++){
                
                htmlTable += "<tr>";
                htmlTable += "<td class='has-text-centered'>" + (i+1) + "</td>"
                htmlTable += "<td>" + countyData[i].name + "</td>"
                htmlTable += "<td class='has-text-centered'>" + countyData[i].medianStorage + "</td>"
                htmlTable += "<td class='has-text-centered'>" + countyData[i].medianPaw + "</td>"
                htmlTable += "<td class='has-text-centered'>" + countyData[i].areaStress + "</td>"
                htmlTable += "<td class='has-text-centered'>" + countyData[i].percentAreaStress + "</td>"
                htmlTable += "<td class='has-text-centered'>" + countyData[i].rankDriest + "</td>";
                htmlTable += "</tr>";
            }
            document.getElementById('rankingTable').innerHTML = htmlTable;
        })
}

function useTemplate(templateId, appendId) {
    var temp = document.getElementById(templateId);
    var clon = temp.content.cloneNode(true);
    var mapDescription = document.getElementById(appendId);
    // Remove existing description
    var element = mapDescription.getElementsByTagName('p');
    while (element[0]) element[0].parentNode.removeChild(element[0])
    // Add new description
    mapDescription.appendChild(clon);
}

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
        htmlLegend += "<li><span style='background:" + paletterRange[i] + ";'></span>" + a + " - " + b + "</li>"
    }
    document.getElementById("legend-labels").innerHTML = htmlLegend;
    document.getElementById("legend-title").innerHTML = title + ' (' + units + ')';
}

