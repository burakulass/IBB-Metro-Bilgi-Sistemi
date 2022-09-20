// Set bounds to New York, New York
var bounds = [
    [26,40], // Southwest coordinates
    [32, 42] // Northeast coordinates
    ];
mapboxgl.accessToken = 'pk.eyJ1IjoiYnVsYXMiLCJhIjoiY2w2NHBwdGdsMDBkczNqcG5iZDB1eHQ5YyJ9.-57p7Cy9n3bdPgKgyDJZfQ';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/traffic-day-v2',
    zoom: 10,
    center: [29,41],
 maxBounds: bounds
});

let Metrolar = [];
map.on('idle', () => {
    // hastane marker'ı
    map.loadImage(
        'https://cdn2.iconfinder.com/data/icons/public-services-filledoutline/64/HOSPITAL-health_clinic-urban-buildings-medical-24.png',
        // Add an image to use as a custom marker
        function (error, image) {
            if (error) throw error;
            map.addImage('hastane-marker', image);}
    );
    // İspark marker'ı
    map.loadImage(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Istanbul_Metro_Logo.svg/24px-Istanbul_Metro_Logo.svg.png',
        // Add an image to use as a custom marker
        function (error, image) {
            if (error) throw error;
            map.addImage('metro-marker', image);}
    );

    map.addSource('Metrolar', {
                    type: 'geojson',
                    data : 'https://api.maptiler.com/data/7fa92291-3c89-4cd5-add2-0c9124db8af4/features.json?key=iSoUk44tqFlB9UKqNl9v',
    });

    map.addSource('Hastaneler', {
        type: 'geojson',
         data : 'https://api.maptiler.com/data/7adf3e2c-3c26-490f-9950-41384819661e/features.json?key=iSoUk44tqFlB9UKqNl9v',
        }); 

    map.addLayer({
        'id': 'Metrolar',
        'type': 'symbol',
        
        'source': 'Metrolar',
        'layout': {
        // Make the layer visible by default.
        'visibility': 'visible',
        'icon-image': 'metro-marker',
        },
    });

    map.addLayer({
        'id': 'Hastaneler',
        'type': 'symbol',
        'source': 'Hastaneler',
       
        'filter': ['==', '$type', 'Point'],
        'layout': {
            'icon-image': 'hastane-marker',
            'visibility': 'visible',
        },
    });
    
    // Hastane İspark katmanlarını açma kapatma
    // If these two layers were not added to the map, abort
    if (!map.getLayer('Metrolar') || !map.getLayer('Hastaneler')) {
        return; 
    }

    // katmanların idlerini yaz
    const toggleableLayerIds = ['Metrolar', 'Hastaneler'];
                                    //
    // katman geçiş butonlarını ayarla
    for (const id of toggleableLayerIds) {
    // Skip layers that already have a button set up.
        if (document.getElementById(id)) {
        continue;
        }

        // Create a link.
        const link = document.createElement('a');
        link.id = id;
        link.href = '#';
        link.textContent = id;
        link.className = 'active';

        // Show or hide layer when the toggle is clicked.
        link.onclick = function (e) {
            const clickedLayer = this.textContent;
            e.preventDefault();
            e.stopPropagation();

            const visibility = map.getLayoutProperty(
                clickedLayer,
                'visibility'
            );

            // Toggle layer visibility by changing the layout object's visibility property.
            if (visibility === 'visible') {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                this.className = '';
            } 
            else {
                this.className = 'active';
                map.setLayoutProperty(
                clickedLayer,
                'visibility',
                'visible'
                );
            }
        };


        const layers = document.getElementById('menu_layer');
        layers.appendChild(link);
    }



    // iSPARK FİLTRELEME

    const filterEl = document.getElementById('Metro-feature-filter');
    const listingEl = document.getElementById('Metro-feature-listing');


    function renderListings(features) {
        const empty = document.createElement('p');
        // Clear any existing listings
        listingEl.innerHTML = '';
    
        if (features.length) {
            for (const feature of features) {
                const itemLink = document.createElement('a');
                const label = `${feature.properties.Name} `; // haritaya ismini yazdırma
                itemLink.textContent = label;
                itemLink.addEventListener('click', () => {
                    // Highlight corresponding feature on the map
                    popup
                        .setLngLat(feature.geometry.coordinates)
                        .setText(label)
                        .addTo(map);
                    
                        
                });
                listingEl.appendChild(itemLink);
            }
            
            // Show the filter input
            filterEl.parentNode.style.display = 'block';}
        else if (features.length === 0 && filterEl.value !== '') {
            empty.textContent = 'No results found';
            listingEl.appendChild(empty);}
        else {
            empty.textContent = 'Sonuçları görmek için haritayı hareket ettirin';
            listingEl.appendChild(empty);

            // Hide the filter input
            filterEl.parentNode.style.display = 'Sonuç bulunamadı';

            // remove features filter
            map.setFilter('Metrolar',);
        }
    }

    

    // aynı özellikte filtrelerin tekrar etmemesi için;
    function getUniqueFeatures(features, comparatorProperty) {
        const uniqueIds = new Set();
        const uniqueFeatures = [];
        for (const feature of features) {
            const id = feature.properties[comparatorProperty];
            if (!uniqueIds.has(id)) {
                uniqueIds.add(id);
                uniqueFeatures.push(feature);
            }
        }
        return uniqueFeatures;
    }



    map.on('movestart', () => {
        // harita hareket ettiği anda filtrenin değişmesini sağlar.
        map.setFilter('Metrolar', ); 
    });
     
    map.on('moveend', () => {
        const features = map.queryRenderedFeatures({ layers: ['Metrolar']});
    
     
        if (features) {
        const uniqueFeatures = getUniqueFeatures(features, 'Name');
        // Populate features for the listing overlay.
        renderListings(uniqueFeatures);
        
        // Clear the input container
        filterEl.value = '';
        
        // Store the current features in sn `airports` variable to
        // later use for filtering on `keyup`.
        İspark = uniqueFeatures;
        }
    });
     
    map.on('mousemove', 'Metrolar', (e) => {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';
     
    // Populate the popup and set its coordinates based on the feature.
    const feature = e.features[0];
    popup
    .setLngLat(feature.geometry.coordinates)
    .setText(
    `${feature.properties.Name} `
    )
    .addTo(map);
    });
   
     
    map.on('mouseleave', 'Metrolar', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
     
    filterEl.addEventListener('keyup', (e) => {
        const value = normalize(e.target.value);
     
        // Filter visible features that match the input value.
        const filtered = [];
        for (const feature of Metrolar) {
            const Name = normalize(feature.properties.Name);
            const code = normalize(feature.properties.abbrev);
            if (Name.includes(value) || code.includes(value)) {
            filtered.push(feature);}
        }
        
        // Populate the sidebar with filtered results
        renderListings(filtered);
        
        // Set the filter to populate features into the layer.
        if (filtered.length) {
            map.setFilter('Metrolar', [ 'match',
                filtered.map((feature) => {
                                return console.log(feature.properties.Name);
                                
            }),
            true,
            false
            ]);
        }
    });
     
    // Call this function on initialization
    // passing an empty array to render an empty state
    renderListings([]);




// disatance


newFunction();

function newFunction() {
    const distanceContainer = document.getElementById('distance');

    // GeoJSON object to hold our measurement features
    const geojson = {
        'type': 'FeatureCollection',
        'features': []
    };

    // Used to draw a line between points
    const linestring = {
        'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': []
        }
    };

    
        map.addSource('geojson', {
            'type': 'geojson',
            'data': geojson
        });

        // Add styles to the map
        map.addLayer({
            id: 'measure-points',
            type: 'circle',
            source: 'geojson',
            paint: {
                'circle-radius': 5,
                'circle-color': '#000'
            },
            filter: ['in', '$type', 'Point']
        });
        map.addLayer({
            id: 'measure-lines',
            type: 'line',
            source: 'geojson',
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            },
            paint: {
                'line-color': '#FF0000',
                'line-width': 2.5
            },
            filter: ['in', '$type', 'LineString']
        });

        map.on('click', (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['measure-points']
            });

            // Remove the linestring from the group
            // so we can redraw it based on the points collection.
            if (geojson.features.length > 1)
                geojson.features.pop();

            // Clear the distance container to populate it with a new value.
            distanceContainer.innerHTML = '';

            // If a feature was clicked, remove it from the map.
            if (features.length) {
                const id = features[0].properties.id;
                geojson.features = geojson.features.filter(
                    (point) => point.properties.id !== id
                );
            } else {
                const point = {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [e.lngLat.lng, e.lngLat.lat]
                    },
                    'properties': {
                        'id': String(new Date().getTime())
                    }
                };

                geojson.features.push(point);
            }

            if (geojson.features.length > 1) {
                linestring.geometry.coordinates = geojson.features.map(
                    (point) => point.geometry.coordinates
                );

                geojson.features.push(linestring);

                // Populate the distanceContainer with total distance
                const value = document.createElement('pre');
                const distance = turf.length(linestring);
                value.textContent = `    Distance: ${distance.toLocaleString()}km`;
                distanceContainer.appendChild(value);
            }

            map.getSource('geojson').setData(geojson);
        });
   

    map.on('mousemove', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['measure-points']
        });
        // Change the cursor to a pointer when hovering over a point on the map.
        // Otherwise cursor is a crosshair.
        map.getCanvas().style.cursor = features.length
            ? 'pointer'
            : 'crosshair';
    });


}

});
        
        
    // Create a popup, but don't add it to the map yet.
    var popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false
    });

map.on('click', 'Metrolar', function (e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';
    // DATADAN VERİLERİ ALMA   
    var coordinates = e.features[0].geometry.coordinates.slice();
    var Name = e.features[0].properties.Name;
    var LineId = e.features[0].properties.LineId;
    var LineName = e.features[0].properties.LineName;
    var IsActive = e.features[0].properties.IsActive;
    var BabyRoom = e.features[0].properties.BabyRoom;
    var WC = e.features[0].properties.WC;
    var Masjid = e.features[0].properties.Masjid;


    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Populate the popup and set its coordinates
    // based on the feature found.
    popup.setLngLat(coordinates).setHTML('<h4 class="h_metro">' + "DURAK iSMi:" + '</h4><p>' + e.features[0].properties.Name+'</p><h6 class="h_metro">' + "METRO NUMARASI:" + '</h6><p>' + e.features[0].properties.LineName +'</p><h6 class="h_metro">' + "BEBEK ODASI:" + '</h6><p>' + e.features[0].properties.BabyRoom + '</p><h6 class="h_metro">' + "LAVABO/MESCİT:" + '</h6><p>' + e.features[0].properties.WC + '</p>').addTo(map);

});


// HASTANE KOORDİNATLARINA VERİLERİ YAZDIRMAK İCİN
map.on('click', 'Hastaneler', function(e){
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';
    // DATADAN VERİLERİ ALMA   
    // HASTANELER İCİN

    var coordinates = e.features[0].geometry.coordinates.slice();
    var ADI = e.features[0].properties.ADI;
    var ILCE_ADI = e.features[0].properties.ILCE_ADI;
    var AMBULANS = e.features[0].properties.AMBULANS;
    var ACIL_SERVIS = e.features[0].properties.ACIL_SERVIS;

    console.log("HASTANE ADI: "+ ADI+" BULUNDUGU İLCE: " + ILCE_ADI +" AMBULANS: "+ AMBULANS +" ACİL SERVİS: "+ ACIL_SERVIS)

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Populate the popup and set its coordinates
    // based on the feature found.
    popup.setLngLat(coordinates).setHTML('<h6 class="h_hastane">' + "HASTANE ADI:" + '</h6><p>' + e.features[0].properties.ADI +'</p><h6 class="h_hastane">' + "BULUNDUGU iLCE:" + '</h6><p>' + e.features[0].properties.ILCE_ADI +'</p><h6 class="h_hastane">' + " AMBULANS:" + '</h6><p>' + e.features[0].properties.AMBULANS + '</p><h6 class="h_hastane">' + "ACiL SERViS:" + '</h6><p>' + e.features[0].properties.ACIL_SERVIS + '</p>').addTo(map);
})

// otopark popup ını kaldırır
map.on('mouseleave', 'Metrolar', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();}
);

// hastane popup ını kaldırır
map.on('mouseleave', 'Hastaneler', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();}
);


// create DOM element for the marker
var el = document.createElement('div');
el.id = 'marker';


// KULLANICININ KORDİNATINI ALMA
if ( navigator.geolocation ) 
{
    navigator.geolocation.getCurrentPosition( function(position) {

        var lng = position.coords.longitude;
        var lat = position.coords.latitude;                    
        
        // create the marker
        new maplibregl.Marker(el)
        .setLngLat([lng,lat])
        .setPopup(new maplibregl.Popup( ).setHTML("<h5> Şuan buradasınız</h5>")) // add popup
        .addTo(map);});
}
else ( confirm.log("didnt get the user's location"))

// Create a popup, but don't add it to the map yet.
var popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false
});
map.addControl(
    new maplibregl.GeolocateControl({
     positionOptions: {
     enableHighAccuracy: true},
     trackUserLocation: false,
     showUserLocation: true}),
     'top-left'   
);

// Add navigation control and scale
    
var nav = new maplibregl.NavigationControl();

map.addControl(nav, 'top-left');

var scale = new maplibregl.ScaleControl({
    maxWidth: 80,
    unit: 'metric'}
);
map.addControl(scale);

var layerList = document.getElementById('menu');
var as = layerList.getElementsByTagName('a');
     
function switchLayer(layer) {
    var layerId = layer.target.id;
    map.setStyle(layerId);
}
     
for (var i = 0; i < as.length; i++) {
    as[i].onclick = switchLayer;
}




