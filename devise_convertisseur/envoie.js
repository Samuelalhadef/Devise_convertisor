document.addEventListener('DOMContentLoaded', function() {
    // Initialisation d'EmailJS
    emailjs.init("xcrdvgPUprLxVXPH2");

    // Cache des éléments DOM
    const elements = {
        form: document.getElementById('transferForm'),
        steps: document.querySelectorAll('.step'),
        stepContents: document.querySelectorAll('.step-content'),
        nextBtn: document.getElementById('nextButton'),
        prevBtn: document.getElementById('prevButton'),
        submitBtn: document.getElementById('submitButton'),
        recipientName: document.getElementById('recipientName'),
        recipientEmail: document.getElementById('recipientEmail'),
        amount: document.getElementById('amount'),
        currency: document.getElementById('currency'),
        message: document.getElementById('message')
    };

    // État de l'application
    const state = {
        currentStep: 1,
        totalSteps: 3
    };

    // Gestionnaires d'événements
    function setupEventListeners() {
        elements.form.addEventListener('submit', handleSubmit);
        elements.nextBtn.addEventListener('click', () => navigateStep(1));
        elements.prevBtn.addEventListener('click', () => navigateStep(-1));

        // Validation en temps réel
        elements.recipientName.addEventListener('input', validateName);
        elements.recipientEmail.addEventListener('input', validateEmail);
        elements.amount.addEventListener('input', validateAmount);
    }

    // Fonctions de validation
    function validateName() {
        const name = elements.recipientName.value.trim();
        const isValid = name.length >= 2;
        showValidation(elements.recipientName, isValid, 'Le nom doit contenir au moins 2 caractères');
        return isValid;
    }

    function validateEmail() {
        const email = elements.recipientEmail.value.trim();
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        showValidation(elements.recipientEmail, isValid, 'Email invalide');
        return isValid;
    }

    function validateAmount() {
        const amount = elements.amount.value;
        const isValid = amount > 0;
        showValidation(elements.amount, isValid, 'Le montant doit être supérieur à 0');
        return isValid;
    }

    function showValidation(element, isValid, errorMessage) {
        const container = element.parentElement;
        const existingError = container.querySelector('.error-message');

        if (!isValid) {
            element.classList.add('invalid');
            if (!existingError) {
                const error = document.createElement('div');
                error.className = 'error-message';
                error.textContent = errorMessage;
                container.appendChild(error);
            }
        } else {
            element.classList.remove('invalid');
            if (existingError) existingError.remove();
        }
    }

    // Navigation entre les étapes
    function navigateStep(direction) {
        const newStep = state.currentStep + direction;
        if (newStep >= 1 && newStep <= state.totalSteps && validateCurrentStep()) {
            state.currentStep = newStep;
            updateStepDisplay();
        }
    }

    function updateStepDisplay() {
        elements.steps.forEach((step, index) => {
            step.classList.toggle('active', index + 1 === state.currentStep);
        });

        elements.stepContents.forEach((content, index) => {
            content.style.display = index + 1 === state.currentStep ? 'block' : 'none';
        });

        elements.prevBtn.style.display = state.currentStep === 1 ? 'none' : 'block';
        elements.nextBtn.style.display = state.currentStep === state.totalSteps ? 'none' : 'block';
        elements.submitBtn.style.display = state.currentStep === state.totalSteps ? 'block' : 'none';

        if (state.currentStep === state.totalSteps) {
            updateSummary();
        }
    }

    function validateCurrentStep() {
        switch(state.currentStep) {
            case 1:
                return validateName() && validateEmail();
            case 2:
                return validateAmount();
            default:
                return true;
        }
    }

    // Mise à jour du résumé
    function updateSummary() {
        document.getElementById('summaryName').textContent = elements.recipientName.value;
        document.getElementById('summaryEmail').textContent = elements.recipientEmail.value;
        document.getElementById('summaryAmount').textContent = `${elements.amount.value} ${elements.currency.value}`;
        document.getElementById('summaryTotal').textContent = `${elements.amount.value} ${elements.currency.value}`;
    }

    // Gestion de l'envoi du formulaire
    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateCurrentStep()) return;

        showLoading();

        try {
            const templateParams = {
                to_name: elements.recipientName.value,
                to_email: elements.recipientEmail.value,
                amount: elements.amount.value,
                currency: elements.currency.value,
                message: elements.message.value || '',
                from_name: 'Service de Paiement',
                payment_link: `https://payment.yourdomain.com/${generatePaymentId()}`,
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')
            };

            const response = await emailjs.send(
                'service_lih0vec',
                'template_84dxclp',
                templateParams
            );

            if (response.status === 200) {
                saveTransfer(templateParams);
                showSuccess();
            }
        } catch (error) {
            console.error('Erreur:', error);
            showError("L'envoi a échoué. Veuillez réessayer.");
        } finally {
            hideLoading();
        }
    }

    // Fonctions utilitaires
    function generatePaymentId() {
        return 'PAY-' + Date.now().toString(36).toUpperCase();
    }

    function saveTransfer(data) {
        const transfers = JSON.parse(localStorage.getItem('recentTransfers') || '[]');
        transfers.unshift({
            name: data.to_name,
            email: data.to_email,
            amount: data.amount,
            currency: data.currency,
            date: new Date().toISOString()
        });
        localStorage.setItem('recentTransfers', JSON.stringify(transfers.slice(0, 5)));
    }

    // Gestion des messages UI
    function showLoading() {
        const loader = document.createElement('div');
        loader.className = 'loading-message';
        loader.innerHTML = '<div class="spinner"></div><span>Envoi en cours...</span>';
        elements.form.appendChild(loader);
    }

    function hideLoading() {
        const loader = elements.form.querySelector('.loading-message');
        if (loader) loader.remove();
    }

    function showSuccess() {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.innerHTML = '<i class="fas fa-check-circle"></i><span>Demande envoyée avec succès !</span>';
        elements.form.appendChild(message);

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }

    function showError(text) {
        const message = document.createElement('div');
        message.className = 'error-message';
        message.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${text}</span>`;
        elements.form.appendChild(message);

        setTimeout(() => message.remove(), 5000);
    }

    // Initialisation
    setupEventListeners();
    updateStepDisplay();
});