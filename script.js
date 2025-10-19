
const SUPPORT_NUMBER = "6285189063747"; 
const DEFAULT_MESSAGE = encodeURIComponent("Hello, I need support regarding my website payment.");


document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("support-btn");
  if (btn) {
    btn.href = `https://wa.me/${SUPPORT_NUMBER}?text=${DEFAULT_MESSAGE}`;
  }
});