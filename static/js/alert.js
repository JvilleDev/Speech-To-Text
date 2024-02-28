function showAlert(message, type) {
  const alertContainer = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alerta alert-${type}`;
  alert.innerHTML = message;
  const timeline = document.createElement('div');
  timeline.className = 'alert-timeline';
  alert.appendChild(timeline);
  alertContainer.appendChild(alert);
  setTimeout(function () {
    alert.style.right = '10px';
  }, 100);
  setTimeout(function () {
    timeline.style.width = '0';
  }, 100);
  setTimeout(function () {
    alert.style.right = '-100%';
    setTimeout(function () {
      alert.remove();
    }, 300);
  }, 4000);
}
