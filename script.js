// Initialize eWasteData from localStorage
let eWasteData = JSON.parse(localStorage.getItem('eWasteData')) || [];

function saveData() {
    localStorage.setItem('eWasteData', JSON.stringify(eWasteData));
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if(!toast) return;
    toast.innerText = message;
    toast.className = "show";
    setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);
}

// --- DASHBOARD LOGIC (index.html) ---
if (document.getElementById('total-ewaste')) {
    let total = 0, pending = 0, recycled = 0;
    
    eWasteData.forEach(item => {
        total += item.quantity;
        if (item.status === 'Pending' || item.status === 'In Transit') pending += item.quantity;
        if (item.status === 'Recycled') recycled += item.quantity;
    });

    document.getElementById('total-ewaste').innerText = total + " units";
    document.getElementById('pending-ewaste').innerText = pending + " units";
    document.getElementById('recycled-ewaste').innerText = recycled + " units";
}

// --- ADD E-WASTE LOGIC (add-ewaste.html) ---
const ewasteForm = document.getElementById('ewasteForm');
if (ewasteForm) {
    ewasteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const type = document.getElementById('type').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const source = document.getElementById('source').value;
        const date = document.getElementById('date').value;

        eWasteData.push({ type, quantity, source, date, status: 'Pending' });
        saveData();
        
        showToast('E-Waste Entry Added Successfully!');
        this.reset();
    });
}

// --- UPDATE STATUS LOGIC (update-status.html) ---
const listDiv = document.getElementById('ewasteList');
if (listDiv) {
    function renderEwasteList(filterText = "") {
        listDiv.innerHTML = '';
        
        const filteredData = eWasteData.filter(item => 
            item.type.toLowerCase().includes(filterText.toLowerCase()) || 
            item.source.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filteredData.length === 0) {
            listDiv.innerHTML = "<p>No e-waste entries found.</p>";
            return;
        }

        filteredData.forEach((item, index) => {
            // Find actual index in original array to ensure correct updating/deleting
            const originalIndex = eWasteData.indexOf(item); 
            
            const div = document.createElement('div');
            div.classList.add('card');
            
            // Map status for CSS classes
            let statusClass = item.status === 'In Transit' ? 'Transit' : item.status;

            div.innerHTML = `
                <p><strong>Type:</strong> ${item.type}</p>
                <p><strong>Quantity:</strong> ${item.quantity} units</p>
                <p><strong>Source:</strong> ${item.source}</p>
                <p><strong>Date Logged:</strong> ${item.date}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${statusClass}">${item.status}</span></p>
                <div class="controls">
                    ${item.status === 'Pending' ? `<button onclick="changeStatus(${originalIndex}, 'In Transit')" style="background:#f4a261;">Send to Transit</button>` : ''}
                    ${item.status !== 'Recycled' ? `<button onclick="changeStatus(${originalIndex}, 'Recycled')" style="background:#2a9d8f;">Mark Recycled</button>` : ''}
                    <button onclick="deleteEntry(${originalIndex})" style="background:#e63946;">Delete</button>
                </div>
            `;
            listDiv.appendChild(div);
        });
    }

    // Attach functions to window so inline onclick can see them
    window.changeStatus = function(index, newStatus) {
        eWasteData[index].status = newStatus;
        saveData();
        renderEwasteList(document.getElementById('searchInput').value);
    };

    window.deleteEntry = function(index) {
        if (confirm("Are you sure you want to delete this entry?")) {
            eWasteData.splice(index, 1);
            saveData();
            renderEwasteList(document.getElementById('searchInput').value);
        }
    };

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        renderEwasteList(e.target.value);
    });

    renderEwasteList();
}

// --- REPORTS LOGIC (reports.html) ---
if (document.getElementById('typeChart')) {
    if (eWasteData.length === 0) {
        document.getElementById('reportSummary').innerHTML = "<p>No data available to generate reports.</p>";
    } else {
        let pending = 0, transit = 0, recycled = 0;
        let typeCounts = {};

        eWasteData.forEach(item => {
            if (item.status === 'Recycled') recycled += item.quantity;
            else if (item.status === 'In Transit') transit += item.quantity;
            else pending += item.quantity;

            typeCounts[item.type] = (typeCounts[item.type] || 0) + item.quantity;
        });

        // PIE CHART
        new Chart(document.getElementById('typeChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(typeCounts),
                datasets: [{
                    data: Object.values(typeCounts),
                    backgroundColor: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']
                }]
            }
        });

        // BAR CHART
        new Chart(document.getElementById('statusChart'), {
            type: 'bar',
            data: {
                labels: ['Pending', 'In Transit', 'Recycled'],
                datasets: [{
                    label: 'Units of E-Waste',
                    data: [pending, transit, recycled],
                    backgroundColor: ['#e9c46a', '#f4a261', '#2a9d8f']
                }]
            }
        });
    }
}