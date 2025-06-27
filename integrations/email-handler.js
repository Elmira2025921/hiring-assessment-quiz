// Simple email collection using Formspree
async function submitToEmailService(formData) {
    // Your actual Formspree endpoint
    const formspreeEndpoint = 'https://formspree.io/f/xpwrkdka';
    
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
HIRING ASSESSMENT QUIZ RESULTS

Contact Information:
- Email: ${formData.email}
- Submission Date: ${new Date(formData.timestamp).toLocaleString()}

Quiz Results:
- Score: ${formData.score} out of ${formData.maxScore} points
- Percentage: ${formData.percentage}%
- Category: ${formData.category?.type || 'Unknown'}
- Time Spent: ${Math.round(formData.timeSpent / 1000)} seconds

Detailed Answers:
${Object.entries(formData.answers).map(([questionNum, answer]) => 
    `Question ${questionNum}: ${answer.text}`
).join('\n')}

Recommendations Category: ${formData.category?.type}
- ${formData.category?.title}
- ${formData.category?.description}

Technical Details:
- Source: ${formData.source}
- User Agent: ${formData.userAgent.substring(0, 50)}...
- Referrer: ${formData.referrer}
                `,
                // Additional structured fields for better organization
                quiz_score: formData.score,
                quiz_percentage: formData.percentage,
                quiz_category: formData.category?.type,
                time_spent_seconds: Math.round(formData.timeSpent / 1000)
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