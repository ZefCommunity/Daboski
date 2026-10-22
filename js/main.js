/* Shared behavior for the student technology community site.
   Expects css/styles.css. Safe to load on every page: missing pieces are skipped.
*/
(function () {
  "use strict";

  var desktopNav = window.matchMedia("(min-width: 1100px)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.documentElement.classList.add("js");

  function pageKey(filename) {
    var name = (filename || "index.html").split("?")[0].split("#")[0].toLowerCase();
    name = name.split("/").pop();
    if (!name || name === "index.html" || name === "home.html") return "home";
    return name.replace(/\.html$/, "");
  }

  function initActiveNav(nav) {
    var here = pageKey(window.location.pathname);
    var links = nav.querySelectorAll("a[href]");
    Array.prototype.forEach.call(links, function (link) {
      var href = link.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;
      if (pageKey(href) === here) link.setAttribute("aria-current", "page");
    });
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".site-nav");
    if (!nav) return;

    initActiveNav(nav);
    if (!toggle) return;

    if (!toggle.getAttribute("aria-controls") && nav.id) {
      toggle.setAttribute("aria-controls", nav.id);
    }
    if (!toggle.hasAttribute("aria-expanded")) {
      toggle.setAttribute("aria-expanded", "false");
    }
    if (!toggle.getAttribute("aria-label")) {
      toggle.setAttribute("aria-label", "Menu");
    }

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("is-nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var open = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(open);
      if (open) {
        var first = nav.querySelector("a, button");
        if (first) first.focus();
      }
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    function onDesktopChange(event) {
      if (event.matches) setOpen(false);
    }

    if (desktopNav.addEventListener) desktopNav.addEventListener("change", onDesktopChange);
    else if (desktopNav.addListener) desktopNav.addListener(onDesktopChange);
  }

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initReveal() {
    var nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, function (node) {
        node.classList.add("is-in");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    Array.prototype.forEach.call(nodes, function (node) {
      var siblings = node.parentElement
        ? node.parentElement.querySelectorAll(":scope > .reveal")
        : [node];
      var index = Array.prototype.indexOf.call(siblings, node);
      node.style.transitionDelay = Math.min(Math.max(index, 0), 5) * 70 + "ms";
      observer.observe(node);
    });
  }

  function fieldError(field, message) {
    var holder = field.closest("label") || field.parentElement;
    var existing = holder.querySelector(".field-error");
    field.setAttribute("aria-invalid", "true");
    if (!existing) {
      existing = document.createElement("span");
      existing.className = "field-error";
      holder.appendChild(existing);
    }
    existing.textContent = message;
  }

  function clearField(field) {
    field.removeAttribute("aria-invalid");
    var holder = field.closest("label") || field.parentElement;
    var existing = holder.querySelector(".field-error");
    if (existing) existing.remove();
  }

  function initForms() {
    var forms = document.querySelectorAll("form");
    Array.prototype.forEach.call(forms, function (form) {
      form.setAttribute("novalidate", "");
      var fields = form.querySelectorAll("input, textarea, select");
      Array.prototype.forEach.call(fields, function (field) {
        field.addEventListener("input", function () {
          clearField(field);
        });
      });

      form.addEventListener("submit", function (event) {
        var note = form.querySelector(".form-note");
        var valid = true;
        var firstInvalid = null;

        if (note) {
          note.textContent = "";
          note.classList.remove("is-error");
        }

        Array.prototype.forEach.call(fields, function (field) {
          if (field.disabled || field.type === "hidden") return;
          clearField(field);
          if (!field.checkValidity()) {
            valid = false;
            firstInvalid = firstInvalid || field;
            fieldError(field, field.validationMessage || "Please check this field.");
          }
        });

        if (!valid) {
          event.preventDefault();
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        var action = (form.getAttribute("action") || "").trim();
        if (action && action !== "#") return;

        event.preventDefault();
        if (!note) {
          note = document.createElement("p");
          note.className = "form-note";
          note.setAttribute("role", "status");
          form.appendChild(note);
        }
        note.textContent = "Thanks. This form stays on the page until a submit address is added.";
        form.reset();
      });
    });
  }

  function initMembershipPackages() {
    var packageField = document.querySelector("#member-package");
    var choices = document.querySelectorAll("[data-membership-package]");
    if (!packageField || !choices.length) return;

    Array.prototype.forEach.call(choices, function (choice) {
      choice.addEventListener("click", function () {
        packageField.value = choice.getAttribute("data-membership-package") || "";
        packageField.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
  }

  function initFilters() {
    var groups = document.querySelectorAll("[data-filter-group]");
    Array.prototype.forEach.call(groups, function (group) {
      var buttons = group.querySelectorAll("[data-filter]");
      var scope = group.parentElement || document;
      var cards = scope.querySelectorAll("[data-category]");
      if (!buttons.length || !cards.length) return;

      function apply(name) {
        Array.prototype.forEach.call(buttons, function (button) {
          var on = button.getAttribute("data-filter") === name;
          button.classList.toggle("is-active", on);
          button.setAttribute("aria-pressed", on ? "true" : "false");
        });
        Array.prototype.forEach.call(cards, function (card) {
          var show = name === "all" || card.getAttribute("data-category") === name;
          card.hidden = !show;
        });
      }

      Array.prototype.forEach.call(buttons, function (button) {
        if (button.tagName === "BUTTON" && !button.getAttribute("type")) {
          button.setAttribute("type", "button");
        }
        if (!button.hasAttribute("aria-pressed")) button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", function () {
          apply(button.getAttribute("data-filter") || "all");
        });
      });
    });
  }

  function initYear() {
    var nodes = document.querySelectorAll("[data-year]");
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (node) {
      node.textContent = year;
    });
  }

  [initNav, initHeader, initReveal, initForms, initMembershipPackages, initFilters, initYear].forEach(function (start) {
    try {
      start();
    } catch (error) {
      console.error(error);
    }
  });
})();
