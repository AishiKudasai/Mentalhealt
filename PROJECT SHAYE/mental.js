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

    // Mood tracker functionality
    const moodButtons = document.querySelectorAll('#mood-scale button');
    let selectedMood = null;
    
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
        });
    }
    
    // View history
    const viewHistoryButton = document.getElementById('view-history');
    if (viewHistoryButton) {
        viewHistoryButton.addEventListener('click', function() {
            const historySection = document.getElementById('mood-history');
            const entriesContainer = document.getElementById('history-entries');
            
            if (historySection.classList.contains('hidden')) {
                // Show history
                historySection.classList.remove('hidden');
                this.textContent = 'Hide History';
                
                let entries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
                
                // Clear previous entries
                entriesContainer.innerHTML = '';
                
                if (entries.length === 0) {
                    entriesContainer.innerHTML = '<p class="text-sm text-gray-500">No entries yet. Start tracking your mood!</p>';
                    return;
                }
                
                // Add entries in reverse chronological order
                entries.reverse().forEach(entry => {
                    const moods = {
                        '1': ['Very sad', 'text-red-500'],
                        '2': ['Sad', 'text-orange-500'],
                        '3': ['Neutral', 'text-yellow-500'],
                        '4': ['Happy', 'text-blue-500'],
                        '5': ['Very happy', 'text-green-500']
                    };
                    
                    const entryEl = document.createElement('div');
                    entryEl.className = 'history-item';
                    entryEl.innerHTML = `
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium">${entry.date}</span>
                            <div class="flex items-center">
                                <span class="mr-2 text-sm capitalize">${moods[entry.mood][0]}</span>
                                <span class="${moods[entry.mood][1]}">
                                    ${getMoodIcon(entry.mood)}
                                </span>
                            </div>
                        </div>
                        ${entry.note ? `<p class="text-xs text-gray-700 mt-1">${entry.note}</p>` : ''}
                    `;
                    entriesContainer.appendChild(entryEl);
                });
                
                // Render simple chart
                renderHistoryChart(entries);
            } else {
                // Hide history
                historySection.classList.add('hidden');
                this.textContent = 'View History';
            }
        });
    }
    
    function getMoodIcon(moodValue) {
        switch(moodValue) {
            case '1': return '😢';
            case '2': return '😞';
            case '3': return '😐';
            case '4': return '😊';
            case '5': return '😁';
            default: return '';
        }
    }
    
    function renderHistoryChart(entries) {
        const chartContainer = document.getElementById('history-chart');
        chartContainer.innerHTML = '';
        
        // Limit to last 7 entries for display
        const recentEntries = entries.slice(0, 7).reverse();
        
        const chart = document.createElement('div');
        chart.className = 'flex items-end justify-between h-full gap-1';
        
        // Find max value for scaling
        const maxValue = 5; // Since mood scale is 1-5
        
        recentEntries.forEach(entry => {
            const barContainer = document.createElement('div');
            barContainer.className = 'flex flex-col items-center flex-1';
            
            // Determine bar color based on mood
            const barColor = getMoodColorClass(entry.mood);
            
            // Create bar
            const barHeight = (entry.mood / maxValue) * 100;
            const bar = document.createElement('div');
            bar.className = `w-6 rounded-t-sm ${barColor}`;
            bar.style.height = `${barHeight}%`;
            bar.setAttribute('aria-label', `Mood level: ${entry.mood}/5`);
            
            // Create date label
            const dateLabel = document.createElement('div');
            dateLabel.className = 'text-xs text-gray-600 truncate w-full text-center mt-1';
            dateLabel.textContent = formatDateLabel(entry.date);
            
            barContainer.appendChild(bar);
            barContainer.appendChild(dateLabel);
            chart.appendChild(barContainer);
        });
        
        chartContainer.appendChild(chart);
    }
    
    function getMoodColorClass(mood) {
        switch(mood) {
            case '1': return 'bg-red-400';
            case '2': return 'bg-orange-400';
            case '3': return 'bg-yellow-400';
            case '4': return 'bg-blue-400';
            case '5': return 'bg-green-400';
            default: return 'bg-gray-400';
        }
    }
    
    function formatDateLabel(dateString) {
        // Convert date string to shortened format (e.g., "MM/DD")
        const date = new Date(dateString);
        if (isNaN(date)) {
            // If date parsing fails, return original string or simplified version
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

