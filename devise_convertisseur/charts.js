document.addEventListener('DOMContentLoaded', function() {
    // Configuration initiale
    const config = {
        currencies: {
            fromCurrency: 'EUR',
            toCurrency: 'USD'
        },
        timeRange: '1D',
        chart: null
    };

    // Données de démonstration pour le graphique
    function generateDemoData(days = 1) {
        const data = [];
        const now = new Date();
        const baseValue = 1.1;
        const volatility = 0.002;
        const pointsPerDay = days === 1 ? 24 : days;

        for (let i = 0; i < pointsPerDay; i++) {
            const time = new Date(now - (pointsPerDay - i) * (24 * 60 * 60 * 1000 / pointsPerDay));
            const randomChange = (Math.random() - 0.5) * volatility;
            const value = baseValue + randomChange + (Math.sin(i / 10) * volatility);
            
            data.push({
                time: time,
                value: value
            });
        }

        return data;
    }

    // Configuration du graphique
    function createChart(data) {
        const ctx = document.getElementById('mainChart').getContext('2d');
        
        if (config.chart) {
            config.chart.destroy();
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.1)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

        config.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.time),
                datasets: [{
                    label: `${config.currencies.fromCurrency}/${config.currencies.toCurrency}`,
                    data: data.map(item => item.value),
                    borderColor: '#2563eb',
                    borderWidth: 2,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHitRadius: 20,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#2563eb',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: function(tooltipItems) {
                                const date = new Date(tooltipItems[0].parsed.x);
                                return date.toLocaleString();
                            },
                            label: function(context) {
                                return `${config.currencies.fromCurrency}/${config.currencies.toCurrency}: ${context.parsed.y.toFixed(4)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: config.timeRange === '1D' ? 'hour' : 'day'
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        grid: {
                            color: '#e2e8f0'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(4);
                            }
                        }
                    }
                }
            }
        });
    }

    // Mise à jour des statistiques
    function updateStatistics(data) {
        const currentValue = data[data.length - 1].value;
        const startValue = data[0].value;
        const change = ((currentValue - startValue) / startValue) * 100;
        const highValue = Math.max(...data.map(item => item.value));
        const lowValue = Math.min(...data.map(item => item.value));

        // Mise à jour des éléments DOM
        document.querySelectorAll('.stat-card').forEach(card => {
            const title = card.querySelector('.stat-title').textContent.toLowerCase();
            const valueElement = card.querySelector('.stat-value');
            const changeElement = card.querySelector('.stat-change');

            switch(title) {
                case 'taux actuel':
                    valueElement.textContent = currentValue.toFixed(4);
                    if (changeElement) {
                        changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                        changeElement.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
                    }
                    break;
                case 'plus haut':
                    valueElement.textContent = highValue.toFixed(4);
                    break;
                case 'plus bas':
                    valueElement.textContent = lowValue.toFixed(4);
                    break;
                case 'variation':
                    const variation = highValue - lowValue;
                    valueElement.textContent = variation.toFixed(4);
                    if (changeElement) {
                        const variationPercent = (variation / lowValue) * 100;
                        changeElement.textContent = `${variationPercent >= 0 ? '+' : ''}${variationPercent.toFixed(2)}%`;
                        changeElement.className = `stat-change ${variationPercent >= 0 ? 'positive' : 'negative'}`;
                    }
                    break;
            }
        });
    }

    // Gestionnaires d'événements
    function setupEventListeners() {
        // Gestion des périodes
        document.querySelectorAll('.time-range button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.time-range button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                config.timeRange = button.textContent;
                
                let days;
                switch(config.timeRange) {
                    case '1J': days = 1; break;
                    case '1S': days = 7; break;
                    case '1M': days = 30; break;
                    case '1A': days = 365; break;
                    default: days = 1;
                }
                
                const newData = generateDemoData(days);
                createChart(newData);
                updateStatistics(newData);
            });
        });

        // Gestion des devises
        document.getElementById('baseCurrency').addEventListener('change', (e) => {
            config.currencies.fromCurrency = e.target.value;
            updateChart();
        });

        document.getElementById('targetCurrency').addEventListener('change', (e) => {
            config.currencies.toCurrency = e.target.value;
            updateChart();
        });
    }

    function updateChart() {
        const data = generateDemoData(config.timeRange === '1D' ? 1 : 7);
        createChart(data);
        updateStatistics(data);
    }

    // Initialisation
    function initialize() {
        setupEventListeners();
        const initialData = generateDemoData(1);
        createChart(initialData);
        updateStatistics(initialData);
    }

    initialize();
});