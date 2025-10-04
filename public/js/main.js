document.addEventListener('DOMContentLoaded', () => {
    console.log('Main JavaScript loaded.');
    
    // --- 1. ADMIN USER CREATION FORM LOGIC ---
    const roleSelect = document.getElementById('role');
    const managerDiv = document.getElementById('managerDiv');
    const managerSelect = document.getElementById('managerId');

    function toggleManagerField() {
        if (!roleSelect || !managerSelect) return;
        
        const selectedRole = roleSelect.value;
        
        // Use Bootstrap utility class to hide/show manager field
        if (managerDiv) {
            managerDiv.style.display = (selectedRole === 'Employee') ? 'block' : 'none';
        }
        
        if (managerSelect) {
            if (selectedRole === 'Employee') {
                 // For Employees, make manager selection mandatory
                managerSelect.setAttribute('required', 'required');
            } else {
                managerSelect.removeAttribute('required');
            }
        }
    }

    if (roleSelect) {
        roleSelect.addEventListener('change', toggleManagerField);
        toggleManagerField();
    }
    
    // --- 2. AUTO-DISMISS FLASH MESSAGES (The Fix) ---
    const alerts = document.querySelectorAll('.alert');
    const DISMISS_TIMEOUT_MS = 4000; // 4 seconds

    alerts.forEach(alertEl => {
        // Use Bootstrap's built-in Alert object to control dismissal
        const bsAlert = new bootstrap.Alert(alertEl);
        
        setTimeout(() => {
            // Closes the alert, triggering the fade animation
            bsAlert.close(); 
        }, DISMISS_TIMEOUT_MS);
    });
});
