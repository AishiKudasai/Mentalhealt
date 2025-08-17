// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('show');
            // Toggle aria-expanded attribute
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            this.setAttribute('aria-label', isExpanded ? 'Open menu' : 'Close menu');
        });
        
        // Close mobile menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('show');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
                mobileMenuButton.setAttribute('aria-label', 'Open menu');
            });
        });
    }

    // Accordion functionality
    const accordions = document.querySelectorAll('.accordion');
    accordions.forEach(accordion => {
        const header = accordion.querySelector('.accordion-header');
        const toggle = accordion.querySelector('.accordion-toggle');
        
        header.addEventListener('click', () => {
            accordion.classList.toggle('active');
            
            if (accordion.classList.contains('active')) {
                toggle.textContent = '-';
            } else {
                toggle.textContent = '+';
            }
        });
    });

    // Mood tracker functionality
    const moodButtons = document.querySelectorAll('#mood-scale button');
    let selectedMood = null;
    let moodChartInstance = null; // To store the Chart.js instance

    moodButtons.forEach(button => {
        // Click event for mouse users
        button.addEventListener('click', function() {
            selectMood(this);
        });
        
        // Touch feedback for mobile users
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
        });
        
        // Keyboard accessibility
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectMood(this);
            }
        });
    });
    
    function selectMood(button) {
        moodButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        selectedMood = button.getAttribute('data-value');
    }
    
    // Mood submission
    const submitButton = document.getElementById('submit-mood');    
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            if (!selectedMood) {
                alert('Please select your mood first');
                return;
            }
            
            const note = document.getElementById('mood-note').value;
            const date = new Date().toLocaleDateString();
            
            // Save to localStorage
            let entries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
            entries.push({
                date: date,
                mood: selectedMood,
                note: note
            });
            localStorage.setItem('moodEntries', JSON.stringify(entries));
            
            // Show success message
            const successMessage = document.getElementById('success-message');
            if (successMessage) {
                successMessage.classList.remove('hidden');
                setTimeout(() => {
                    successMessage.classList.add('hidden');
                }, 3000);
            }
            
            // Reset form
            moodButtons.forEach(btn => btn.classList.remove('active'));
            document.getElementById('mood-note').value = '';
            selectedMood = null;

            // If history is open, refresh it
            const historySection = document.getElementById('mood-history');
            if (!historySection.classList.contains('hidden')) {
                renderMoodHistory();
            }
        });
    }
    
    // View history
    const viewHistoryButton = document.getElementById('view-history');
    if (viewHistoryButton) {
        viewHistoryButton.addEventListener('click', function() {
            const historySection = document.getElementById('mood-history');
            
            if (historySection.classList.contains('hidden')) {
                // Show history
                historySection.classList.remove('hidden');
                this.textContent = 'Hide History';
                renderMoodHistory();
            } else {
                // Hide history
                historySection.classList.add('hidden');
                this.textContent = 'View History';
                if (moodChartInstance) {
                    moodChartInstance.destroy(); // Destroy chart when hiding
                }
            }
        });
    }

    function renderMoodHistory() {
        const entriesContainer = document.getElementById('history-entries');
        let entries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
        
        // Clear previous entries
        entriesContainer.innerHTML = '';
        
        if (entries.length === 0) {
            entriesContainer.innerHTML = '<p class="text-sm text-gray-500">No entries yet. Start tracking your mood!</p>';
            if (moodChartInstance) {
                moodChartInstance.destroy(); // Destroy chart if no data
                moodChartInstance = null;
            }
            return;
        }
        
        // Add entries in reverse chronological order
        entries.slice().reverse().forEach(entry => { // Use slice() to avoid reversing original array
            const moods = {
                '1': ['Very sad', 'text-red-500', '😢'],
                '2': ['Sad', 'text-orange-500', '😞'],
                '3': ['Neutral', 'text-yellow-500', '😐'],
                '4': ['Happy', 'text-blue-500', '😊'],
                '5': ['Very happy', 'text-green-500', '😁']
            };
            
            const moodInfo = moods[entry.mood] || ['Unknown', 'text-gray-500', '❓'];
            
            const entryEl = document.createElement('div');
            entryEl.className = 'history-item p-2 border-b border-gray-200 last:border-b-0';
            entryEl.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-800">${entry.date}</span>
                    <div class="flex items-center">
                        <span class="mr-2 text-sm capitalize ${moodInfo[1]}">${moodInfo[0]}</span>
                        <span class="text-lg">${moodInfo[2]}</span>
                    </div>
                </div>
                ${entry.note ? `<p class="text-xs text-gray-600 mt-1 italic">${entry.note}</p>` : ''}
            `;
            entriesContainer.appendChild(entryEl);
        });
        
        // Render Chart.js chart
        renderChartJsHistory(entries);
    }
    
    function renderChartJsHistory(entries) {
        const ctx = document.getElementById('moodChart').getContext('2d');
        
        // Destroy existing chart instance if it exists
        if (moodChartInstance) {
            moodChartInstance.destroy();
        }

        // Limit to last 7 entries for display in chart
        const recentEntries = entries.slice(-7); // Get last 7 entries
        
        const labels = recentEntries.map(entry => formatDateLabel(entry.date));
        const data = recentEntries.map(entry => parseInt(entry.mood));
        const backgroundColors = recentEntries.map(entry => getMoodColor(entry.mood));
        const borderColors = recentEntries.map(entry => getMoodColor(entry.mood));

        moodChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Mood Level',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3, // Smooth the line
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const moodLabels = {1: 'Very Sad', 2: 'Sad', 3: 'Neutral', 4: 'Happy', 5: 'Very Happy'};
                                return moodLabels[value] || '';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Mood Scale'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const moodLabels = {1: 'Very Sad', 2: 'Sad', 3: 'Neutral', 4: 'Happy', 5: 'Very Happy'};
                                return `Mood: ${moodLabels[context.raw] || context.raw}`;
                            },
                            title: function(context) {
                                return context[0].label; // Display date as title
                            }
                        }
                    }
                }
            }
        });
    }
    
    function getMoodColor(moodValue) {
        switch(moodValue) {
            case '1': return 'rgba(239, 68, 68, 0.8)'; // Red-500
            case '2': return 'rgba(249, 115, 22, 0.8)'; // Orange-500
            case '3': return 'rgba(234, 179, 8, 0.8)'; // Yellow-500
            case '4': return 'rgba(59, 130, 246, 0.8)'; // Blue-500
            case '5': return 'rgba(34, 197, 94, 0.8)'; // Green-500
            default: return 'rgba(156, 163, 175, 0.8)'; // Gray-500
        }
    }
    
    function formatDateLabel(dateString) {
        // Convert date string to shortened format (e.g., "MM/DD")
        const date = new Date(dateString);
        if (isNaN(date)) {
            const parts = dateString.split('/');
            if (parts.length >= 2) {
                return `${parts[0]}/${parts[1]}`;
            }
            return dateString;
        }
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    
    // Quote generator
    const quotes = [
    {
        text: "Mental health...is not a destination, but a process. It's about how you drive, not where you're going.",
        author: "Noam Shpancer"
    },
    {
        text: "You don't have to control your thoughts. You just have to stop letting them control you.",
        author: "Dan Millman"
    },
    {
        text: "Self-care is how you take your power back.",
        author: "Lalah Delia"
    },
    {
        text: "It's okay to not be okay. What's not okay is staying that way.",
        author: "Unknown"
    },
    {
        text: "Healing takes time, and asking for help is a courageous step.",
        author: "Mariska Hargitay"
    },
    {
        text: "What mental health needs is more sunlight, more candor, and more unashamed conversation.",
        author: "Glenn Close"
    },
    {
        text: "You are not your illness. You have an individual story to tell. You have a name, a history, a personality. Staying yourself is part of the battle.",
        author: "Julian Seifter"
    },
    {
        text: "There is hope, even when your brain tells you there isn’t.",
        author: "John Green"
    },
    {
        text: "Your mental health is a priority. Your happiness is an essential. Your self-care is a necessity.",
        author: "Unknown"
    },
    {
        text: "Sometimes the people around you won’t understand your journey. They don’t need to, it’s not for them.",
        author: "Joubert Botha"
    },
    {
        text: "You, yourself, as much as anybody in the entire universe, deserve your love and affection.",
        author: "Buddha"
    },
    {
        text: "Not all wounds are visible. Be kind always.",
        author: "Unknown"
    },
    {
        text: "Taking care of your mental and physical health is just as important as any career move or responsibility.",
        author: "Mireille Guiliano"
    },
    {
        text: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.",
        author: "J.K. Rowling (via Dumbledore)"
    },
    {
        text: "You don't have to have it all figured out to move forward.",
        author: "Unknown"
    },
    {
        text: "To be human is to have flaws, because nobody is perfect. Being flawless may seem too good to be true. Always remember, your imperfections make you perfect.",
        author: "Joanna Angelica"
    }
];

    
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    const newQuoteButton = document.getElementById('new-quote');

    if (newQuoteButton) {
        newQuoteButton.addEventListener('click', function () {
            // Add fade-out
            quoteText.classList.add('fade-out');
            quoteAuthor.classList.add('fade-out');

            setTimeout(() => {
                // Change quote after fade-out
                const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                quoteText.textContent = `"${randomQuote.text}"`;
                quoteAuthor.textContent = `— ${randomQuote.author}`;

                // Trigger fade-in
                quoteText.classList.remove('fade-out');
                quoteAuthor.classList.remove('fade-out');
                quoteText.classList.add('fade-in');
                quoteAuthor.classList.add('fade-in');

                // Remove fade-in after it's done (clean-up)
                setTimeout(() => {
                    quoteText.classList.remove('fade-in');
                    quoteAuthor.classList.remove('fade-in');
                }, 400);
            }, 400); // Match transition duration
        });
    }

    // Initialize EmailJS
document.addEventListener('DOMContentLoaded', function() {
    emailjs.init("OUWs5PjrB1JwuYO9O"); // Your public key
});

const newsletterForm = document.getElementById('newsletter-form');
const newsletterEmailInput = document.getElementById('newsletter-email');
const newsletterMessageDiv = document.getElementById('newsletter-message');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = newsletterEmailInput.value.trim();

        // Reset message
        newsletterMessageDiv.className = 'mt-2 text-sm p-2 rounded border-l-4';
        newsletterMessageDiv.classList.remove('hidden');

        // Validate email (general format)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showNewsletterMessage('Please enter a valid email address', 'error');
            return;
        }

        showNewsletterMessage('Subscribing...', 'info');

        try {
            const response = await emailjs.send(
                "service_bkrlmp8",   // Your EmailJS service ID
                "template_jkxuxt6", // Your EmailJS template ID
                { user_email: email } // The variable in your template
            );

            if (response.status === 200) {
                showNewsletterMessage(`Subscribed successfully! A confirmation email was sent to ${email}`, 'success');
                newsletterEmailInput.value = ''; // Clear the input field
            } else {
                throw new Error('Failed to send email');
            }
        } catch (error) {
            console.error('EmailJS Error:', error);
            showNewsletterMessage('Subscription failed. Please try again later.', 'error');
        }
    });
}

function showNewsletterMessage(message, type = 'success') {
    const colors = {
        success: 'bg-green-100 border-green-500 text-green-700',
        error: 'bg-red-100 border-red-500 text-red-700',
        info: 'bg-blue-100 border-blue-500 text-blue-700'
    };

    newsletterMessageDiv.textContent = message;
    newsletterMessageDiv.className = `mt-2 text-sm p-2 rounded border-l-4 ${colors[type]}`;
}





    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offset = 80; // Adjust this value based on your header height
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update URL without page jump
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                } else {
                    window.location.hash = targetId;
                }
            }
        });
    });
    
    // Initialize with a random quote
    if (document.getElementById('quote-text') && document.getElementById('quote-author')) {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        document.getElementById('quote-text').textContent = `"${randomQuote.text}"`;
        document.getElementById('quote-author').textContent = `— ${randomQuote.author}`;
    }
});




