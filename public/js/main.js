document.addEventListener('DOMContentLoaded', () => {
    console.log('Main JavaScript loaded.');
    
    // --- 1. ADMIN USER CREATION FORM LOGIC ---
    const roleSelect = document.getElementById('role');
    const managerDiv = document.getElementById('managerDiv'); // We will assume a wrapper div exists
    const managerSelect = document.getElementById('managerId');

    // Function to show/hide the Manager field based on selected Role
    function toggleManagerField() {
        if (!roleSelect || !managerSelect) return; // Exit if elements don't exist (e.g., on login page)
        
        const selectedRole = roleSelect.value;
        
        if (selectedRole === 'Employee') {
            // Employee role requires a manager
            // We'll update the 'views/users/new.ejs' to wrap the manager field with managerDiv
            if (managerDiv) managerDiv.style.display = 'block';
            if (managerSelect) managerSelect.setAttribute('required', 'required'); // Client-side check
        } else {
            // Manager/Admin role does not require a manager
            if (managerDiv) managerDiv.style.display = 'none';
            if (managerSelect) managerSelect.removeAttribute('required');
        }
    }

    // Attach event listener to the role selection change
    if (roleSelect) {
        roleSelect.addEventListener('change', toggleManagerField);
        // Initial call on page load to set the correct state
        toggleManagerField();
    }
    
    // --- 2. EXPENSE SUBMISSION LOGIC (Future) ---
    // You could add logic here for:
    // - Dynamically fetching exchange rates when the currency field changes.
    // - OCR functionality integration (if implemented)
    
});