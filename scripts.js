// Maintaining global variable for current sort
let currentSortCol = null;
let currentSortDir = true; // true=asc, false=desc

let courses = [];
// Store current filtered/displayed data
let currentData = [];

async function loadCourses() {
  try {
    const response = await fetch('courses.json');
    courses = await response.json();
  } catch (error) {
    alert('Failed to load course data. Please check your setup.');
    console.error('Load courses error:', error);
  }
}

// Function to sort data
function sortData(data, column) {
  if (!column) return data;

  return data.sort((a, b) => {
    let valA = a[column];
    let valB = b[column];

    if (column === 'start' || column === 'end') {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (column === 'pin_code') {
      valA = Number(valA);
      valB = Number(valB);
    }
    if (valA < valB) return currentSortDir ? -1 : 1;
    if (valA > valB) return currentSortDir ? 1 : -1;
    return 0;
  });
}

// Helper to add sort icons
function addSortIcons() {
  ['start', 'district', 'pin_code'].forEach(col => {
    const th = document.getElementById('th-' + col);
    if (!th) return;
    th.style.cursor = 'pointer';
    th.querySelectorAll('.sort-icon').forEach(icon => icon.remove());
    const icon = document.createElement('span');
    icon.classList.add('sort-icon');
    icon.style.marginLeft = '5px';
    icon.innerHTML = currentSortCol === col ? (currentSortDir ? '▲' : '▼') : '↕';
    th.appendChild(icon);
    th.onclick = () => {
      if (currentSortCol === col) {
        currentSortDir = !currentSortDir;
      } else {
        currentSortCol = col;
        currentSortDir = true;
      }
      displayCourses(currentData);
    };
  });
}

function displayCourses(data) {
  currentData = sortData(data, currentSortCol);

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (!currentData.length) {
    document.getElementById('no-result').style.display = 'block';
    return;
  } else {
    document.getElementById('no-result').style.display = 'none';
  }

  let html = `<table class="table table-hover table-bordered align-middle w-100">
      <thead class="table-warning">
    <tr>
      <th>Course Type</th>
      <th>Registration Link</th>
      <th id="th-start">Start Date</th>
      <th>End Date</th>
      <th id="th-district">District</th>
      <th>Address</th>
      <th id="th-pin_code">PinCode</th>
      <th>Teachers</th>
      <th>Contact</th>
      <th>Language</th>
    </tr>
  </thead>
  <tbody>`;

  currentData.forEach((course) => {
    html += `<tr>
      <td>${course.course_type}</td>
      <td><a href="${course.register_link}" target="_blank" class="btn btn-primary btn-sm">Register</a></td>
      <td>${course.start}</td>
      <td>${course.end}</td>
      <td>${course.district}</td>
      <td>${course.address}</td>
      <td>${course.pin_code}</td>
      <td>${course.teachers}</td>
      <td>${course.contact}</td>
      <td>${course.language}</td>
    </tr>`;
  });
  html += `</tbody></table>`;

  resultsDiv.innerHTML = html;
  addSortIcons();
}

// Clear filters - reset inputs and results
function clearFilters() {
  document.getElementById('district').value = '';
  document.getElementById('pincode').value = '';
  document.getElementById('address').value = '';
  document.getElementById('no-result').style.display = 'none';
  document.getElementById('results').innerHTML = '';
  currentData = [];
  currentSortCol = null;
  currentSortDir = true;
}

// Display all sorted by district ascending
function displayAllCourses() {
  clearFilters();
  currentSortCol = 'district';
  currentSortDir = true;
  displayCourses(courses.slice().sort((a, b) => a.district.localeCompare(b.district)));
}

// Updated performSearch
function performSearch() {
  document.getElementById('no-result').style.display = 'none';
  let district = document.getElementById('district').value.trim();
  let pincode = document.getElementById('pincode').value.trim();
  let address = document.getElementById('address').value.trim().toLowerCase();

  if (pincode && !/^\d{6}$/.test(pincode)) {
    alert('Please enter a valid 6-digit pincode.\nದಯವಿಟ್ಟು ಮಾನ್ಯ 6 ಸಂಖ್ಯೆ ಪಿನ್ ಕೋಡ್ ನಮೂದಿಸಿ.');
    return;
  }
  if (!district && !pincode && !address) {
    alert("Please select or enter at least one search criteria.\nಕೃಪया ಕನಿಷ್ಠ ಒಂದು ಮಾಪಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ನಮೂದಿಸಿ.");
    return;
  }

  let results = [];
  if (district) {
    results = courses.filter(c => c.district === district);
  }
  if (pincode) {
    const pinResults = courses.filter(c => c.pin_code === pincode);
    pinResults.forEach(item => {
      if (!results.includes(item)) results.push(item);
    });
  }
  if (address) {
    const addrResults = courses.filter(c => c.address.toLowerCase().includes(address));
    addrResults.forEach(item => {
      if (!results.includes(item)) results.push(item);
    });
  }
  currentSortCol = null; // reset sorting on search
  currentSortDir = true;
  displayCourses(results);
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-clear').onclick = clearFilters;
  document.getElementById('btn-display-all').onclick = displayAllCourses;
});

// Initial load
loadCourses();