// Auto-dismiss flash alerts after 6 seconds
document.addEventListener('DOMContentLoaded', () => {
  const alerts = document.querySelectorAll('[role="alert"]');
  if (alerts.length > 0) {
    setTimeout(() => {
      alerts.forEach((alert) => {
        alert.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-10px)';
        setTimeout(() => alert.remove(), 500);
      });
    }, 6000);
  }
});
