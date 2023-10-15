let map;

const markers = [
    {
        coordinates: { lat: 40.377697640402936, lng: 49.85247745722226 },
        content: generateDescription("Pushkin Kafe", "Pushkin kucesi", "pushkinkafe.az"),
        type: 'cafe'
    },
    {
        coordinates: { lat: 40.978185553273484, lng: 47.845415320149314 },
        content: generateDescription("Qabala El ishleri", "Street", "Tel: 0507009090"),
        type: 'shop'
    }
]

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

    google.maps.event.addListener(map, 'rightclick', function (event) {
        document.getElementById('marker-modal').style.display = 'flex';
        document.getElementById('marker-form').addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const contact = document.getElementById('contact').value;
            const type = document.getElementById('type').value;
            // getAddressFromCoordinates(event.latLng.lat(), event.latLng.lng())
            //     .then(address => {
            //         addMarker({
            //             coordinates: event.latLng,
            //             content: generateDescription(name, address, contact),
            //             type: type
            //         });
            //         closeModal();
            //     })
            //     .catch(error => console.error(error));
            getAddressFromCoordinates(event.latLng.lat(), event.latLng.lng())
                .then(address => {
                    const markerData = {
                        name,
                        contact,
                        type,
                        lat: event.latLng.lat(),
                        lng: event.latLng.lng()
                    };
                    fetch('/add_marker', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(markerData)
                    })
                        .then(response => {
                            if (response.ok) {
                                addMarker({
                                    coordinates: event.latLng,
                                    content: generateDescription(name, address, contact),
                                    type: type
                                });
                                closeModal();
                            } else {
                                console.error('Failed to add marker');
                            }
                        })
                        .catch(error => console.error(error));
                })
                .catch(error => console.error(error));
        });
    });

    for (let i = 0; i < markers.length; i++) {
        addMarker(markers[i])
    }
}