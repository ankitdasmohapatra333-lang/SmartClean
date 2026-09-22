// SmartClean - Drone Inspection Module (Future Scope Prototype)

(function () {
  'use strict';

  const STORAGE_KEY = 'smartclean_drone_requests';

  const INITIAL_DEMO_REQUESTS = [
    {
      id: 'DRN-829104',
      location: 'Sector 4, Main Drainage Canal (Ward 8)',
      radius: '2 km',
      purpose: 'Drainage/sanitation issue',
      description: 'Severe waste blockage along the canal bank requiring aerial perimeter scan.',
      priority: 'Critical',
      preferredTime: 'Tomorrow 10:00 AM',
      status: 'Scheduled',
      requestedAt: '21 Sep 2026, 11:30 AM'
    },
    {
      id: 'DRN-736201',
      location: 'Ward 12, Industrial Outer Ring Road',
      radius: '5 km',
      purpose: 'Illegal dumping',
      description: 'Recurring unauthorized dumping of commercial debris along perimeter.',
      priority: 'High',
      preferredTime: '22 Sep 2026, 02:00 PM',
      status: 'Pending Review',
      requestedAt: '20 Sep 2026, 04:15 PM'
    }
  ];

  function getStoredDroneRequests() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored drone requests:', e);
    }
    // Seed initial demo data if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_REQUESTS));
    return INITIAL_DEMO_REQUESTS;
  }

  function saveDroneRequests(requests) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }

  function getSafeReturnTarget() {
    const params = new URLSearchParams(window.location.search);
    const requestedReturn = params.get('return');

    if (requestedReturn && /^[a-z0-9\-_/]+\.html(?:[?#].*)?$/i.test(requestedReturn)) {
      return requestedReturn;
    }

    if (document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (ref.origin === window.location.origin && !ref.pathname.endsWith('/drone.html')) {
          return ref.pathname.split('/').pop() || 'index.html';
        }
      } catch (e) {}
    }

    return sessionStorage.getItem('smartclean_token') ? 'dashboard.html' : 'index.html';
  }

  function isStandaloneDronePage() {
    return Boolean(document.body.classList.contains('drone-page-body'));
  }

  // --- Modal Open / Close ---
  window.openDroneRequest = function () {
    const panel = document.getElementById('droneRequestPanel');
    if (panel) {
      panel.removeAttribute('hidden');
      if (!isStandaloneDronePage()) {
        panel.style.display = 'flex';
        document.body.classList.add('drone-modal-open');
      }
    }
  };

  window.closeDroneRequest = function () {
    if (isStandaloneDronePage()) {
      window.location.href = getSafeReturnTarget();
      return;
    }

    const panel = document.getElementById('droneRequestPanel');
    if (panel) {
      panel.setAttribute('hidden', 'true');
      panel.style.display = 'none';
      document.body.classList.remove('drone-modal-open');
    }
  };

  // --- GPS Location Capture ---
  window.captureDroneLocation = function () {
    const statusEl = document.getElementById('droneLocationStatus');
    const latInput = document.getElementById('droneLatitude');
    const lngInput = document.getElementById('droneLongitude');
    const locInput = document.getElementById('droneLocation');

    if (!navigator.geolocation) {
      if (statusEl) statusEl.textContent = 'Geolocation is not supported by your browser.';
      return;
    }

    if (statusEl) {
      statusEl.textContent = 'Acquiring GPS coordinates...';
      statusEl.className = 'align-self-center text-primary';
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        if (latInput) latInput.value = lat;
        if (lngInput) lngInput.value = lng;
        if (statusEl) {
          statusEl.textContent = `Location captured: ${lat}, ${lng}`;
          statusEl.className = 'align-self-center text-success fw-bold';
        }
        if (locInput && !locInput.value.trim()) {
          locInput.value = `Geo-Location [${lat}, ${lng}]`;
        }
      },
      (err) => {
        if (statusEl) {
          statusEl.textContent = 'Could not get location. Please type manually.';
          statusEl.className = 'align-self-center text-danger';
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // --- Review / Edit / Confirm ---
  window.editDroneRequest = function () {
    const reviewEl = document.getElementById('droneReview');
    const reviewBtn = document.getElementById('droneReviewButton');
    const confirmBtn = document.getElementById('droneConfirmButton');
    const editBtn = document.getElementById('droneEditButton');

    if (reviewEl) reviewEl.setAttribute('hidden', 'true');
    if (reviewBtn) reviewBtn.removeAttribute('hidden');
    if (confirmBtn) confirmBtn.setAttribute('hidden', 'true');
    if (editBtn) editBtn.setAttribute('hidden', 'true');
  };

  window.confirmDroneRequest = function () {
    const locInput = document.getElementById('droneLocation');
    const radiusInput = document.getElementById('droneRadius');
    const purposeInput = document.getElementById('dronePurpose');
    const descInput = document.getElementById('droneDescription');
    const priorityInput = document.getElementById('dronePriority');
    const timeInput = document.getElementById('dronePreferredTime');
    const latInput = document.getElementById('droneLatitude');
    const lngInput = document.getElementById('droneLongitude');

    const requestId = 'DRN-' + Math.floor(100000 + Math.random() * 900000);
    const newReq = {
      id: requestId,
      requestId: requestId,
      location: locInput ? locInput.value.trim() : 'Unknown Area',
      radius: radiusInput ? radiusInput.value : '2 km',
      purpose: purposeInput ? purposeInput.value : 'Inspection',
      description: descInput ? descInput.value.trim() : '',
      priority: priorityInput ? priorityInput.value : 'Medium',
      preferredTime: timeInput && timeInput.value ? timeInput.value : 'Flexible / Next Available',
      latitude: latInput ? Number(latInput.value) || undefined : undefined,
      longitude: lngInput ? Number(lngInput.value) || undefined : undefined,
      status: 'Submitted',
      requestedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    };

    const requests = getStoredDroneRequests();
    requests.unshift(newReq);
    saveDroneRequests(requests);

    // Sync with backend database if online
    if (typeof apiRequest === 'function') {
      apiRequest('/drone/requests', {
        method: 'POST',
        body: JSON.stringify(newReq)
      }).catch((err) => {
        console.warn('Drone request backend sync fallback:', err.message);
      });
    }

    const form = document.getElementById('droneRequestForm');
    const successEl = document.getElementById('droneSuccess');

    if (form) form.reset();
    window.editDroneRequest();

    if (successEl) {
      successEl.removeAttribute('hidden');
      successEl.innerHTML = `
        <div class="alert alert-success mt-3 d-flex flex-column gap-2">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-check-circle-fill fs-4 text-success"></i>
            <div>
              <strong class="d-block">Drone Inspection Request Submitted!</strong>
              <span>Request ID: <code class="fw-bold text-dark">${requestId}</code></span>
            </div>
          </div>
          <p class="mb-0 text-muted small">
            Your request has been logged into the municipal command center database. Aerial route verification will be scheduled once priority assessment completes.
          </p>
          <div class="mt-2">
            <button class="btn btn-sm btn-outline-success" onclick="closeDroneRequest()">Close</button>
          </div>
        </div>
      `;
    }
  };

  // --- Admin Status Changer ---
  window.updateDroneStatus = async function (reqId, nextStatus) {
    if (!reqId || !nextStatus) return;
    try {
      if (typeof apiRequest === 'function') {
        await apiRequest(`/drone/requests/${encodeURIComponent(reqId)}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: nextStatus })
        });
      }
      // Update local storage as well
      const requests = getStoredDroneRequests();
      const item = requests.find((r) => r.id === reqId || r.requestId === reqId);
      if (item) {
        item.status = nextStatus;
        saveDroneRequests(requests);
      }
      window.loadAdminDroneRequests();
    } catch (err) {
      console.error('Failed to update drone request status:', err);
      alert('Unable to update status: ' + (err.message || 'Error occurred'));
    }
  };

  // --- Admin Dashboard Table Renderer ---
  window.loadAdminDroneRequests = async function () {
    const tableBody = document.getElementById('adminDroneRequestsTable');
    if (!tableBody) return;

    let requests = getStoredDroneRequests();

    // Fetch live requests from backend MongoDB
    if (typeof apiRequest === 'function') {
      try {
        const response = await apiRequest('/drone/requests', { method: 'GET' });
        if (response && response.success && Array.isArray(response.requests) && response.requests.length > 0) {
          requests = response.requests.map((r) => ({
            id: r.requestId || r.id || r._id,
            location: r.location,
            radius: r.radius || '2 km',
            purpose: r.purpose || 'General Inspection',
            description: r.description || '',
            priority: r.priority || 'Medium',
            preferredTime: r.preferredTime || 'Flexible',
            status: r.status || 'Submitted',
            requestedAt: r.requestedAt || new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
          }));
          saveDroneRequests(requests);
        }
      } catch (err) {
        console.warn('Using local drone requests (backend offline or demo mode):', err.message);
      }
    }

    if (requests.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No drone inspection requests logged yet.</td></tr>';
      return;
    }

    tableBody.innerHTML = requests.map((req) => {
      const priorityBadge =
        req.priority === 'Critical' ? 'badge bg-danger' :
        req.priority === 'High' ? 'badge bg-warning text-dark' :
        req.priority === 'Medium' ? 'badge bg-primary' : 'badge bg-secondary';

      const statusBadge =
        req.status === 'Scheduled' ? 'badge bg-info text-dark' :
        req.status === 'In Progress' ? 'badge bg-primary' :
        req.status === 'Submitted' ? 'badge bg-warning text-dark' :
        req.status === 'Completed' ? 'badge bg-success' : 'badge bg-secondary';

      const actionBtn =
        req.status === 'Submitted'
          ? `<button class="btn btn-xs btn-outline-primary py-1 px-2 text-nowrap" style="font-size: 11px;" onclick="updateDroneStatus('${req.id}', 'Scheduled')">📅 Schedule</button>`
          : req.status === 'Scheduled'
          ? `<button class="btn btn-xs btn-outline-success py-1 px-2 text-nowrap" style="font-size: 11px;" onclick="updateDroneStatus('${req.id}', 'Completed')">✓ Complete</button>`
          : `<span class="text-muted small">Done</span>`;

      return `
        <tr>
          <td><span class="fw-bold text-dark">${req.id}</span></td>
          <td><span class="text-truncate d-inline-block" style="max-width: 200px;" title="${req.location}">${req.location}</span></td>
          <td><span class="badge bg-light text-dark border">${req.radius}</span></td>
          <td>${req.purpose}</td>
          <td><span class="${priorityBadge}">${req.priority}</span></td>
          <td><small class="text-muted">${req.preferredTime}</small></td>
          <td><span class="${statusBadge}">${req.status}</span></td>
          <td><small class="text-muted">${req.requestedAt}</small></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');
  };

  // --- Initialization on page load ---
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Check if URL specifies ?drone=1 or #drone on report.html
    const params = new URLSearchParams(window.location.search);
    if (params.get('drone') === '1' || params.get('drone') === 'true' || window.location.hash === '#drone') {
      if (document.getElementById('droneRequestPanel')) {
        window.openDroneRequest();
      } else {
        const returnPage = window.location.pathname.split('/').pop() || 'index.html';
        window.location.href = `drone.html?return=${encodeURIComponent(returnPage)}`;
        return;
      }
    }

    if (isStandaloneDronePage()) {
      window.openDroneRequest();
    }

    // 2. Attach submit handler to drone request form
    const form = document.getElementById('droneRequestForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const loc = document.getElementById('droneLocation')?.value.trim();
        const radius = document.getElementById('droneRadius')?.value;
        const purpose = document.getElementById('dronePurpose')?.value;
        const desc = document.getElementById('droneDescription')?.value.trim();
        const priority = document.getElementById('dronePriority')?.value;
        const time = document.getElementById('dronePreferredTime')?.value || 'Not specified';

        const reviewEl = document.getElementById('droneReview');
        const reviewBtn = document.getElementById('droneReviewButton');
        const confirmBtn = document.getElementById('droneConfirmButton');
        const editBtn = document.getElementById('droneEditButton');

        if (reviewEl) {
          reviewEl.removeAttribute('hidden');
          reviewEl.innerHTML = `
            <div class="card p-3 my-3 border-success bg-light">
              <h6 class="fw-bold text-success mb-2"><i class="bi bi-eye"></i> Review Inspection Request</h6>
              <ul class="list-unstyled mb-0 small">
                <li><strong>Location:</strong> ${loc}</li>
                <li><strong>Radius:</strong> ${radius}</li>
                <li><strong>Purpose:</strong> ${purpose}</li>
                <li><strong>Priority:</strong> ${priority}</li>
                <li><strong>Preferred Time:</strong> ${time}</li>
                <li><strong>Description:</strong> ${desc}</li>
              </ul>
            </div>
          `;
        }

        if (reviewBtn) reviewBtn.setAttribute('hidden', 'true');
        if (confirmBtn) confirmBtn.removeAttribute('hidden');
        if (editBtn) editBtn.removeAttribute('hidden');
      });
    }

    // 3. If on admin dashboard, load table immediately
    if (document.getElementById('adminDroneRequestsTable')) {
      window.loadAdminDroneRequests();
    }
  });
})();
