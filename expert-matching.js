/**
 * Expert AI Matching for Service Marketplace
 * This file handles the AI client matching visualization and interactions
 */

// Visualization elements for the AI matching
const visualElements = {
    expertNode: null,
    aiNode: null,
    clientNode: null,
    expertAiConnection: null,
    aiClientConnection: null,
    expertPulse: null,
    clientPulse: null
};

// Initialize the matching page
function initMatchingPage() {
    // Check if user is logged in using our auth system
    if (!isLoggedIn()) {
        // Redirect to login with return URL
        window.location.href = '/login.html?redirect=expert-matching.html';
        return;
    }

    // Get user data
    const userData = getCurrentUser();
    console.log('Current user:', userData);

    // Set up animations and interactions
    setupAnimations();
    setupEventListeners();
}

// Set up animations for the AI visualization
function setupAnimations() {
    // Store references to visual elements
    visualElements.expertNode = document.querySelector('.node.expert');
    visualElements.aiNode = document.querySelector('.node.ai');
    visualElements.clientNode = document.querySelector('.node.client');
    visualElements.expertAiConnection = document.querySelector('.connection.expert-ai');
    visualElements.aiClientConnection = document.querySelector('.connection.ai-client');
    visualElements.expertPulse = document.querySelector('.connection.expert-ai .pulse');
    visualElements.clientPulse = document.querySelector('.connection.ai-client .pulse');

    // Add hover effect to nodes
    [visualElements.expertNode, visualElements.aiNode, visualElements.clientNode].forEach(node => {
        if (!node) return;

        node.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            this.style.transition = 'transform 0.3s, box-shadow 0.3s';
        });

        node.addEventListener('mouseleave', function() {
            // Reset transform for AI node
            if (this === visualElements.aiNode) {
                this.style.transform = 'translate(-50%, -50%)';
            } else {
                this.style.transform = 'scale(1)';
            }
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        });
    });

    // Create "thinking" animation in the AI node
    animateAIThinking();

    // Animate factor cards on scroll
    setupScrollAnimations();
}

// Animate the AI "thinking" with random synapses
function animateAIThinking() {
    if (!visualElements.aiNode) return;

    // Create a canvas for the synapses
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.borderRadius = '50%';
    canvas.style.pointerEvents = 'none';

    visualElements.aiNode.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Synapse nodes
    const nodes = [];
    for (let i = 0; i < 12; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.2
        });
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 0.5;

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 60) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw and update nodes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        nodes.forEach(node => {
            // Move node
            node.x += Math.random() * node.speed - node.speed / 2;
            node.y += Math.random() * node.speed - node.speed / 2;

            // Keep within bounds
            if (node.x < 0 || node.x > canvas.width) node.x = Math.random() * canvas.width;
            if (node.y < 0 || node.y > canvas.height) node.y = Math.random() * canvas.height;

            // Draw node
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// Set up scroll animations for factor cards
function setupScrollAnimations() {
    const factorCards = document.querySelectorAll('.factor-card');
    const matchExamples = document.querySelectorAll('.match-example');

    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    // Set initial state and observe factor cards
    factorCards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`;
        observer.observe(card);
    });

    // Set initial state and observe match examples
    matchExamples.forEach((example, i) => {
        example.style.opacity = '0';
        example.style.transform = 'translateY(30px)';
        example.style.transition = `opacity 0.5s ease ${i * 0.2}s, transform 0.5s ease ${i * 0.2}s`;
        observer.observe(example);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Profile button click
    const profileBtn = document.querySelector('.btn-success');
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            // In a real app, this would take you to the profile editing page
            // For this mockup, we'll just add a smooth scroll to the top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // View profile buttons
    document.querySelectorAll('.match-actions .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // In a real app, this would show a profile modal or navigate to a profile page
            // For this mockup, we'll show an alert
            const matchName = this.closest('.match').querySelector('.match-name').textContent;
            alert(`Viewing profile of ${matchName}`);
        });
    });
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initMatchingPage);
