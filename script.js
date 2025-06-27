
/**
 * ===================================
 * HIRING ASSESSMENT QUIZ JAVASCRIPT
 * HireVirtuals - Email-Only Version
 * ===================================
 */

// ===================================
// GLOBAL VARIABLES & CONFIGURATION
// ===================================

let currentQuestion = 1;
let totalScore = 0;
let answers = {};
let startTime = Date.now();
let questionStartTime = Date.now();
let timeSpentPerQuestion = {};

// Configuration
const CONFIG = {
    totalQuestions: 8,
    maxScore: 32, // Maximum possible score
    analytics: {
        enabled: false, // Disabled for simplicity
        trackQuestionTime: true,
        trackScrollDepth: false // Disabled
    },
    integrations: {
        email: {
            enabled: true,
            provider: 'formspree' // or custom
        }
    },
    ui: {
        animationDuration: 300,
        progressAnimationDuration: 500,
        autoSaveProgress: true
    }
};

// Result categories and scoring
const RESULT_CATEGORIES = {
    humanFirst: {
        minScore: 0,
        maxScore: 35,
        type: "Human-First Hiring Champion",
        title: "Excellent! Your hiring is refreshingly personal",
        description: "You're already doing what most companies have forgotten - treating hiring as a human process.",
        color: "#10b981"
    },
    balanced: {
        minScore: 36,
        maxScore: 60,
        type: "Balanced Approach (With Room to Improve)",
        title: "Good balance, but automation may be costing you",
        description: "You blend human and automated elements, but the personal touch could use strengthening.",
        color: "#f59e0b"
    },
    overAutomated: {
        minScore: 61,
        maxScore: 100,
        type: "Over-Automated (High Risk)",
        title: "Warning: Automation is likely costing you great hires",
        description: "Your process is heavily automated, which probably means you're missing excellent candidates who don't fit algorithmic patterns.",
        color: "#ef4444"
    }
};

// ===================================
// INITIALIZATION & EVENT LISTENERS
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    initializeQuiz();
    setupEventListeners();
    loadSavedProgress();
    trackPageView();
});

/**
 * Initialize quiz functionality
 */
function initializeQuiz() {
    try {
        updateProgress();
        setupKeyboardNavigation();
        setupFormValidation();
        preloadNextQuestion();
        
        // Set initial question start time
        questionStartTime = Date.now();
        
        console.log('Quiz initialized successfully');
    } catch (error) {
        console.error('Error initializing quiz:', error);
        showErrorMessage('Failed to initialize quiz. Please refresh the page.');
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Option click handlers
    document.querySelectorAll('.option').forEach((option, index) => {
        const questionContainer = option.closest('.question-container');
        const questionNum = parseInt(questionContainer.getAttribute('data-question'));
        
        option.addEventListener('click', function() {
            selectOption(this, questionNum);
        });
        
        // Keyboard support
        option.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectOption(this, questionNum);
            }
        });
        
        // Make focusable
        option.setAttribute('tabindex', '0');
    });
    
    // Email form validation
    const emailInput = document.getElementById('emailInput');
    if (emailInput) {
        emailInput.addEventListener('input', validateEmailInput);
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitEmail();
            }
        });
    }
    
    // Auto-save progress
    if (CONFIG.ui.autoSaveProgress) {
        setInterval(saveProgress, 10000); // Save every 10 seconds
    }
}

// ===================================
// QUIZ NAVIGATION FUNCTIONS
// ===================================

/**
 * Handle option selection
 */
function selectOption(element, questionNum) {
    try {
        // Track question completion time
        if (CONFIG.analytics.trackQuestionTime) {
            const timeSpent = Date.now() - questionStartTime;
            timeSpentPerQuestion[questionNum] = timeSpent;
            trackQuestionTime(questionNum, timeSpent);
        }
        
        // Remove selection from other options
        const allOptions = element.parentElement.querySelectorAll('.option');
        allOptions.forEach(opt => {
            opt.classList.remove('selected');
            opt.setAttribute('aria-selected', 'false');
        });
        
        // Select this option
        element.classList.add('selected');
        element.setAttribute('aria-selected', 'true');
        
        // Store answer
        const value = parseInt(element.getAttribute('data-value'));
        const answer = element.getAttribute('data-answer');
        
        // If this question was previously answered, subtract old score
        if (answers[questionNum]) {
            totalScore -= answers[questionNum].value;
        }
        
        answers[questionNum] = { 
            value, 
            answer, 
            text: element.querySelector('.option-text').textContent,
            timestamp: new Date().toISOString()
        };
        totalScore += value;
        
        // Enable next button
        const nextBtn = document.getElementById('nextBtn' + (questionNum > 1 ? questionNum : ''));
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.classList.remove('btn-disabled');
        }
        
        // Track analytics
        trackQuizEvent('question_answered', questionNum, answer);
        
        console.log(`Question ${questionNum} answered:`, answers[questionNum]);
        
    } catch (error) {
        console.error('Error selecting option:', error);
        showErrorMessage('Error recording your answer. Please try again.');
    }
}

/**
 * Navigate to next question
 */
function nextQuestion() {
    try {
        if (currentQuestion < CONFIG.totalQuestions) {
            // Hide current question
            const currentQuestionEl = document.querySelector(`[data-question="${currentQuestion}"]`);
            currentQuestionEl.classList.remove('active');
            
            currentQuestion++;
            questionStartTime = Date.now(); // Reset timer for new question
            
            // Show next question with animation
            const nextQuestionEl = document.querySelector(`[data-question="${currentQuestion}"]`);
            setTimeout(() => {
                nextQuestionEl.classList.add('active');
                focusOnQuestion(currentQuestion);
            }, CONFIG.ui.animationDuration);
            
            updateProgress();
            preloadNextQuestion();
            saveProgress();
            
            // Track analytics
            trackQuizEvent('question_navigation', currentQuestion, 'next');
        }
    } catch (error) {
        console.error('Error navigating to next question:', error);
        showErrorMessage('Error loading next question. Please try again.');
    }
}

/**
 * Navigate to previous question
 */
function prevQuestion() {
    try {
        if (currentQuestion > 1) {
            // Hide current question
            const currentQuestionEl = document.querySelector(`[data-question="${currentQuestion}"]`);
            currentQuestionEl.classList.remove('active');
            
            currentQuestion--;
            questionStartTime = Date.now(); // Reset timer
            
            // Show previous question with animation
            const prevQuestionEl = document.querySelector(`[data-question="${currentQuestion}"]`);
            setTimeout(() => {
                prevQuestionEl.classList.add('active');
                focusOnQuestion(currentQuestion);
            }, CONFIG.ui.animationDuration);
            
            updateProgress();
            
            // Track analytics
            trackQuizEvent('question_navigation', currentQuestion, 'previous');
        }
    } catch (error) {
        console.error('Error navigating to previous question:', error);
        showErrorMessage('Error loading previous question. Please try again.');
    }
}

/**
 * Update progress bar
 */
function updateProgress() {
    try {
        const progress = ((currentQuestion - 1) / CONFIG.totalQuestions) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        
        // Update progress in local storage
        localStorage.setItem('quiz_progress', JSON.stringify({
            currentQuestion,
            totalScore,
            answers,
            timestamp: Date.now()
        }));
        
    } catch (error) {
        console.error('Error updating progress:', error);
    }
}

// ===================================
// RESULTS CALCULATION & DISPLAY
// ===================================

/**
 * Show quiz results
 */
function showResults() {
    try {
        // Hide all questions
        document.querySelectorAll('.question-container').forEach(q => q.style.display = 'none');
        
        // Calculate results
        const results = calculateResults();
        
        // Display results
        displayResults(results);
        
        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'block';
        
        // Update progress to 100%
        document.getElementById('progressFill').style.width = '100%';
        
        // Track completion
        const completionTime = Date.now() - startTime;
        trackQuizCompletion(results, completionTime);
        
        // Focus on results for accessibility
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        resultsSection.focus();
        
        console.log('Quiz completed:', results);
        
    } catch (error) {
        console.error('Error showing results:', error);
        showErrorMessage('Error calculating results. Please try again.');
    }
}

/**
 * Calculate quiz results
 */
function calculateResults() {
    const percentage = Math.round((totalScore / CONFIG.maxScore) * 100);
    
    // Determine result category
    let category;
    for (const [key, cat] of Object.entries(RESULT_CATEGORIES)) {
        if (percentage >= cat.minScore && percentage <= cat.maxScore) {
            category = cat;
            break;
        }
    }
    
    // Generate recommendations based on score
    const recommendations = generateRecommendations(percentage, answers);
    
    return {
        score: totalScore,
        percentage,
        category,
        recommendations,
        answers: answers,
        timeSpent: Date.now() - startTime,
        questionTimes: timeSpentPerQuestion
    };
}

/**
 * Display results on page
 */
function displayResults(results) {
    try {
        // Update score display
        document.getElementById('scoreDisplay').textContent = results.percentage + '%';
        document.getElementById('resultTitle').textContent = results.category.title;
        document.getElementById('resultDescription').textContent = results.category.description;
        
        // Update results header color based on category
        const resultsHeader = document.querySelector('.results-header');
        resultsHeader.style.background = `linear-gradient(135deg, ${results.category.color} 0%, ${adjustColor(results.category.color, -20)} 100%)`;
        
        // Display recommendations
        const recList = document.getElementById('recommendationsList');
        recList.innerHTML = results.recommendations.map(rec => `
            <div class="recommendation">
                <div class="recommendation-title">
                    <span style="font-size: 20px;">${rec.icon}</span>
                    ${rec.title}
                </div>
                <div class="recommendation-text">${rec.text}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error displaying results:', error);
        showErrorMessage('Error displaying results. Please refresh the page.');
    }
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(percentage, answers) {
    let recommendations = [];
    
    if (percentage <= 35) {
        // Human-First Champions
        recommendations = [
            {
                icon: "🎯",
                title: "Keep Your Personal Touch",
                text: "Your approach to personal conversations and relationship-building is exactly what creates lasting hires. This human-first method is becoming increasingly rare and valuable."
            },
            {
                icon: "📈",
                title: "Scale Your Success",
                text: "Consider partnering with services that share your human-first philosophy to handle more volume without losing the personal touch that makes you successful."
            },
            {
                icon: "🔍",
                title: "Share Your Approach",
                text: "Your method could serve as a model for other companies struggling with automated hiring. Consider documenting your process for others."
            }
        ];
    } else if (percentage <= 60) {
        // Balanced Approach
        recommendations = [
            {
                icon: "👥",
                title: "Increase Personal Interaction",
                text: "Add more conversation time with candidates before making decisions. Even 15-minute phone calls can reveal personality traits that resumes never show."
            },
            {
                icon: "🎯",
                title: "Focus on Cultural Fit",
                text: "Develop deeper assessment methods for personality and culture alignment. Ask questions about work style, values, and long-term goals."
            },
            {
                icon: "🔄",
                title: "Review Your Filters",
                text: "Ensure automated screening isn't eliminating great candidates who don't fit keyword patterns but have the right mindset and attitude."
            }
        ];
    } else {
        // Over-Automated
        recommendations = [
            {
                icon: "🚨",
                title: "Urgent: Add Human Touch",
                text: "Start having personal conversations with candidates before making screening decisions. AI can't assess personality, cultural fit, or genuine enthusiasm."
            },
            {
                icon: "📞",
                title: "Implement Phone Screenings",
                text: "Brief calls can reveal personality and fit that resumes never show. Look for communication skills, enthusiasm, and cultural alignment."
            },
            {
                icon: "🔄",
                title: "Redesign Your Process",
                text: "Consider working with human-first recruitment partners who understand your business personally and can find candidates who truly fit your culture."
            }
        ];
    }
    
    // Add specific recommendations based on individual answers
    if (answers[6] && answers[6].value >= 3) {
        recommendations.push({
            icon: "⚠️",
            title: "Address High Turnover",
            text: "Your hiring process may be missing key indicators of long-term success. Focus on cultural fit and genuine interest in your industry."
        });
    }
    
    return recommendations;
}

// ===================================
// EMAIL SUBMISSION & INTEGRATION
// ===================================

/**
 * Submit email and trigger integrations
 */
async function submitEmail() {
    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value.trim();
    
    // Validate email
    if (!isValidEmail(email)) {
        showValidationError(emailInput, 'Please enter a valid email address');
        return;
    }
    
    // Show loading state
    const submitBtn = emailInput.nextElementSibling;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    
    try {
        // Calculate current results
        const results = calculateResults();
        
        // Prepare submission data
        const submissionData = {
            email: email,
            score: totalScore,
            maxScore: CONFIG.maxScore,
            percentage: Math.round((totalScore / CONFIG.maxScore) * 100),
            answers: answers,
            timeSpent: Date.now() - startTime,
            questionTimes: timeSpentPerQuestion,
            category: results.category,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            source: 'hiring_assessment_quiz',
            referrer: document.referrer || 'direct'
        };
        
        // Submit to email service
        let emailSuccess = false;
        if (typeof window.submitToEmailService === 'function') {
            emailSuccess = await window.submitToEmailService(submissionData);
        } else {
            console.warn('Email service not configured');
            emailSuccess = true; // Proceed with success message
        }
        
        // Track email capture
        trackEmailCapture(email, submissionData.percentage);
        
        if (emailSuccess) {
            // Show success message
            showSuccessMessage('Thank you! The Business Owner\'s Guide to Recruitment Services will be sent to ' + email + ' within 24 hours.');
            
            // Hide email form and show thank you
            const emailForm = document.querySelector('.email-form');
            emailForm.style.display = 'none';
            
            // Show thank you message
            const thankYouDiv = document.createElement('div');
            thankYouDiv.innerHTML = `
                <div style="text-align: center; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; margin-top: 20px;">
                    <h4 style="color: #10b981; margin-bottom: 10px;">🎉 Thank You!</h4>
                    <p style="color: #059669; margin: 0;">Your guide will be sent to <strong>${email}</strong> within 24 hours.</p>
                </div>
            `;
            emailForm.parentElement.appendChild(thankYouDiv);
            
            // Optional: Scroll to thank you message
            thankYouDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
        } else {
            showErrorMessage('There was an error submitting your email. Please try again or contact us directly.');
        }
        
    } catch (error) {
        console.error('Error submitting email:', error);
        showErrorMessage('There was an error submitting your email. Please try again.');
    } finally {
        // Reset button state (only if form is still visible)
        if (submitBtn.style.display !== 'none') {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    }
}

/**
 * Validate email input in real-time
 */
function validateEmailInput(event) {
    const input = event.target;
    const email = input.value.trim();
    
    // Remove any previous error styling
    input.classList.remove('error');
    const existingError = input.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Real-time validation feedback
    if (email.length > 0 && !isValidEmail(email)) {
        input.classList.add('error');
    }
}

/**
 * Email validation function
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===================================
// SIMPLIFIED ANALYTICS & TRACKING
// ===================================

/**
 * Track page view
 */
function trackPageView() {
    console.log('Page viewed:', window.location.href);
}

/**
 * Track quiz events
 */
function trackQuizEvent(action, question_number, answer) {
    console.log('Quiz Event:', action, 'Question:', question_number, 'Answer:', answer);
}

/**
 * Track question completion time
 */
function trackQuestionTime(questionNumber, timeSpent) {
    console.log(`Question ${questionNumber} completed in ${timeSpent}ms`);
}

/**
 * Track email capture
 */
function trackEmailCapture(email, score) {
    console.log('Email captured:', email, 'Score:', score + '%');
}

/**
 * Track quiz completion
 */
function trackQuizCompletion(results, completionTime) {
    console.log('Quiz completed:', {
        category: results.category.type,
        score: results.percentage + '%',
        timeSpent: Math.round(completionTime / 1000) + ' seconds'
    });
}

// ===================================
// ACCESSIBILITY & UX HELPERS
// ===================================

/**
 * Setup keyboard navigation
 */
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Handle quiz navigation with arrow keys
        if (e.target.classList.contains('option')) {
            const options = Array.from(e.target.parentElement.querySelectorAll('.option'));
            const currentIndex = options.indexOf(e.target);
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextOption = options[currentIndex + 1] || options[0];
                    nextOption.focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const prevOption = options[currentIndex - 1] || options[options.length - 1];
                    prevOption.focus();
                    break;
            }
        }
        
        // Handle quiz navigation with keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    if (currentQuestion < CONFIG.totalQuestions) {
                        const nextBtn = document.querySelector('.btn-primary:not(:disabled)');
                        if (nextBtn) nextBtn.click();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (currentQuestion > 1) {
                        const prevBtn = document.querySelector('.btn-secondary');
                        if (prevBtn) prevBtn.click();
                    }
                    break;
            }
        }
    });
}

/**
 * Focus on specific question for accessibility
 */
function focusOnQuestion(questionNumber) {
    const questionEl = document.querySelector(`[data-question="${questionNumber}"]`);
    if (questionEl) {
        const questionText = questionEl.querySelector('.question-text');
        if (questionText) {
            questionText.focus();
            questionText.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

/**
 * Setup form validation
 */
function setupFormValidation() {
    // Add ARIA labels and validation attributes
    document.querySelectorAll('.option').forEach((option, index) => {
        option.setAttribute('role', 'radio');
        option.setAttribute('aria-describedby', 'question-description');
    });
    
    // Email input validation
    const emailInput = document.getElementById('emailInput');
    if (emailInput) {
        emailInput.setAttribute('aria-describedby', 'email-help');
        emailInput.setAttribute('required', 'true');
    }
}

// ===================================
// PROGRESS PERSISTENCE
// ===================================

/**
 * Save quiz progress to local storage
 */
function saveProgress() {
    try {
        const progressData = {
            currentQuestion,
            totalScore,
            answers,
            timeSpentPerQuestion,
            startTime,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        localStorage.setItem('hiring_quiz_progress', JSON.stringify(progressData));
    } catch (error) {
        console.warn('Could not save progress:', error);
    }
}

/**
 * Load saved progress from local storage
 */
function loadSavedProgress() {
    try {
        const saved = localStorage.getItem('hiring_quiz_progress');
        if (saved) {
            const progressData = JSON.parse(saved);
            
            // Check if saved data is recent (within 24 hours)
            const age = Date.now() - progressData.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (age < maxAge && progressData.version === '1.0') {
                // Restore progress
                currentQuestion = progressData.currentQuestion || 1;
                totalScore = progressData.totalScore || 0;
                answers = progressData.answers || {};
                timeSpentPerQuestion = progressData.timeSpentPerQuestion || {};
                startTime = progressData.startTime || Date.now();
                
                // Restore UI state
                restoreUIState();
                
                console.log('Progress restored from previous session');
            } else {
                // Clear old progress
                localStorage.removeItem('hiring_quiz_progress');
            }
        }
    } catch (error) {
        console.warn('Could not load saved progress:', error);
        localStorage.removeItem('hiring_quiz_progress');
    }
}

/**
 * Restore UI state from saved progress
 */
function restoreUIState() {
    // Hide all questions
    document.querySelectorAll('.question-container').forEach(q => q.classList.remove('active'));
    
    // Show current question
    const currentQuestionEl = document.querySelector(`[data-question="${currentQuestion}"]`);
    if (currentQuestionEl) {
        currentQuestionEl.classList.add('active');
    }
    
    // Restore selected options
    Object.keys(answers).forEach(questionNum => {
        const answer = answers[questionNum];
        const questionEl = document.querySelector(`[data-question="${questionNum}"]`);
        if (questionEl) {
            const options = questionEl.querySelectorAll('.option');
            options.forEach(option => {
                if (option.getAttribute('data-answer') === answer.answer) {
                    option.classList.add('selected');
                    option.setAttribute('aria-selected', 'true');
                }
            });
            
            // Enable next button if question is answered
            const nextBtn = document.getElementById('nextBtn' + (questionNum > 1 ? questionNum : ''));
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        }
    });
    
    // Update progress bar
    updateProgress();
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Throttle function for performance
 */
function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

/**
 * Debounce function for input validation
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Preload next question for better performance
 */
function preloadNextQuestion() {
    if (currentQuestion < CONFIG.totalQuestions) {
        const nextQuestionEl = document.querySelector(`[data-question="${currentQuestion + 1}"]`);
        if (nextQuestionEl) {
            // Preload any images or resources for next question
            const images = nextQuestionEl.querySelectorAll('img');
            images.forEach(img => {
                const tempImg = new Image();
                tempImg.src = img.src;
            });
        }
    }
}

/**
 * Adjust color brightness
 */
function adjustColor(color, amount) {
    const clamp = (val) => Math.min(Math.max(val, 0), 255);
    const fill = (str) => ('00' + str).slice(-2);
    
    const num = parseInt(color.replace("#", ""), 16);
    const red = clamp((num >> 16) + amount);
    const green = clamp(((num >> 8) & 0x00FF) + amount);
    const blue = clamp((num & 0x0000FF) + amount);
    
    return "#" + fill(red.toString(16)) + fill(green.toString(16)) + fill(blue.toString(16));
}

// ===================================
// ERROR HANDLING & MESSAGING
// ===================================

/**
 * Show error message to user
 */
function showErrorMessage(message) {
    const errorDiv = createMessageElement(message, 'error');
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

/**
 * Show success message to user
 */
function showSuccessMessage(message) {
    const successDiv = createMessageElement(message, 'success');
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

/**
 * Show validation error on specific input
 */
function showValidationError(inputElement, message) {
    inputElement.classList.add('error');
    
    // Remove existing error message
    const existingError = inputElement.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorSpan = document.createElement('span');
    errorSpan.className = 'error-message';
    errorSpan.textContent = message;
    errorSpan.style.color = '#ef4444';
    errorSpan.style.fontSize = '14px';
    errorSpan.style.marginTop = '4px';
    errorSpan.style.display = 'block';
    
    inputElement.parentElement.appendChild(errorSpan);
    
    // Focus on the input
    inputElement.focus();
}

/**
 * Create message element for notifications
 */
function createMessageElement(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    if (type === 'error') {
        messageDiv.style.backgroundColor = '#fef2f2';
        messageDiv.style.color = '#dc2626';
        messageDiv.style.border = '1px solid #fecaca';
    } else {
        messageDiv.style.backgroundColor = '#f0fdf4';
        messageDiv.style.color = '#16a34a';
        messageDiv.style.border = '1px solid #bbf7d0';
    }
    
    messageDiv.textContent = message;
    
    // Animate in
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(0)';
    }, 100);
    
    return messageDiv;
}

// ===================================
// EXPORT FOR EXTERNAL ACCESS
// ===================================

// Make key functions available globally for external integrations
window.HiringQuiz = {
    getResults: () => ({
        score: totalScore,
        percentage: Math.round((totalScore / CONFIG.maxScore) * 100),
        answers: answers,
        timeSpent: Date.now() - startTime
    }),
    getCurrentQuestion: () => currentQuestion,
    jumpToQuestion: (questionNum) => {
        if (questionNum >= 1 && questionNum <= CONFIG.totalQuestions) {
            document.querySelector(`[data-question="${currentQuestion}"]`).classList.remove('active');
            currentQuestion = questionNum;
            document.querySelector(`[data-question="${currentQuestion}"]`).classList.add('active');
            updateProgress();
        }
    },
    resetQuiz: () => {
        currentQuestion = 1;
        totalScore = 0;
        answers = {};
        timeSpentPerQuestion = {};
        startTime = Date.now();
        localStorage.removeItem('hiring_quiz_progress');
        location.reload();
    }
};

console.log('Hiring Assessment Quiz script loaded successfully (Email-only version)');

// ===================================
// END OF SCRIPT
// ===================================