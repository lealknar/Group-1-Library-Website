// CTA button click animation
document.querySelectorAll('.cta-button').forEach(btn => {
  btn.addEventListener('click', function() {
    this.style.transform = 'scale(0.95)';
    setTimeout(() => this.style.transform = '', 150); // Reset transform after a short delay
  });
});

// Scroll to policies
function scrollToPolicies() {
  document.getElementById('policies').scrollIntoView({ behavior: 'smooth' });
}

// Reveal policies on scroll
const boxes = document.querySelectorAll('.policy-box');
const animateOnScroll = () => {
  const trigger = window.innerHeight * 0.85; // Trigger earlier
  boxes.forEach((box, index) => {
    const boxTop = box.getBoundingClientRect().top;
    if (boxTop < trigger && !box.classList.contains('show')) {
      setTimeout(() => {
        box.classList.add('show');
      }, index * 120); // Slightly longer stagger for elegance
    }
  });
};

window.addEventListener('scroll', animateOnScroll);
animateOnScroll(); // Run once on load to catch elements already in view

// Parallax effect for hero content
document.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero');
  const scrollPosition = window.pageYOffset;
  // Adjusted parallax speed, keeping it subtle but noticeable
  hero.style.transform = 'translateY(' + scrollPosition * 0.2 + 'px)';
});