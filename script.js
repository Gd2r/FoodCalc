document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        preset: document.getElementById('preset'),
        grams: document.getElementById('grams'),
        food: document.getElementById('food'),
        protein: document.getElementById('protein'),
        calories: document.getElementById('calories'),
        addBtn: document.getElementById('add-btn'),
        foodList: document.getElementById('food-items'),
        totalProtein: document.getElementById('total-protein'),
        totalCalories: document.getElementById('total-calories'),
        themeToggle: document.getElementById('theme-toggle'),
        body: document.body
    };

    // Application State
    let state = {
        totalProtein: 0,
        totalCalories: 0,
        currentPreset: null,
        entries: [],
        darkMode: localStorage.getItem('darkMode') === 'true'
    };

    // Initialize Application
    function initializeApp() {
        setupEventListeners();
        initTheme();
        loadExistingEntries();
    }

    // Event Listeners Setup
    function setupEventListeners() {
        elements.preset.addEventListener('change', handlePresetChange);
        elements.grams.addEventListener('input', handleAmountChange);
        elements.addBtn.addEventListener('click', addFoodEntry);
        elements.foodList.addEventListener('click', handleListClick);
        elements.themeToggle.addEventListener('click', toggleTheme);
    }

    // Theme Management
    function initTheme() {
        if (state.darkMode) {
            elements.body.setAttribute('data-theme', 'dark');
            elements.themeToggle.textContent = '☀️';
        } else {
            elements.body.removeAttribute('data-theme');
            elements.themeToggle.textContent = '🌙';
        }
    }

    function toggleTheme() {
        state.darkMode = !state.darkMode;
        localStorage.setItem('darkMode', state.darkMode);
        initTheme();
    }

    // Preset Handling
    function handlePresetChange() {
        const selected = elements.preset.options[elements.preset.selectedIndex];
        
        if (selected.value === "") {
            enableCustomInputs();
            state.currentPreset = null;
            return;
        }

        disableCustomInputs();
        state.currentPreset = {
            name: selected.text.split(' (')[0],
            protein: parseFloat(selected.dataset.protein),
            calories: parseFloat(selected.dataset.calories)
        };

        elements.food.value = sanitizeInput(state.currentPreset.name);
        if (elements.grams.value) updateCalculations();
    }

    function enableCustomInputs() {
        elements.protein.readOnly = false;
        elements.calories.readOnly = false;
        elements.food.value = '';
    }

    function disableCustomInputs() {
        elements.protein.readOnly = true;
        elements.calories.readOnly = true;
    }

    // Calculations
    function updateCalculations() {
        if (!state.currentPreset) return;
        
        const amount = parseFloat(elements.grams.value) || 0;
        
        switch(elements.preset.value) {
            case 'usual_milkshake':
                elements.protein.value = (57 * amount).toFixed(2);
                elements.calories.value = (505 * amount).toFixed(2);
                break;
            default:
                elements.protein.value = (amount * state.currentPreset.protein).toFixed(2);
                elements.calories.value = (amount * state.currentPreset.calories).toFixed(2);
        }
    }

    // Input Handlers
    function handleAmountChange() {
        if (validateNumber(elements.grams.value)) {
            updateCalculations();
        }
    }

    // Entry Management
    function addFoodEntry() {
        const entry = createEntryObject();
        
        if (!validateEntry(entry)) {
            showError('Please fill all fields with valid values');
            return;
        }

        storeEntry(entry);
        updateUI(entry);
        resetForm();
    }

    function createEntryObject() {
        return {
            id: Date.now(),
            name: sanitizeInput(elements.food.value),
            amount: parseFloat(elements.grams.value),
            protein: parseFloat(elements.protein.value),
            calories: parseFloat(elements.calories.value),
            timestamp: new Date().toISOString()
        };
    }

    function storeEntry(entry) {
        state.entries.push(entry);
        state.totalProtein += entry.protein;
        state.totalCalories += entry.calories;
        localStorage.setItem('nutritionEntries', JSON.stringify(state.entries));
    }

    function updateUI(entry) {
        elements.totalProtein.textContent = state.totalProtein.toFixed(2);
        elements.totalCalories.textContent = state.totalCalories.toFixed(2);
        renderEntry(entry);
    }

    function renderEntry(entry) {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="entry-content">
                <strong>${entry.name}</strong>
                <span class="entry-details">
                    ${entry.amount} units · 
                    ${entry.protein.toFixed(2)}g protein · 
                    ${entry.calories.toFixed(2)}kcal
                </span>
            </div>
            <button class="delete-btn" 
                    data-protein="${entry.protein}" 
                    data-calories="${entry.calories}">×</button>
        `;
        elements.foodList.appendChild(li);
    }

    // Delete Entry Handler
    function handleListClick(event) {
        if (event.target.classList.contains('delete-btn')) {
            const entryElement = event.target.closest('li');
            const protein = parseFloat(event.target.dataset.protein);
            const calories = parseFloat(event.target.dataset.calories);
            
            updateTotalsOnDelete(protein, calories);
            removeEntryFromDOM(entryElement);
            removeEntryFromState(protein, calories);
        }
    }

    function updateTotalsOnDelete(protein, calories) {
        state.totalProtein -= protein;
        state.totalCalories -= calories;
        elements.totalProtein.textContent = state.totalProtein.toFixed(2);
        elements.totalCalories.textContent = state.totalCalories.toFixed(2);
    }

    function removeEntryFromDOM(element) {
        element.remove();
    }

    function removeEntryFromState(protein, calories) {
        state.entries = state.entries.filter(entry => 
            entry.protein !== protein || entry.calories !== calories
        );
        localStorage.setItem('nutritionEntries', JSON.stringify(state.entries));
    }

    // Validation Utilities
    function validateNumber(value, min = 0, max = 10000) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    }

    function validateEntry(entry) {
        return entry.name &&
               validateNumber(entry.amount) &&
               validateNumber(entry.protein) &&
               validateNumber(entry.calories);
    }

    function sanitizeInput(value, maxLength = 30) {
        return value.toString()
            .slice(0, maxLength)
            .replace(/[<>]/g, '');
    }

    // Form Management
    function resetForm() {
        elements.preset.value = '';
        elements.grams.value = '';
        elements.food.value = '';
        elements.protein.value = '';
        elements.calories.value = '';
        state.currentPreset = null;
        enableCustomInputs();
    }

    // Error Handling
    function showError(message) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        error.style.color = 'var(--danger-color)';
        error.style.marginTop = '0.5rem';
        elements.inputSection.appendChild(error);
        
        setTimeout(() => error.remove(), 3000);
    }

    // Persistence
    function loadExistingEntries() {
        const savedEntries = JSON.parse(localStorage.getItem('nutritionEntries')) || [];
        state.entries = savedEntries;
        state.totalProtein = savedEntries.reduce((sum, entry) => sum + entry.protein, 0);
        state.totalCalories = savedEntries.reduce((sum, entry) => sum + entry.calories, 0);
        
        elements.totalProtein.textContent = state.totalProtein.toFixed(2);
        elements.totalCalories.textContent = state.totalCalories.toFixed(2);
        
        savedEntries.forEach(entry => renderEntry(entry));
    }

    // Initialize the application
    initializeApp();
});