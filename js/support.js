// Support page: FAQ accordion and feedback form.
(function () {
  // Served by next-app; local static previews post to a local next dev server.
  var isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  var API_ORIGIN = isLocal ? "http://localhost:3000" : "https://url2.at";
  var FEEDBACK_URL = API_ORIGIN + "/api/cursor-tracker/feedback";
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // FAQ: one item open at a time.
  var items = document.querySelectorAll(".support-faq .faq-item");
  items.forEach(function (item) {
    var button = item.querySelector(".faq-question");
    button.addEventListener("click", function () {
      var wasOpen = item.classList.contains("open");
      items.forEach(function (other) {
        other.classList.remove("open");
        other.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  // Toast
  var toast = document.querySelector(".toast");
  var toastIcon = toast.querySelector(".toast-icon");
  var toastText = toast.querySelector("span");
  var hideTimer = null;

  function hideToast() {
    toast.classList.remove("show");
    toast.removeAttribute("style");
    toastIcon.removeAttribute("style");
    toastIcon.textContent = "✓";
    toastText.textContent = "Message";
  }

  function showToast(message, isError) {
    toast.classList.add("show");
    toast.style.borderColor = isError ? "rgba(220, 38, 38, 0.45)" : "var(--border-strong)";
    toastIcon.style.background = isError ? "rgba(254, 226, 226, 0.9)" : "var(--accent-soft)";
    toastIcon.style.color = isError ? "#b91c1c" : "var(--accent-2)";
    toastIcon.textContent = isError ? "✕" : "✓";
    toastText.textContent = message;
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hideToast, 5500);
  }

  async function submitFeedback(body) {
    var fallback = "Unable to submit feedback.";
    try {
      var response = await fetch(FEEDBACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      var data = {};
      try {
        data = await response.json();
      } catch (e) {
        data = {};
      }
      if (!response.ok || data.hasError || data.error) {
        var message = (typeof data.error === "string" && data.error) || data.message || fallback;
        return Object.assign({}, data, { hasError: true, message: message });
      }
      return data;
    } catch (e) {
      return { hasError: true, message: fallback };
    }
  }

  // Feedback form
  var form = document.querySelector(".feedback-card form");
  var submit = form.querySelector(".btn-submit");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var type = form.elements.namedItem("type").value;
    var descriptionEl = form.elements.namedItem("description");
    var emailEl = form.elements.namedItem("email");
    var description = descriptionEl.value.trim();
    var email = emailEl.value.trim();

    if (!description || description.length < 10) {
      showToast("Please enter a description (at least 10 characters).", true);
      descriptionEl.focus();
      return;
    }
    if (email && !EMAIL_RE.test(email)) {
      showToast("Please enter a valid email address.", true);
      emailEl.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = "Submitting…";
    var body = { type: type, description: description };
    if (email) body.email = email;
    var result = await submitFeedback(body);
    submit.disabled = false;
    submit.textContent = "Submit";
    if (result.hasError) {
      showToast(result.message || "Could not submit feedback.", true);
      return;
    }
    form.reset();
    showToast(result.message || "Thank you! Your feedback has been submitted.", false);
  });
})();
