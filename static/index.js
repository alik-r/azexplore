let map;

function generateDescription(name, address, contact) {
    return `<div class="description">
        <h3>${name}</h2>
        <p>${address}</p>
        <p>${contact}</p>
    </div>`;
}

function getAddressFromCoordinates(lat, lng) {
    return new Promise((resolve, reject) => {
        const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBAam1-N8XaMEclySMIukWVFkl4r1yf0n4`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.status === "OK") {
                    resolve(data.results[0].formatted_address);
                } else {
                    reject('No address found');
                }
            })
            .catch(error => reject(error));
    });
}

function addMarker(prop) {
    let marker = new google.maps.Marker({
        position: prop.coordinates,
        map: map,
        type: prop.type
    })

    if (prop.content) {
        let information = new google.maps.InfoWindow({
            content: prop.content,
            maxWidth: 200
        })

        marker.addListener("click", function () {
            information.open(map, marker);
        })
    }
}

function closeModal() {
    document.getElementById('marker-modal').style.display = 'none';
    document.getElementById('marker-form').reset();
}

function initMap() {
    const options = {
        zoom: 16,
        center: { lat: 40.37576160347162, lng: 49.85207512593167 },
        mapId: "71051c386cf75935",
    }

    map = new google.maps.Map(
        document.getElementById('map'),
        options,
    )

    fetch('/get_markers')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error:' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            data.forEach(marker => {
                addMarker({
                    coordinates: { lat: parseFloat(marker.lat), lng: parseFloat(marker.lng) },
                    content: generateDescription(marker.name, '', marker.contact), 
                    type: marker.type
                });
            });
        })
        .catch((error) => {
            console.error('Fetch error: ', error);
        });

    document.getElementById('marker-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const contact = document.getElementById('contact').value;
        const type = document.getElementById('type').value;
        // Retrieve the saved coordinates from dataset attributes
        const lat = parseFloat(this.dataset.lat);
        const lng = parseFloat(this.dataset.lng);
        getAddressFromCoordinates(lat, lng)
            .then(address => {
                addMarker({
                    coordinates: { lat, lng },
                    content: generateDescription(name, address, contact),
                    type: type
                });
                closeModal();
                // Send marker data to the server
                const markerData = {
                    name,
                    contact,
                    type,
                    lat,
                    lng
                };
                fetch('/add_marker', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(markerData)
                })
                    .then(response => {
                        if (!response.ok) {
                            console.error('Failed to add marker');
                        }
                    })
                    .catch(error => console.error(error));
            })
            .catch(error => console.error(error));
    });

    google.maps.event.addListener(map, 'rightclick', function (event) {
        document.getElementById('marker-modal').style.display = 'flex';
        const form = document.getElementById('marker-form');
        form.dataset.lat = event.latLng.lat();
        form.dataset.lng = event.latLng.lng();
    });
}