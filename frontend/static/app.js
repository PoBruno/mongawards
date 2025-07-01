const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');

showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nickname = document.getElementById('login-nickname').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname, password })
    });

    if (response.ok) {
        window.location.href = '/dashboard';
    } else {
        console.log('Failed to login');
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nickname = document.getElementById('register-nickname').value;
    const password = document.getElementById('register-password').value;
    const secret_code = document.getElementById('secret-code').value;

    const response = await fetch('/users/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname, password, secret_code })
    });

    if (response.ok) {
        console.log('Registration successful! Please login.');
        showLogin.click();
    } else {
        const error = await response.json();
        console.error(`Registration failed: ${error.detail}`);
    }
});
