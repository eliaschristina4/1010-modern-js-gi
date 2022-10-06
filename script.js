'use strict'; // ???? what does this mean

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Storing html elements in variable to use/manipulate later
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map; // private class field? private instant properties. google this lol
    #mapEvent;

    constructor(){
        this._getPosition(); // actually calling and triggering the function

        // Submit & Enter
        form.addEventListener('submit', this._newWorkout.bind(this)); // not calling, but passing in the newWorkout method to the event listener

        // Change from cadence to elevation when you select cycling
        inputType.addEventListener('change', this._toggleElevationField);
    }

    _getPosition(){
        // Geolocation and map clicks
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){ // what does .bind(this) do?? fixes undefined error
                alert('Could not get your position')
            });
    }

    _loadMap(position){
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, 13);
        // console.log(map)
            
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);

        // Handling clicks on map
        this.#map.on('click', this._showForm.bind(this));
    }

    _showForm(mapE){
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _toggleElevationField(){
        // Toggle the hidden class on these so one is always hidden and one always visible
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e){
        e.preventDefault();

        // Clear input fields
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";

        // Display marker
        const {lat, lng} = this.#mapEvent.latlng;

        L.marker([lat, lng])
            .addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,                
                className: 'running-popup'
                }))
            .setPopupContent('Workout')
            .openPopup();    
    }
};

const app = new App(); // creating the actual object(ex:house) from the plan(ex:blueprint)

