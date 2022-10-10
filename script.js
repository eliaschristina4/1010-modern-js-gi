'use strict'; // ???? what does this mean

class Workout {
    date = new Date();
    id = (new Date() + '').slice(-10); 
    clicks = 0;

    constructor(coords,distance,duration){
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }

    _setDescription(){
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }

    click() {
        this.clicks++;
    } // why???
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace(); // immediately calculate the pace
        this._setDescription();
    }

    calcPace(){
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain){
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        // km/h
        this.speed = this.distance / (this.duration / 60); // duration was in minutes, not hours so we have to convert
        return this.speed;
    }
}

// const run1 = new Running([39, -12], 5.2, 24, 178)
// const cycling1 = new Cycling([39, -12], 27, 95, 523)
// console.log(run1, cycling1); // test to ensure working as expected

/////////////////////////////////////////////////
// APPLICATION ARCHITECTURE

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
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];

    constructor(){
        // Get user's position
        this._getPosition(); // actually calling and triggering the function

        // Get data from local storage
        this._getLocalStorage();

        // Attach event handlers 
        form.addEventListener('submit', this._newWorkout.bind(this)); // Submit & Enter. not calling, but passing in the newWorkout method to the event listener
        inputType.addEventListener('change', this._toggleElevationField); // Change from cadence to elevation when you select cycling

        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));// When you click on marker, map will move to it/center it
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

        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
            
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);

        // Handling clicks on map
        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        }); 
    }

    _showForm(mapE){
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm(){
        //Empty inputs

        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";  

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);
    }

    _toggleElevationField(){
        // Toggle the hidden class on these so one is always hidden and one always visible
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e){
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp)); //helper function instead of if statements

        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();

        // Get data from form
        const type = inputType.value; // running or cycling, whichever selected on form
        const distance = +inputDistance.value // convert to num
        const duration = +inputDuration.value; // convert to num
        const {lat, lng} = this.#mapEvent.latlng;
        let workout;

        // If workout is running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value
            // Check if data is valid
            if(
                // !Number.isFinite(distance) || 
                // !Number.isFinite(duration) || 
                // !Number.isFinite(cadence)
                !validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)
            ) 
                return alert('Inputs have to be positive numbers!'); // guard clause

            workout = new Running([lat, lng], distance, duration, cadence);
        };
        
        // If workout is cycling, create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value
            // Check if data is valid
            if(
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration)
            ) 
                return alert('Inputs have to be positive numbers!'); // guard clause

            workout = new Cycling([lat, lng], distance, duration, elevation);
        };

        // Add new object to workout array
        this.#workouts.push(workout);

        // Render workout on map as marker
        this._renderWorkoutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);


        // Hide form + clear input fields
        this._hideForm();
        
        // Set local storage to all workouts
        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout){
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,                
            className: `${workout.type}-popup`
            }))
        .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
        .openPopup(); 
    }

    _renderWorkout(workout){
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
        `;

        if(workout.type === 'running')  
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
            `;

        if(workout.type === 'running')  
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed}</span> 
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>
            `; // toFixed(1) on speed causing error i can't figure out? was just like his

        form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e){ // e for event
        const workoutEl = e.target.closest('.workout'); // wherever you click among its children, it will target the entire li

        if(!workoutEl) return; // guard clause

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id); // ???

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            } // what is going on here lol. he lost me
        });

        // using the public interface
        // workout.click(); 
    }

    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts)); // localStorage is an API the browser provides. best to use only for small amounts of data
        // use the stringify method to convert any object in js to a string
    }

    // Using local storage, keep and load previous workouts on page load
    _getLocalStorage(){
        const data = JSON.parse( localStorage.getItem('workouts') );

        if(!data) return; // guard clause

        this.#workouts = data; // set this to the data we get from local storage

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        }); 
    }

    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    } // public method
};

const app = new App(); // creating the actual object(ex:house) from the plan(ex:blueprint)

