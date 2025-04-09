/**
 * Expert Verification for Service Marketplace Admin Dashboard
 * Handles reviewing and verifying expert applications
 */

// State management for the verification page
const verificationState = {
  // All experts
  experts: [],
  // Currently selected expert
  selectedExpert: null,
  // Filters
  filters: {
    status: 'pending',
    category: 'all',
    search: ''
  },
  // Pagination
  pagination: {
    currentPage: 1,
    expertsPerPage: 10,
    totalPages: 1
  }
};

// Initialize the verification page
function initExpertVerification() {
  // Check if user is admin
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (!userData.isAdmin) {
    window.location.href = '/login.html';
    return;
  }

  // Load mock data first
  loadMockExperts();

  // Set up event listeners
  setupEventListeners();

  // Initial display
  displayExperts();
  updatePendingCount();

  // Hide loading indicator
  document.getElementById('loadingIndicator').style.display = 'none';
  document.getElementById('expertVerificationContent').style.display = 'block';
}

// Load mock expert data
function loadMockExperts() {
  // Create sample experts with different verification statuses
  const statuses = ['pending', 'verified', 'rejected'];
  const categories = ['Nutrition', 'Legal', 'Financial', 'Medical', 'Technical'];
  const specializations = {
    'Nutrition': ['Diet Planning', 'Sports Nutrition', 'Clinical Nutrition'],
    'Legal': ['Family Law', 'Corporate Law', 'Intellectual Property'],
    'Financial': ['Investment Planning', 'Tax Consultation', 'Retirement Planning'],
    'Medical': ['General Practitioner', 'Dermatology', 'Mental Health'],
    'Technical': ['Web Development', 'Cybersecurity', 'Data Science']
  };
  const names = [
    'John Smith', 'Jane Doe', 'Robert Johnson', 'Maria Garcia', 'James Wilson',
    'Sarah Lee', 'Michael Brown', 'Lisa Chen', 'David Taylor', 'Emma Miller',
    'Daniel Martinez', 'Olivia Anderson', 'William Jackson', 'Sophia Thomas', 'Joseph White'
  ];

  // Generate 15 mock experts
  for (let i = 0; i < 15; i++) {
    const status = statuses[Math.floor(Math.random() * (i < 8 ? 1 : 3))]; // Make more pending ones
    const category = categories[Math.floor(Math.random() * categories.length)];
    const specializationList = specializations[category];
    const specialization = specializationList[Math.floor(Math.random() * specializationList.length)];
    const name = names[i];
    const email = name.toLowerCase().replace(' ', '.') + '@example.com';

    // Random application date within the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const applicationDate = new Date();
    applicationDate.setDate(applicationDate.getDate() - daysAgo);

    // Mock documents
    const documents = [];
    const docTypes = ['Resume.pdf', 'Degree Certificate.pdf', 'License.pdf', 'Certification.pdf', 'ID.jpg'];
    const numDocs = Math.floor(Math.random() * 3) + 1; // 1-3 documents

    for (let j = 0; j < numDocs; j++) {
      documents.push({
        name: `${name.split(' ')[0]}'s ${docTypes[j % docTypes.length]}`,
        path: `/uploads/mock-doc-${j + 1}.pdf`,
        uploadedAt: new Date(applicationDate.getTime() - (j * 86400000)).toISOString(),
        verified: status === 'verified'
      });
    }

    // Create the expert object
    const expert = {
      _id: 'exp-' + Math.random().toString(36).substr(2, 9),
      name: name,
      email: email,
      profilePicture: '/uploads/default-avatar.png',
      category: category,
      specialization: specialization,
      bio: `Experienced ${specialization} professional with a passion for helping clients achieve their goals.`,
      verificationStatus: status,
      verificationNotes: status === 'rejected' ? 'Documentation incomplete. Please provide additional credentials.' : '',
      credentials: {
        degree: ['Ph.D.', 'MD', 'J.D.', 'MBA', 'MS'][Math.floor(Math.random() * 5)],
        certifications: ['Certified Professional', 'Licensed Expert', 'Board Certified'],
        yearsOfExperience: Math.floor(Math.random() * 15) + 2,
        institution: ['Harvard University', 'Stanford University', 'MIT', 'University of California'][Math.floor(Math.random() * 4)]
      },
      documentUploads: documents,
      accountCreated: applicationDate.toISOString()
    };

    verificationState.experts.push(expert);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Filter controls
  document.getElementById('status-filter').addEventListener('change', function() {
    verificationState.filters.status = this.value;
    verificationState.pagination.currentPage = 1;
    displayExperts();
  });

  document.getElementById('category-filter').addEventListener('change', function() {
    verificationState.filters.category = this.value;
    verificationState.pagination.currentPage = 1;
    displayExperts();
  });

  document.getElementById('expert-search').addEventListener('input', function() {
    verificationState.filters.search = this.value.toLowerCase();
    verificationState.pagination.currentPage = 1;
    displayExperts();
  });

  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', function() {
    // In a real app, this would fetch fresh data from the server
    displayExperts();
    showNotification('Data refreshed', 'success');
  });

  // Back to list button
  document.getElementById('back-to-list').addEventListener('click', function() {
    document.getElementById('expert-details').style.display = 'none';
    document.querySelector('.card').style.display = 'block';
    verificationState.selectedExpert = null;
  });

  // Verification modal events
  document.getElementById('verification-status').addEventListener('change', function() {
    const rejectionGroup = document.getElementById('rejection-reason-group');
    if (this.value === 'rejected') {
      rejectionGroup.style.display = 'block';
    } else {
      rejectionGroup.style.display = 'none';
    }
  });

  document.getElementById('modal-close').addEventListener('click', closeVerificationModal);
  document.getElementById('cancel-verification').addEventListener('click', closeVerificationModal);
  document.getElementById('submit-verification').addEventListener('click', submitVerificationDecision);

  // Document modal events
  document.getElementById('document-modal-close').addEventListener('click', closeDocumentModal);
  document.getElementById('close-document').addEventListener('click', closeDocumentModal);
}

// Display experts based on current filters
function displayExperts() {
  // Apply filters
  const filteredExperts = verificationState.experts.filter(expert => {
    // Status filter
    if (verificationState.filters.status !== 'all' && expert.verificationStatus !== verificationState.filters.status) {
      return false;
    }

    // Category filter
    if (verificationState.filters.category !== 'all' && expert.category !== verificationState.filters.category) {
      return false;
    }

    // Search filter
    if (verificationState.filters.search && !expertMatchesSearch(expert, verificationState.filters.search)) {
      return false;
    }

    return true;
  });

  // Update pagination
  const totalExperts = filteredExperts.length;
  verificationState.pagination.totalPages = Math.ceil(totalExperts / verificationState.pagination.expertsPerPage);

  if (verificationState.pagination.currentPage > verificationState.pagination.totalPages) {
    verificationState.pagination.currentPage = Math.max(1, verificationState.pagination.totalPages);
  }

  // Get current page of experts
  const startIdx = (verificationState.pagination.currentPage - 1) * verificationState.pagination.expertsPerPage;
  const endIdx = Math.min(startIdx + verificationState.pagination.expertsPerPage, totalExperts);
  const currentExperts = filteredExperts.slice(startIdx, endIdx);

  // Render experts table
  const tableBody = document.querySelector('#experts-table tbody');
  tableBody.innerHTML = '';

  if (currentExperts.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No experts found matching your filters</td>
      </tr>
    `;
    return;
  }

  currentExperts.forEach(expert => {
    const row = document.createElement('tr');

    // Format date
    const applicationDate = new Date(expert.accountCreated);
    const formattedDate = applicationDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    row.innerHTML = `
      <td>
        <div class="expert-info">
          <img src="${expert.profilePicture}" alt="${expert.name}" class="avatar">
          <div>
            <div><strong>${expert.name}</strong></div>
            <div style="font-size: 12px; color: #666;">${expert.email}</div>
          </div>
        </div>
      </td>
      <td>${expert.category}</td>
      <td>${expert.specialization}</td>
      <td>${formattedDate}</td>
      <td>
        <span class="status ${expert.verificationStatus}">
          ${capitalizeFirstLetter(expert.verificationStatus)}
        </span>
      </td>
      <td>
        <button class="btn btn-outline btn-sm view-expert-btn" data-id="${expert._id}">
          <i class="fas fa-eye"></i> View
        </button>
        ${expert.verificationStatus === 'pending' ? `
          <button class="btn btn-success btn-sm verify-expert-btn" data-id="${expert._id}">
            <i class="fas fa-check"></i> Verify
          </button>
        ` : ''}
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Add event listeners to buttons
  addExpertButtonListeners();

  // Update pagination controls
  updatePagination();
}

// Check if expert matches search query
function expertMatchesSearch(expert, query) {
  const lowercaseQuery = query.toLowerCase();
  return (
    expert.name.toLowerCase().includes(lowercaseQuery) ||
    expert.email.toLowerCase().includes(lowercaseQuery) ||
    expert.specialization.toLowerCase().includes(lowercaseQuery)
  );
}

// Add event listeners to expert table buttons
function addExpertButtonListeners() {
  // View expert details buttons
  document.querySelectorAll('.view-expert-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const expertId = this.getAttribute('data-id');
      viewExpertDetails(expertId);
    });
  });

  // Verify buttons (shortcut to open verification modal)
  document.querySelectorAll('.verify-expert-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const expertId = this.getAttribute('data-id');
      viewExpertDetails(expertId);
      openVerificationModal();
    });
  });
}

// Update pagination controls
function updatePagination() {
  const pagination = document.getElementById('experts-pagination');
  pagination.innerHTML = '';

  if (verificationState.pagination.totalPages <= 1) {
    return;
  }

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.disabled = verificationState.pagination.currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (verificationState.pagination.currentPage > 1) {
      verificationState.pagination.currentPage--;
      displayExperts();
    }
  });
  pagination.appendChild(prevBtn);

  // Page buttons
  const totalPages = verificationState.pagination.totalPages;
  const currentPage = verificationState.pagination.currentPage;

  for (let i = 1; i <= totalPages; i++) {
    // Show first, last, current and pages around current
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === currentPage ? 'active' : '';
      pageBtn.addEventListener('click', () => {
        verificationState.pagination.currentPage = i;
        displayExperts();
      });
      pagination.appendChild(pageBtn);
    } else if (
      (i === currentPage - 2 && currentPage > 3) ||
      (i === currentPage + 2 && currentPage < totalPages - 2)
    ) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.style.margin = '0 5px';
      pagination.appendChild(ellipsis);
    }
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.disabled = verificationState.pagination.currentPage === verificationState.pagination.totalPages;
  nextBtn.addEventListener('click', () => {
    if (verificationState.pagination.currentPage < verificationState.pagination.totalPages) {
      verificationState.pagination.currentPage++;
      displayExperts();
    }
  });
  pagination.appendChild(nextBtn);
}

// View expert details
function viewExpertDetails(expertId) {
  const expert = verificationState.experts.find(exp => exp._id === expertId);
  if (!expert) return;

  verificationState.selectedExpert = expert;

  // Hide experts list and show details
  document.querySelector('.card').style.display = 'none';
  document.getElementById('expert-details').style.display = 'block';

  // Format dates
  const applicationDate = new Date(expert.accountCreated);
  const formattedApplicationDate = applicationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Render expert details
  const detailContent = document.getElementById('expert-detail-content');

  detailContent.innerHTML = `
    <!-- Expert Header -->
    <div class="detail-header">
      <img src="${expert.profilePicture}" alt="${expert.name}" class="detail-avatar">
      <div>
        <div class="detail-name">${expert.name}</div>
        <div class="detail-category">${expert.category} - ${expert.specialization}</div>
      </div>
      <div class="detail-action-buttons">
        ${expert.verificationStatus === 'pending' ? `
          <button id="verify-btn" class="btn btn-success">
            <i class="fas fa-check-circle"></i> Verify
          </button>
          <button id="reject-btn" class="btn btn-danger">
            <i class="fas fa-times-circle"></i> Reject
          </button>
        ` : expert.verificationStatus === 'verified' ? `
          <span class="status verified">Verified</span>
          <button id="revoke-btn" class="btn btn-warning">
            <i class="fas fa-undo"></i> Revoke Verification
          </button>
        ` : `
          <span class="status rejected">Rejected</span>
          <button id="reconsider-btn" class="btn btn-outline">
            <i class="fas fa-redo"></i> Reconsider
          </button>
        `}
      </div>
    </div>

    <!-- Basic Information -->
    <div class="detail-section">
      <h3 class="detail-section-title">Basic Information</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item-label">Email</div>
          <div class="detail-item-value">${expert.email}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Application Date</div>
          <div class="detail-item-value">${formattedApplicationDate}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Verification Status</div>
          <div class="detail-item-value">
            <span class="status ${expert.verificationStatus}">
              ${capitalizeFirstLetter(expert.verificationStatus)}
            </span>
            ${expert.verificationNotes ? `<div style="margin-top: 5px; font-style: italic;">${expert.verificationNotes}</div>` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Professional Information -->
    <div class="detail-section">
      <h3 class="detail-section-title">Professional Information</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item-label">Category</div>
          <div class="detail-item-value">${expert.category}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Specialization</div>
          <div class="detail-item-value">${expert.specialization}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Highest Degree</div>
          <div class="detail-item-value">${expert.credentials.degree}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Institution</div>
          <div class="detail-item-value">${expert.credentials.institution}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Years of Experience</div>
          <div class="detail-item-value">${expert.credentials.yearsOfExperience} years</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Certifications</div>
          <div class="detail-item-value">${expert.credentials.certifications.join(', ')}</div>
        </div>
      </div>

      <div class="detail-item" style="margin-top: 20px;">
        <div class="detail-item-label">Professional Bio</div>
        <div class="detail-item-value" style="margin-top: 10px;">${expert.bio}</div>
      </div>
    </div>

    <!-- Document Uploads -->
    <div class="detail-section">
      <h3 class="detail-section-title">Document Uploads</h3>
      <div id="document-uploads">
        ${expert.documentUploads.length > 0 ? expert.documentUploads.map(doc => {
          // Format upload date
          const uploadDate = new Date(doc.uploadedAt);
          const formattedUploadDate = uploadDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          return `
            <div class="credential-file">
              <i class="fas ${doc.name.endsWith('.pdf') ? 'fa-file-pdf' : doc.name.endsWith('.jpg') || doc.name.endsWith('.png') ? 'fa-file-image' : 'fa-file'}"></i>
              <div class="credential-file-info">
                <div class="credential-file-name">${doc.name}</div>
                <div class="credential-file-date">Uploaded on ${formattedUploadDate}</div>
              </div>
              <div class="credential-file-actions">
                <button type="button" class="view-document-btn" data-path="${doc.path}" data-name="${doc.name}">
                  <i class="fas fa-eye"></i> View
                </button>
              </div>
            </div>
          `;
        }).join('') : '<p>No documents uploaded</p>'}
      </div>
    </div>
  `;

  // Add event listeners to action buttons
  if (expert.verificationStatus === 'pending') {
    document.getElementById('verify-btn').addEventListener('click', openVerificationModal);
    document.getElementById('reject-btn').addEventListener('click', () => {
      openVerificationModal('rejected');
    });
  } else if (expert.verificationStatus === 'verified') {
    document.getElementById('revoke-btn').addEventListener('click', () => {
      openVerificationModal('rejected');
    });
  } else { // rejected
    document.getElementById('reconsider-btn').addEventListener('click', () => {
      openVerificationModal('verified');
    });
  }

  // Add event listeners to document view buttons
  document.querySelectorAll('.view-document-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const docPath = this.getAttribute('data-path');
      const docName = this.getAttribute('data-name');
      openDocumentModal(docPath, docName);
    });
  });
}

// Open verification modal
function openVerificationModal(preselectedStatus) {
  const modal = document.getElementById('verification-modal');
  const statusSelect = document.getElementById('verification-status');
  const rejectionGroup = document.getElementById('rejection-reason-group');
  const notesField = document.getElementById('verification-notes');

  // Set pre-selected status if provided
  if (preselectedStatus) {
    statusSelect.value = preselectedStatus;
  } else {
    statusSelect.value = 'verified'; // Default to verified
  }

  // Show/hide rejection reason field
  if (statusSelect.value === 'rejected') {
    rejectionGroup.style.display = 'block';

    // Prefill with existing notes if any
    if (verificationState.selectedExpert.verificationNotes) {
      notesField.value = verificationState.selectedExpert.verificationNotes;
    } else {
      notesField.value = '';
    }
  } else {
    rejectionGroup.style.display = 'none';
    notesField.value = '';
  }

  // Show modal
  modal.style.display = 'flex';
}

// Close verification modal
function closeVerificationModal() {
  document.getElementById('verification-modal').style.display = 'none';
}

// Submit verification decision
function submitVerificationDecision() {
  const status = document.getElementById('verification-status').value;
  const notes = document.getElementById('verification-notes').value;

  // Update expert's verification status
  verificationState.selectedExpert.verificationStatus = status;
  verificationState.selectedExpert.verificationNotes = status === 'rejected' ? notes : '';

  // Set verification date and verified by
  if (status === 'verified') {
    verificationState.selectedExpert.verifiedAt = new Date().toISOString();

    // Set verifiedBy to current admin user
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    verificationState.selectedExpert.verifiedBy = userData._id || 'admin-user';

    // Mark all documents as verified
    verificationState.selectedExpert.documentUploads.forEach(doc => {
      doc.verified = true;
    });
  }

  // Close modal
  closeVerificationModal();

  // Update UI
  viewExpertDetails(verificationState.selectedExpert._id);
  showNotification(`Expert ${status === 'verified' ? 'verified' : 'rejected'} successfully`, 'success');

  // Update counts
  updatePendingCount();
}

// Open document modal
function openDocumentModal(docPath, docName) {
  const modal = document.getElementById('document-modal');
  const title = document.getElementById('document-modal-title');
  const content = document.getElementById('document-modal-content');

  title.textContent = docName;

  // Determine file type
  const isPdf = docName.toLowerCase().endsWith('.pdf');
  const isImage = ['.jpg', '.jpeg', '.png', '.gif'].some(ext => docName.toLowerCase().endsWith(ext));

  if (isPdf) {
    // Show PDF (in a real app, this would be a real PDF viewer)
    content.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <i class="fas fa-file-pdf" style="font-size: 48px; color: #e74c3c;"></i>
        <p style="margin-top: 10px;">PDF Document Preview</p>
        <p style="color: #666; font-size: 14px;">${docName}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; text-align: left;">
          <p><strong>Document Content:</strong></p>
          <p>This is a mock PDF document for demonstration purposes.</p>
          <p>In a real application, this would display the actual PDF document content.</p>
        </div>
      </div>
    `;
  } else if (isImage) {
    // Show image
    content.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <img src="${docPath}" alt="${docName}" style="max-width: 100%; max-height: 400px;">
      </div>
    `;
  } else {
    // Generic file
    content.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <i class="fas fa-file" style="font-size: 48px; color: #3498db;"></i>
        <p style="margin-top: 10px;">File Preview</p>
        <p style="color: #666; font-size: 14px;">${docName}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; text-align: left;">
          <p>This file type cannot be previewed.</p>
        </div>
      </div>
    `;
  }

  // Show modal
  modal.style.display = 'flex';
}

// Close document modal
function closeDocumentModal() {
  document.getElementById('document-modal').style.display = 'none';
}

// Show notification
function showNotification(message, type = 'info') {
  const notificationArea = document.getElementById('notification-area');

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  // Set icon based on type
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';

  notification.innerHTML = `
    <i class="fas ${icon} notification-icon"></i>
    <div>${message}</div>
  `;

  notificationArea.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// Update the pending count badge
function updatePendingCount() {
  const pendingCount = verificationState.experts.filter(exp => exp.verificationStatus === 'pending').length;
  const badge = document.getElementById('pending-count');
  badge.textContent = pendingCount;

  if (pendingCount === 0) {
    badge.style.display = 'none';
  } else {
    badge.style.display = 'inline-block';
  }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize the verification page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initExpertVerification);
