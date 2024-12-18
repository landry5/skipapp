import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons for different object listing status
const mapIcons = {
  Available: L.icon({
    iconUrl: '/res/available_location_x64.png',
    shadowUrl: '/res/location_x64_shadow.png',
    iconSize: [64, 64],
    shadowSize: [64, 64],
    iconAnchor: [32, 64],
    shadowAnchor: [32, 64],
    popupAnchor: [0, -42]
  }),
  Inquired: L.icon({
    iconUrl: '/res/inquired_location_x64.png',
    shadowUrl: '/res/location_x64_shadow.png',
    iconSize: [64, 64],
    shadowSize: [64, 64],
    iconAnchor: [32, 64],
    shadowAnchor: [32, 64],
    popupAnchor: [0, -42]
  }),
  Taken: L.icon({
    iconUrl: '/res/taken_location_x64.png',
    shadowUrl: '/res/location_x64_shadow.png',
    iconSize: [64, 64],
    shadowSize: [64, 64],
    iconAnchor: [32, 64],
    shadowAnchor: [32, 64],
    popupAnchor: [0, -42]
  })
};

export default function ObjectMap() {
  const [records, setRecords] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Fetch records
  useEffect(() => {
    async function getRecords() {
      try {
        const response = await fetch(`https://skipapp.onrender.com/record/`);
        if (!response.ok) {
          const message = `An error occurred: ${response.statusText}`;
          console.error(message);
          return;
        }
        const fetchedRecords = await response.json();
        
        // Filter out records without valid location
        const validRecords = fetchedRecords.filter(record => 
          record.location && 
          record.location.split(',').length === 2 && 
          !isNaN(parseFloat(record.location.split(',')[0])) &&
          !isNaN(parseFloat(record.location.split(',')[1]))
        );

        setRecords(validRecords);
      } catch (error) {
        console.error("Failed to fetch records:", error);
      }
    }
    getRecords();
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const newMap = L.map(mapRef.current).setView([0, 0], 2);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(newMap);
      
      mapInstanceRef.current = newMap;
    }
  }, []);

  // Function to handle inquiring about an object
  const handleInquire = async (record) => {
    try {
      // Prepare the update payload - preserve all existing data
      const updatePayload = {
        ...record,  // Spread all existing record properties
        level: 'Inquired'  // Only update the level
      };

      const response = await fetch(`https://skipapp.onrender.com/record/${record._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state to reflect the change
      setRecords(prevRecords => 
        prevRecords.map(r => 
          r._id === record._id 
            ? { ...r, level: 'Inquired' } 
            : r
        )
      );

      // Optional: Close the popup or provide feedback
      alert('Object status updated to Inquired');
    } catch (error) {
      console.error('A problem occurred while inquiring: ', error);
      alert('Failed to update object status');
    }
  };

  // Add markers when records are loaded
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && records.length > 0) {
      // Clear existing layers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      const markers = new L.featureGroup();

      records.forEach(record => {
        try {
          // Parse location
          const [lat, lon] = record.location.split(',').map(parseFloat);
          
          // Ensure images exist, use default if not
          const images = record.images && record.images.length > 0 
            ? record.images 
            : ['/default-avatar.png'];

          // Create marker with appropriate icon based on level
          const marker = L.marker([lat, lon], { 
            icon: mapIcons[record.level] || mapIcons.Inquired
          }).addTo(map);

          // Custom popup content with image carousel
          marker.bindPopup(() => {
            // Create a container for the popup content
            const popupContainer = document.createElement('div');
            popupContainer.className = 'map-pop-up';

            // Create title and description
            const titleElement = document.createElement('p');
            titleElement.className = 'object-name';
            titleElement.textContent = record.name;
            popupContainer.appendChild(titleElement);

            const descElement = document.createElement('p');
            descElement.className = 'object-description';
            descElement.textContent = `${record.description} (${record.level})`;
            popupContainer.appendChild(descElement);

            // Location information
            const locationElement = document.createElement('p');
            locationElement.className = 'object-location';
            locationElement.textContent = `Location: ${record.location}`;
            popupContainer.appendChild(locationElement);

            // Image carousel container
            const carouselContainer = document.createElement('div');
            carouselContainer.className = 'image-carousel';
            carouselContainer.style.position = 'relative';
            carouselContainer.style.width = '200px';
            carouselContainer.style.height = '200px';
            carouselContainer.style.overflow = 'hidden';

            // Current image display
            const currentImage = document.createElement('img');
            currentImage.src = images[0];
            currentImage.alt = record.name;
            currentImage.style.maxWidth = '200px';
            currentImage.style.maxHeight = '200px';
            currentImage.style.objectFit = 'cover';
            carouselContainer.appendChild(currentImage);

            // Only add navigation if more than one image
            if (images.length > 1) {
              let currentIndex = 0;

              // Left navigation arrow
              const leftArrow = document.createElement('div');
              leftArrow.innerHTML = '&#10094;';
              leftArrow.style.position = 'absolute';
              leftArrow.style.left = '5px';
              leftArrow.style.top = '50%';
              leftArrow.style.transform = 'translateY(-50%)';
              leftArrow.style.cursor = 'pointer';
              leftArrow.style.backgroundColor = 'rgba(0,0,0,0.5)';
              leftArrow.style.color = 'white';
              leftArrow.style.padding = '5px';
              leftArrow.style.borderRadius = '5px';
              
              // Right navigation arrow
              const rightArrow = document.createElement('div');
              rightArrow.innerHTML = '&#10095;';
              rightArrow.style.position = 'absolute';
              rightArrow.style.right = '5px';
              rightArrow.style.top = '50%';
              rightArrow.style.transform = 'translateY(-50%)';
              rightArrow.style.cursor = 'pointer';
              rightArrow.style.backgroundColor = 'rgba(0,0,0,0.5)';
              rightArrow.style.color = 'white';
              rightArrow.style.padding = '5px';
              rightArrow.style.borderRadius = '5px';

              // Navigation logic
              leftArrow.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + images.length) % images.length;
                currentImage.src = images[currentIndex];
              });

              rightArrow.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % images.length;
                currentImage.src = images[currentIndex];
              });

              carouselContainer.appendChild(leftArrow);
              carouselContainer.appendChild(rightArrow);
            }

            popupContainer.appendChild(carouselContainer);

            // Add Inquire button for Available objects
            if (record.level === 'Available') {
              const inquireButton = document.createElement('button');
              inquireButton.textContent = 'Inquire';
              inquireButton.style.marginTop = '10px';
              inquireButton.style.backgroundColor = '#3B82F6';  // Blue color
              inquireButton.style.color = 'white';
              inquireButton.style.padding = '5px 10px';
              inquireButton.style.borderRadius = '5px';
              inquireButton.style.border = 'none';
              inquireButton.style.cursor = 'pointer';

              inquireButton.addEventListener('click', () => {
                handleInquire(record);  // Pass entire record object
              });

              popupContainer.appendChild(inquireButton);
            }

            return popupContainer;
          }, {
            maxWidth: 250,
            minWidth: 200,
            closeOnClick: true
          });

          markers.addLayer(marker);
        } catch (error) {
          console.error(`Error processing record ${record.name}:`, error);
        }
      });

      // Fit map to markers if there are any
      if (markers.getBounds().isValid()) {
        map.fitBounds(markers.getBounds(), { padding: [50, 50] });
      }
    }
  }, [records]);

  return (
    <div>
      <h3 className="text-lg font-semibold p-4">Object Locations</h3>
      <div 
        ref={mapRef} 
        id="map" 
        style={{ height: '500px', width: '100%' }}
      ></div>
    </div>
  );
}