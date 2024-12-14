document.addEventListener("DOMContentLoaded", function () {
    const API_KEY = "cb292f1e4400e868b1c08c85";
    const BASE_URL = "https://v6.exchangerate-api.com/v6";

    // Configuration des devises avec leurs pays correspondants
    const CURRENCY_COUNTRIES = {
        EUR: { country: "eu", name: "Euro", symbol: "€" },
        USD: { country: "us", name: "Dollar américain", symbol: "$" },
        GBP: { country: "gb", name: "Livre sterling", symbol: "£" },
        JPY: { country: "jp", name: "Yen japonais", symbol: "¥" },
        AUD: { country: "au", name: "Dollar australien", symbol: "A$" },
        CAD: { country: "ca", name: "Dollar canadien", symbol: "C$" },
        CHF: { country: "ch", name: "Franc suisse", symbol: "CHF" },
        CNY: { country: "cn", name: "Yuan chinois", symbol: "¥" },
    };
    
    // État de l'application
    let state = {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        amount: 1.00,
        currencies: {},
        exchangeRate: null,
        dropdownsVisible: {
            devise1: false,
            devise2: false
        }
    };

    // Éléments du DOM
    const elements = {
        montantInput: document.getElementById('montant'),
        devise1Wrapper: document.getElementById('devise1-wrapper'),
        devise2Wrapper: document.getElementById('devise2-wrapper'),
        devise1Selected: document.getElementById('devise1-selected'),
        devise2Selected: document.getElementById('devise2-selected'),
        devise1Dropdown: document.getElementById('devise1-dropdown'),
        devise2Dropdown: document.getElementById('devise2-dropdown'),
        flag1: document.getElementById('flag1'),
        flag2: document.getElementById('flag2'),
        swapButton: document.getElementById('swap-currencies'),
        convertButton: document.getElementById('convert-button'),
        result: document.getElementById('result'),
        currencyTag: document.getElementById('currency-tag')
    };

    // Initialisation
    async function initialize() {
        try {
            await loadCurrencies();
            setupEventListeners();
            createCurrencyDropdowns();
            setDefaultValues();
        } catch (error) {
            showError("Erreur d'initialisation : " + error.message);
        }
    }

    // Chargement des taux de change
    async function loadCurrencies() {
        try {
            const response = await fetch(`${BASE_URL}/${API_KEY}/latest/USD`);
            if (!response.ok) throw new Error('Erreur réseau');
            const data = await response.json();
            state.currencies = data.conversion_rates;
        } catch (error) {
            throw new Error("Impossible de charger les taux de change");
        }
    }

    function createCurrencyDropdowns() {
        const currencies = Object.keys(CURRENCY_COUNTRIES);
        
        elements.devise1Dropdown.innerHTML = '';
        elements.devise2Dropdown.innerHTML = '';

        currencies.forEach(currency => {
            const countryData = CURRENCY_COUNTRIES[currency];
            const flagUrl = `https://flagcdn.com/w20/${countryData.country}.png`;

            const option1 = createCurrencyOption(currency, countryData, flagUrl);
            const option2 = createCurrencyOption(currency, countryData, flagUrl);

            elements.devise1Dropdown.appendChild(option1);
            elements.devise2Dropdown.appendChild(option2);
        });
    }

    function createCurrencyOption(currency, countryData, flagUrl) {
        const option = document.createElement('div');
        option.className = 'currency-option';
        option.innerHTML = `
            <img src="${flagUrl}" alt="${currency}" class="flag-icon">
            <div class="currency-info">
                <span class="currency-code">${currency}</span>
                <span class="currency-name">${countryData.name}</span>
            </div>
        `;
        
        option.addEventListener('click', () => {
            handleCurrencySelection(currency, option.parentElement.id === 'devise1-dropdown');
        });

        return option;
    }

    function handleCurrencySelection(currency, isFromCurrency) {
        if (isFromCurrency) {
            state.fromCurrency = currency;
            updateSelectedCurrency(currency, elements.devise1Selected, elements.flag1);
            toggleDropdown('devise1');
        } else {
            state.toCurrency = currency;
            updateSelectedCurrency(currency, elements.devise2Selected, elements.flag2);
            toggleDropdown('devise2');
        }
        
        updateCurrencyTag();
        handleConversion();
    }

    function updateSelectedCurrency(currency, selectedElement, flagElement) {
        const countryData = CURRENCY_COUNTRIES[currency];
        const flagUrl = `https://flagcdn.com/w20/${countryData.country}.png`;
        
        flagElement.src = flagUrl;
        flagElement.alt = currency;
        selectedElement.querySelector('.currency-code').textContent = currency;
        selectedElement.querySelector('.currency-name').textContent = countryData.name;
    }

    function toggleDropdown(dropdownId) {
        state.dropdownsVisible[dropdownId] = !state.dropdownsVisible[dropdownId];
        const dropdown = document.getElementById(`${dropdownId}-dropdown`);
        dropdown.style.display = state.dropdownsVisible[dropdownId] ? 'block' : 'none';
    }

    // Configuration des valeurs par défaut
    function setDefaultValues() {
        updateSelectedCurrency('USD', elements.devise1Selected, elements.flag1);
        updateSelectedCurrency('EUR', elements.devise2Selected, elements.flag2);
        updateCurrencyTag();
    }

    function updateCurrencyTag() {
        const currency = CURRENCY_COUNTRIES[state.fromCurrency];
        if (currency) {
            elements.currencyTag.textContent = currency.symbol;
        }
    }

    // Configuration des écouteurs d'événements
    function setupEventListeners() {
        elements.montantInput.addEventListener('input', handleAmountChange);
        elements.swapButton.addEventListener('click', handleSwapCurrencies);
        elements.convertButton.addEventListener('click', handleConversion);
        
        elements.devise1Selected.addEventListener('click', () => toggleDropdown('devise1'));
        elements.devise2Selected.addEventListener('click', () => toggleDropdown('devise2'));

        // Fermer les dropdowns quand on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!elements.devise1Wrapper.contains(e.target)) {
                state.dropdownsVisible.devise1 = false;
                elements.devise1Dropdown.style.display = 'none';
            }
            if (!elements.devise2Wrapper.contains(e.target)) {
                state.dropdownsVisible.devise2 = false;
                elements.devise2Dropdown.style.display = 'none';
            }
        });
    }

    function handleAmountChange(e) {
        state.amount = parseFloat(e.target.value) || 0;
        if (state.amount > 0) {
            handleConversion();
        }
    }

    function handleSwapCurrencies() {
        [state.fromCurrency, state.toCurrency] = [state.toCurrency, state.fromCurrency];
        
        // Échanger les affichages
        const tempHTML = elements.devise1Selected.innerHTML;
        elements.devise1Selected.innerHTML = elements.devise2Selected.innerHTML;
        elements.devise2Selected.innerHTML = tempHTML;

        updateCurrencyTag();
        handleConversion();
    }

    async function handleConversion() {
        if (!state.amount || !state.fromCurrency || !state.toCurrency) return;

        try {
            showLoading();
            const url = `${BASE_URL}/${API_KEY}/pair/${state.fromCurrency}/${state.toCurrency}/${state.amount}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Erreur de conversion');
            
            const data = await response.json();
            displayResult(data.conversion_result);
        } catch (error) {
            showError("Erreur lors de la conversion");
        }
    }

    function displayResult(result) {
        const formattedResult = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: state.toCurrency
        }).format(result);

        elements.result.innerHTML = `
            <div class="result-amount">${formattedResult}</div>
            <div class="result-rate">
                1 ${state.fromCurrency} = ${(result/state.amount).toFixed(4)} ${state.toCurrency}
            </div>
        `;
        elements.result.classList.add('show');
    }

    function showLoading() {
        elements.result.innerHTML = '<div class="loading">Conversion en cours...</div>';
        elements.result.classList.add('show');
    }

    function showError(message) {
        elements.result.innerHTML = `<div class="error">${message}</div>`;
        elements.result.classList.add('show');
    }

    // Démarrage de l'application
    initialize();
});