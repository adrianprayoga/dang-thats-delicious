import axios from 'axios'
import {$} from './bling'

// Markers for map
let markers = [];

const mapOptions = {
    center: {lat: 43.2, lng: -79.8},
    zoom: 10
}

// Add marker for place to map
function addMarker(map, lng, lat, place)
{
    var marker = new google.maps.Marker({
        position: {lat, lng},
        icon: {
            labelOrigin: new google.maps.Point(11, 50),
            url: 'https://raw.githubusercontent.com/Concept211/Google-Maps-Markers/master/images/marker_red.png',
            size: new google.maps.Size(22, 40),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(11, 40),
        }
    });
    marker.place = place
    marker.setMap(map);
    markers.push(marker);
}

function loadPlaces(map, lat = 43.2, lng = -79.8) {
    axios.get(`/api/stores/near/?lat=${lat}&lng=${lng}`)
        .then(res=>{
            const places = res.data
            if(!places.length) {
                map.setCenter(new google.maps.LatLng(lat, lng))
                
                return;
            }

            const bounds = new google.maps.LatLngBounds()
            const infoWindow = new google.maps.InfoWindow()

            places.map(place => {
                const [placeLng, placeLat] = place.location.coordinates
                const position = {lat: placeLat, lng: placeLng}
                bounds.extend(position)
                addMarker(map, placeLng, placeLat, place)
            })

            map.fitBounds(bounds)
            markers.forEach(marker => {
                marker.addListener('click', function() {
                    const html = `
                        <div class="popup">
                            <a href="/store/${this.place.slug}">
                                <img src="/uploads/${this.place.photo || 'store.png'}" alt=${this.place.name}/>
                                <p>${this.place.name} - ${this.place.location.address}</p>
                            </a>
                        </div>
                    `
                    infoWindow.setContent(html)
                    infoWindow.open(map, this)
                })
            })
            
        })
}

function makeMap (mapDiv) {
    if(!mapDiv) return;
    const map = new google.maps.Map(mapDiv, mapOptions)
    loadPlaces(map)

    const input = $('[name="geolocate"]')
    const autocomplete = new google.maps.places.Autocomplete(input)

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng()) //place will move due to bounds
    })
}

export default makeMap;