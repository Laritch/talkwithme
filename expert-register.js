/**
 * Expert Registration for Service Marketplace
 * Handles the expert registration form and submission
 */

// State management for the registration form
const registrationState = {
  // Track selected files for document uploads
  documentFiles: [],
  // Track availability slots
  availabilitySlots: [],
  // Track consultation types
  consultationTypes: []
};

// Initialize the registration form
function initExpertRegistration() {
  // Set up file upload handlers
  setupFileUpload('profile-picture', 'profile-picture-name');
  setupDocumentUpload();

  // Set up availability and consultation type handlers
  setupAvailabilitySection();
  setupConsultationSection();

  // Add form submission handler
  const form = document.getElementById('expert-register-form');
  if (form) {
    form.addEventListener('submit', handleRegistrationSubmit);
  }
}

// Set up single file upload with preview
function setupFileUpload(inputId, previewElementId) {
  const fileInput = document.getElementById(inputId);
  const previewElement = document.getElementById(previewElementId);

  if (!fileInput || !previewElement) return;

  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
      previewElement.textContent = '';
      return;
    }

    // Display file name
    previewElement.textContent = file.name;

    // If it's an image and you want to show preview
    if (file.type.startsWith('image/')) {
      // Create a thumbnail preview if needed
      // This is optional and depends on your UI design
    }
  });
}

// Set up document upload section with multiple file support
function setupDocumentUpload() {
  const documentUpload = document.getElementById('document-uploads');
  const documentList = document.getElementById('document-list');

  if (!documentUpload || !documentList) return;

  documentUpload.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);

    // Clear the current list if needed
    // documentList.innerHTML = '';

    // Check maximum number of files
    if (registrationState.documentFiles.length + files.length > 5) {
      alert('Maximum 5 documents allowed. Please remove some files first.');
      return;
    }

    // Add files to state and UI
    files.forEach(file => {
      // Add to state
      registrationState.documentFiles.push(file);

      // Create element for file
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.innerHTML = `
        <div class="file-name">${file.name}</div>
        <i class="fas fa-times remove-file" data-filename="${file.name}"></i>
      `;

      // Add to DOM
      documentList.appendChild(fileItem);
    });

    // Add event listeners to remove buttons
    attachRemoveFileListeners();
  });
}

// Attach event listeners to file remove buttons
function attachRemoveFileListeners() {
  document.querySelectorAll('.remove-file').forEach(button => {
    button.addEventListener('click', function() {
      const filename = this.getAttribute('data-filename');

      // Remove from state
      registrationState.documentFiles = registrationState.documentFiles.filter(
        file => file.name !== filename
      );

      // Remove from DOM
      this.closest('.file-item').remove();
    });
  });
}

// Set up the availability section with add/remove functionality
function setupAvailabilitySection() {
  const availabilityContainer = document.getElementById('availability-container');
  const addAvailabilityBtn = document.getElementById('add-availability');

  if (!availabilityContainer || !addAvailabilityBtn) return;

  // Add initial availability slot
  addAvailabilitySlot();

  // Add button listener
  addAvailabilityBtn.addEventListener('click', addAvailabilitySlot);

  // Function to add a new availability slot
  function addAvailabilitySlot() {
    const slotId = `availability-${Date.now()}`;
    const newSlot = {
      id: slotId,
      day: 'monday',
      startTime: '09:00',
      endTime: '17:00'
    };

    // Add to state
    registrationState.availabilitySlots.push(newSlot);

    // Create DOM element
    const slotElement = document.createElement('div');
    slotElement.className = 'availability-row';
    slotElement.id = slotId;
    slotElement.innerHTML = `
      <div class="availability-day">
        <select name="availability-day" required>
          <option value="monday">Monday</option>
          <option value="tuesday">Tuesday</option>
          <option value="wednesday">Wednesday</option>
          <option value="thursday">Thursday</option>
          <option value="friday">Friday</option>
          <option value="saturday">Saturday</option>
          <option value="sunday">Sunday</option>
        </select>
      </div>
      <div class="availability-times">
        <input type="time" name="availability-start" value="09:00" required>
        <span>to</span>
        <input type="time" name="availability-end" value="17:00" required>
      </div>
      <div class="availability-actions">
        <button type="button" class="remove-time" title="Remove">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // Add to DOM
    availabilityContainer.appendChild(slotElement);

    // Add event listeners
    const selects = slotElement.querySelectorAll('select');
    const inputs = slotElement.querySelectorAll('input');
    const removeBtn = slotElement.querySelector('.remove-time');

    // Update state when values change
    selects.forEach(select => {
      select.addEventListener('change', function() {
        const slot = registrationState.availabilitySlots.find(s => s.id === slotId);
        if (slot) slot.day = this.value;
      });
    });

    inputs.forEach(input => {
      input.addEventListener('change', function() {
        const slot = registrationState.availabilitySlots.find(s => s.id === slotId);
        if (slot) {
          if (this.name === 'availability-start') {
            slot.startTime = this.value;
          } else if (this.name === 'availability-end') {
            slot.endTime = this.value;
          }
        }
      });
    });

    // Remove slot when button is clicked
    removeBtn.addEventListener('click', function() {
      // Don't remove if it's the only slot
      if (registrationState.availabilitySlots.length <= 1) {
        alert('You must provide at least one availability slot.');
        return;
      }

      // Remove from state
      registrationState.availabilitySlots = registrationState.availabilitySlots.filter(
        s => s.id !== slotId
      );

      // Remove from DOM
      document.getElementById(slotId).remove();
    });
  }
}

// Set up the consultation types section with add/remove functionality
function setupConsultationSection() {
  const consultationContainer = document.getElementById('consultation-container');
  const addConsultationBtn = document.getElementById('add-consultation');

  if (!consultationContainer || !addConsultationBtn) return;

  // Add initial consultation type
  addConsultationType();

  // Add button listener
  addConsultationBtn.addEventListener('click', addConsultationType);

  // Function to add a new consultation type
  function addConsultationType() {
    const typeId = `consultation-${Date.now()}`;
    const newType = {
      id: typeId,
      duration: 60,
      price: 100,
      description: 'Standard Consultation'
    };

    // Add to state
    registrationState.consultationTypes.push(newType);

    // Create DOM element
    const typeElement = document.createElement('div');
    typeElement.className = 'consultation-row';
    typeElement.id = typeId;
    typeElement.innerHTML = `
      <div class="consultation-duration">
        <label>Duration (minutes)</label>
        <input type="number" name="consultation-duration" value="60" min="15" step="15" required>
      </div>
      <div class="consultation-price">
        <label>Price ($)</label>
        <input type="number" name="consultation-price" value="100" min="0" required>
      </div>
      <div class="consultation-description">
        <label>Description</label>
        <input type="text" name="consultation-description" value="Standard Consultation" required>
      </div>
      <div class="consultation-actions">
        <button type="button" class="remove-time" title="Remove">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // Add to DOM
    consultationContainer.appendChild(typeElement);

    // Add event listeners
    const inputs = typeElement.querySelectorAll('input');
    const removeBtn = typeElement.querySelector('.remove-time');

    // Update state when values change
    inputs.forEach(input => {
      input.addEventListener('change', function() {
        const type = registrationState.consultationTypes.find(t => t.id === typeId);
        if (type) {
          if (this.name === 'consultation-duration') {
            type.duration = parseInt(this.value, 10);
          } else if (this.name === 'consultation-price') {
            type.price = parseFloat(this.value);
          } else if (this.name === 'consultation-description') {
            type.description = this.value;
          }
        }
      });
    });

    // Remove type when button is clicked
    removeBtn.addEventListener('click', function() {
      // Don't remove if it's the only type
      if (registrationState.consultationTypes.length <= 1) {
        alert('You must provide at least one consultation type.');
        return;
      }

      // Remove from state
      registrationState.consultationTypes = registrationState.consultationTypes.filter(
        t => t.id !== typeId
      );

      // Remove from DOM
      document.getElementById(typeId).remove();
    });
  }
}

// Handle form submission
async function handleRegistrationSubmit(event) {
  event.preventDefault();

  // Get form element and error message element
  const form = event.target;
  const errorMsg = document.getElementById('register-error');

  // Reset error message
  errorMsg.style.display = 'none';

  // Validate passwords match
  const password = form.querySelector('#password').value;
  const confirmPassword = form.querySelector('#confirm-password').value;

  if (password !== confirmPassword) {
    errorMsg.textContent = 'Passwords do not match';
    errorMsg.style.display = 'block';
    return;
  }

  // Validate at least one availability slot and consultation type
  if (registrationState.availabilitySlots.length === 0) {
    errorMsg.textContent = 'Please add at least one availability slot';
    errorMsg.style.display = 'block';
    return;
  }

  if (registrationState.consultationTypes.length === 0) {
    errorMsg.textContent = 'Please add at least one consultation type';
    errorMsg.style.display = 'block';
    return;
  }

  // Get form data
  const formData = new FormData(form);

  // Add availability and consultation types to form data
  formData.append('availabilitySlots', JSON.stringify(registrationState.availabilitySlots));
  formData.append('consultationTypes', JSON.stringify(registrationState.consultationTypes));

  // Add document files to form data
  registrationState.documentFiles.forEach((file, index) => {
    formData.append(`document-${index}`, file);
  });

  try {
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    // In production, this would actually send the data to the server
    // For demo purposes, simulate a server response
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create a mock expert object based on the form data
    const mockExpert = {
      _id: 'exp-' + Math.random().toString(36).substr(2, 9),
      name: formData.get('name'),
      email: formData.get('email'),
      profilePicture: '/uploads/default-avatar.png',
      category: formData.get('category'),
      specialization: formData.get('specialization'),
      bio: formData.get('bio'),
      verificationStatus: 'pending',
      credentials: {
        degree: formData.get('degree'),
        certifications: formData.get('certifications').split(',').map(c => c.trim()),
        yearsOfExperience: parseInt(formData.get('yearsOfExperience'), 10),
        institution: formData.get('institution')
      },
      documentUploads: registrationState.documentFiles.map(file => ({
        name: file.name,
        path: `/uploads/${file.name}`,
        uploadedAt: new Date().toISOString(),
        verified: false
      })),
      consultationTypes: registrationState.consultationTypes.map(type => ({
        duration: type.duration,
        price: type.price,
        description: type.description
      })),
      availability: registrationState.availabilitySlots.map(slot => ({
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime
      })),
      socialProfiles: {
        linkedin: formData.get('linkedin') || '',
        twitter: formData.get('twitter') || '',
        website: formData.get('website') || ''
      },
      languages: formData.get('languages').split(',').map(l => l.trim()),
      token: 'expert-demo-token-' + Math.random().toString(36).substr(2, 9),
      accountCreated: new Date().toISOString()
    };

    // Store the expert data in localStorage
    localStorage.setItem('expertData', JSON.stringify(mockExpert));

    // Redirect to the expert dashboard
    window.location.href = '/expert-dashboard.html';

  } catch (error) {
    console.error('Registration error:', error);
    errorMsg.textContent = error.message || 'Registration failed. Please try again.';
    errorMsg.style.display = 'block';

    // Reset button
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Application';
  }
}

// Initialize the expert registration when the DOM is loaded
document.addEventListener('DOMContentLoaded', initExpertRegistration);
