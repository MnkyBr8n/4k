document.addEventListener("DOMContentLoaded", () => {
  const themes = ["default", "winter", "halloween", "christmas", "valentine", "summer"];

  // Create a small selector UI
  const selector = document.createElement("select");
  selector.id = "bgThemeSelector";
  selector.style.position = "fixed";
  selector.style.top = "1rem";
  selector.style.right = "1rem";
  selector.style.zIndex = "9999";

  themes.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    selector.appendChild(opt);
  });

  document.body.appendChild(selector);

  // Load saved theme
  const saved = localStorage.getItem("bgTheme") || "default";
  document.body.classList.add("bg-" + saved);
  selector.value = saved;

  // Change handler
  selector.addEventListener("change", e => {
    const theme = e.target.value;
    document.body.className = document.body.className
      .split(" ")
      .filter(c => !c.startsWith("bg-"))
      .join(" ");
    document.body.classList.add("bg-" + theme);
    localStorage.setItem("bgTheme", theme);
  });
});