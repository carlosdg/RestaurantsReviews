let dbHelper;
var map;
var markers = [];

/**
 * As soon as the page is loaded:
 *  - Initialize the map
 *  - Initialize the application with the restaurant data from IDB
 *  - Fetch new data from the remote server to update IDB and update the application
 */
document.addEventListener('DOMContentLoaded', _ => {
  self.dbHelper = new DBHelper();
  initMap();
  main();

  self.dbHelper.updateDb().then(updatedDbHelper => {
    self.dbHelper = updatedDbHelper;
    main();
  });
});

main = () => {
  updateRestaurants();
  updateNeighborhoods();
  updateCuisines();
};

/**
 * Initialize leaflet map.
 */
initMap = () => {
  self.map = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });

  L.tileLayer(
    'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={accessToken}',
    {
      accessToken:
        'pk.eyJ1IjoiY2FybG9zLWRvbWluZ3VleiIsImEiOiJjampvOWE0ZnIxNnd3M3Zyc3pxM2ZnNHJkIn0.y4purOXmeN0qCA2vW4etCg',
      maxZoom: 18,
      attribution:
        'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }
  ).addTo(self.map);
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
updateNeighborhoods = () => {
  self.dbHelper
    .getNeighborhoods()
    .then(neighborhoods => fillNeighborhoodFilterHtml(neighborhoods))
    .catch(console.error);
};

/**
 * Set neighborhood filter HTML.
 */
fillNeighborhoodFilterHtml = neighborhoods => {
  const select = document.getElementById('neighborhoods-select');

  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
updateCuisines = () => {
  self.dbHelper
    .getCuisines()
    .then(cuisines => fillCuisineFilterHtml(cuisines))
    .catch(console.error);
};

/**
 * Set cuisine filter HTML.
 */
fillCuisineFilterHtml = cuisines => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  // If the index is not valid we use 'all' as default
  const cuisine = cSelect[cIndex] ? cSelect[cIndex].value : 'all';
  const neighborhood = nSelect[nIndex] ? nSelect[nIndex].value : 'all';

  self.dbHelper
    .getFilteredRestaurants({ cuisine, neighborhood })
    .then(restaurants => {
      updateRestaurantInfoListHtml(restaurants);
      updateMapMarkers(restaurants);
    })
    .catch(console.error);
};

/**
 * Clears current restaurants and their HTML.
 * Create all restaurants HTML and add them to the webpage.
 */
updateRestaurantInfoListHtml = restaurants => {
  const ul = document.getElementById('restaurants-list');

  // Remove all restaurants
  ul.innerHTML = '';

  // Add new restaurants
  restaurants.forEach(restaurant =>
    ul.append(createRestaurantInfoItemHtml(restaurant))
  );
};

/**
 * Create restaurant HTML.
 */
createRestaurantInfoItemHtml = restaurant => {
  const li = document.createElement('li');
  li.classList.add('restaurant-info-preview');

  const name = document.createElement('h3');
  name.classList.add('restaurant-preview-name');
  name.innerText = restaurant.name;
  li.append(name);

  const image = document.createElement('img');
  const imageSources = DBHelper.getRestaurantPhotoSources(restaurant);
  image.classList.add('restaurant-preview-img');
  image.setAttribute('role', 'presentation');
  image.setAttribute('alt', '');
  image.setAttribute('src', imageSources[0].url);
  image.setAttribute(
    'srcset',
    imageSources.map(({ url, width }) => `${url} ${width}w`).join(', ')
  );
  image.setAttribute('sizes', '300px');
  li.append(image);

  const address = document.createElement('p');
  address.classList.add('restaurant-preview-address');
  address.setAttribute('title', 'Restaurant address');
  address.innerText = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  const description =
    'View details of the restaurant "' + restaurant.name + '"';
  more.setAttribute('aria-label', description);
  more.setAttribute('title', description);
  more.setAttribute('href', DBHelper.urlForRestaurant(restaurant));
  more.classList.add('restaurant-preview-details-link');
  more.innerText = 'View Details';
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
updateMapMarkers = restaurants => {
  // Remove all previous markers
  self.markers.forEach(m => self.map.removeLayer(m));
  self.markers = [];

  // Add new markers
  restaurants.forEach(restaurant => {
    // Create marker for the current restaurant
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);

    // Add marker to the list
    self.markers.push(marker);

    // Treat it as a link (a feature for convenience)
    const navigateToRestaurantPage = () =>
      (window.location.href = marker.options.url);
    marker.on('click', navigateToRestaurantPage);
    marker.on('touch', navigateToRestaurantPage);
  });
};
