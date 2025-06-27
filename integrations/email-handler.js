// Simple email collection using Formspree
async function submitToEmailService(formData) {
    // Replace YOUR_FORMSPREE_ENDPOINT with your actual endpoint
    const formspreeEndpoint = 'https://formspree.io/f/YOUR_FORMSPREE_ENDPOINT';
    
    try {
        const response = await fetch(formspreeEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.email,
                subject: 'New Quiz Completion - Hiring Assessment',
                message: `
Quiz Results:
- Email: ${formData.email}
- Score: ${formData.score}/${formData.maxScore} (${formData.percentage}%)
- Category: ${formData.category?.type || 'Unknown'}
- Time Spent: ${Math.round(formData.timeSpent / 1000)} seconds

Answers:
${Object.entries(formData.answers).map(([q, a]) => 
    `Question ${q}: ${a.text} (${a.answer})`
).join('\n')}

Timestamp: ${formData.timestamp}
                `
            })
        });
        
        if (response.ok) {
            console.log('Email sent successfully via Formspree');
            return true;
        } else {
            console.error('Formspree submission failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Email submission error:', error);
        return false;
    }
}

// Make it available globally
window.submitToEmailService = submitToEmailService;