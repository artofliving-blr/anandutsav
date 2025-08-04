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
    // Remove spaces, hyphens, plus signs for display/click
    const cleanNo = course.contact.toString().replace(/[^0-9]/g, "");
    html += `<tr>
      <td>${course.course_type}</td>
      <td><a href="${course.register_link}" target="_blank" class="btn btn-primary btn-sm">Register</a></td>
      <td>${course.start}</td>
      <td>${course.end}</td>
      <td>${course.district}</td>
      <td>${course.address}</td>
      <td>${course.pin_code}</td>
      <td>${course.teachers}</td>
      <td>
        <span>${course.contact}</span>
        <a href="tel:${cleanNo}" title="Call" class="ms-2 text-success" style="font-size:1.3em;"><i class="bi bi-telephone-fill"></i></a>
        <a href="https://wa.me/${cleanNo}" title="Message on WhatsApp" target="_blank" class="ms-2 text-success" style="font-size:1.3em;"><i class="bi bi-whatsapp"></i></a>
      </td>
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
    const pinResults = courses.filter(c => c.pin_code === parseInt(pincode));
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

// Chatbot data logic
let chatbotCoursesCache = [];

function chatbotLoadCourses() {
  // Share the loaded courses from rest of page
  chatbotCoursesCache = courses;
}

// Minimal matching function: tries to respond based on question content
function generateChatbotAnswer(question) {
  const q = question.toLowerCase();
  // Check for 'district'
  let match = q.match(/(in|from|of)\\s+([a-zA-Z ]+)/);
  for(const c of chatbotCoursesCache){
    // Example: "yoga in mysuru", "courses in bengaluru"
    if(q.includes(c.district.toLowerCase())) {
      return `Yes, we have "${c.course_type}" in ${c.district}. contact: ${c.contact} <a href="${c.register_link}" target="_blank">Register here</a>.`;
    }
    // By pin_code
    if(q.includes(c.pin_code.toLowerCase())) {
      return `Yes, we have <b>${c.course_type}</b> at ${c.pin_code}, contact: ${c.contact} <a href="${c.register_link}" target="_blank">Register here</a>.`;
    }
  }
  return "Sorry, I could not find any matching info. Try 'Happiness Program in Mysuru' or 'Happiness Program at 560068'.";
}

// Chatbot message handler
function sendChatbotMessage(){
  const input = document.getElementById('chatbot-input');
  const val = input.value.trim();
  if(!val) return;
  input.value = '';
  const msgBox = document.getElementById('chatbot-messages');
  msgBox.innerHTML += `<div class="mb-2"><span class="bg-primary text-white rounded px-2 py-1 d-inline-block float-end">${val}</span></div><div class="clearfix"></div>`;
  // Get response
  const ans = generateChatbotAnswer(val);
  setTimeout(()=>{
    msgBox.innerHTML += `<div class="mb-2"><span class="bg-light border rounded px-2 py-1 d-inline-block float-start">${ans}</span></div><div class="clearfix"></div>`;
    msgBox.scrollTop = msgBox.scrollHeight;
  },600);
}

// Floating button toggles chatbot window
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chatbot-toggle').onclick = function () {
    const widget = document.getElementById('chatbot-widget');
    widget.style.display = widget.style.display === 'block' ? 'none' : 'block';
    const msgs = document.getElementById('chatbot-messages');
    msgs.scrollTop = msgs.scrollHeight;
    document.getElementById('chatbot-input').focus();
  };
});

// Ensure the data is synced after courses are loaded
window.addEventListener('DOMContentLoaded', ()=>{
  chatbotLoadCourses();
});

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-clear').onclick = clearFilters;
  document.getElementById('btn-display-all').onclick = displayAllCourses;
});

// Initial load
loadCourses();
