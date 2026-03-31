document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        themeToggle: document.getElementById('theme-toggle'),
        moonIcon: document.getElementById('moon-icon'),
        sunIcon: document.getElementById('sun-icon'),
        textarea: document.getElementById('sentiment-text'),
        analyzeBtn: document.getElementById('analyze-btn'),
        btnText: document.querySelector('#analyze-btn span'),
        spinner: document.getElementById('loading-spinner'),
        resultSection: document.getElementById('result-section'),
        sentimentBadge: document.getElementById('sentiment-badge'),
        polarityScore: document.getElementById('polarity-score'),
        errorContainer: document.getElementById('error-message'),
        errorText: document.getElementById('error-text'),
        requestCount: document.getElementById('request-count')
    };

    // State
    let requestCounter = 1204;

    // Theme Toggle Logic
    const toggleTheme = () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            elements.moonIcon.classList.remove('hidden');
            elements.sunIcon.classList.add('hidden');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            elements.moonIcon.classList.add('hidden');
            elements.sunIcon.classList.remove('hidden');
            localStorage.setItem('theme', 'dark');
        }
    };

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.setAttribute('data-theme', 'dark');
        elements.moonIcon.classList.add('hidden');
        elements.sunIcon.classList.remove('hidden');
    }

    elements.themeToggle.addEventListener('click', toggleTheme);

    // API Call Logic
    const analyzeText = async () => {
        const textToAnalyze = elements.textarea.value.trim();
        
        if (!textToAnalyze) {
            showError('Please enter some text to analyze.');
            return;
        }

        // UI Loading State
        setLoading(true);
        hideError();
        hideResults();

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: textToAnalyze })
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const data = await response.json();
            
            // Expected JSON: { sentiment: "Positive", score: 0.75 }
            
            // Update UI with results
            displayResults(data.sentiment, data.score);
            
            // Increment mock request counter
            requestCounter++;
            elements.requestCount.textContent = requestCounter.toLocaleString();

        } catch (error) {
            console.error('API Error:', error);
            showError('Failed to connect to the backend API. Ensure FastAPI is running on http://127.0.0.1:8000.');
        } finally {
            setLoading(false);
        }
    };

    // UI Helpers
    const setLoading = (isLoading) => {
        elements.analyzeBtn.disabled = isLoading;
        if (isLoading) {
            elements.spinner.classList.remove('hidden');
            elements.btnText.textContent = 'Analyzing...';
        } else {
            elements.spinner.classList.add('hidden');
            elements.btnText.textContent = 'Analyze Sentiment';
        }
    };

    const showError = (message) => {
        elements.errorText.textContent = message;
        elements.errorContainer.classList.remove('hidden');
    };

    const hideError = () => {
        elements.errorContainer.classList.add('hidden');
    };

    const hideResults = () => {
        elements.resultSection.classList.add('hidden');
        // Reset classes
        elements.sentimentBadge.className = 'sentiment-badge';
    };

    const displayResults = (sentiment, polarity) => {
        // Reset classes
        elements.sentimentBadge.className = 'sentiment-badge';
        
        // Add specific color class
        const sentimentLower = sentiment.toLowerCase();
        if (sentimentLower.includes('positive')) {
            elements.sentimentBadge.classList.add('sentiment-positive');
        } else if (sentimentLower.includes('negative')) {
            elements.sentimentBadge.classList.add('sentiment-negative');
        } else {
            elements.sentimentBadge.classList.add('sentiment-neutral');
        }

        // Set text values
        elements.sentimentBadge.textContent = sentiment;
        
        // Format polarity to 2 decimal places if it's a number
        const formattedPolarity = typeof polarity === 'number' ? polarity.toFixed(2) : polarity;
        elements.polarityScore.textContent = formattedPolarity;

        // Show section with fade-in
        elements.resultSection.classList.remove('hidden');
    };

    // Event Listeners
    elements.analyzeBtn.addEventListener('click', analyzeText);

    // Allow Ctrl+Enter key to submit
    elements.textarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            analyzeText();
        }
    });
});
