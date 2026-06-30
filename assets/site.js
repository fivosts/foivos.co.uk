(function () {
  var root = document.documentElement;
  var transitionKey = "foivos.page-transition";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canAnimate = !reduceMotion;

  try {
    if (canAnimate && sessionStorage.getItem(transitionKey) === "1") {
      root.classList.add("is-entering");
    }
  } catch (error) {
    canAnimate = false;
  }

  function clearTransitionFlag() {
    try {
      sessionStorage.removeItem(transitionKey);
    } catch (error) {
      return;
    }
  }

  function markReady() {
    clearTransitionFlag();
    root.classList.remove("is-leaving");

    if (!canAnimate) {
      root.classList.remove("is-entering");
      return;
    }

    window.requestAnimationFrame(function () {
      root.classList.add("page-ready");

      if (root.classList.contains("is-entering")) {
        window.setTimeout(function () {
          root.classList.remove("is-entering");
        }, 300);
      }
    });
  }

  function shouldSmoothNavigate(event, link) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return false;
    }

    if (link.target && link.target !== "_self") {
      return false;
    }

    if (link.hasAttribute("download")) {
      return false;
    }

    var url;

    try {
      url = new URL(link.href, window.location.href);
    } catch (error) {
      return false;
    }

    if (url.origin !== window.location.origin) {
      return false;
    }

    if (url.pathname.indexOf("/assets/") === 0 || /\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(url.pathname)) {
      return false;
    }

    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return false;
    }

    return url.href;
  }

  function wireNavigation() {
    document.addEventListener("click", function (event) {
      var link = event.target.closest ? event.target.closest("a[href]") : null;
      var destination = link ? shouldSmoothNavigate(event, link) : false;

      if (!destination) {
        return;
      }

      event.preventDefault();

      if (!canAnimate) {
        window.location.href = destination;
        return;
      }

      root.classList.remove("page-ready", "is-entering");
      root.classList.add("is-leaving");

      try {
        sessionStorage.setItem(transitionKey, "1");
      } catch (error) {
        // Navigation still works if storage is unavailable.
      }

      window.setTimeout(function () {
        window.location.href = destination;
      }, 185);
    });
  }

  function wireCvExplorer() {
    var explorer = document.querySelector("[data-cv-explorer]");

    if (!explorer) {
      return;
    }

    var focus = explorer.querySelector(".cv-focus");
    var logo = explorer.querySelector("[data-cv-logo]");
    var group = explorer.querySelector("[data-cv-group]");
    var title = explorer.querySelector("[data-cv-title]");
    var org = explorer.querySelector("[data-cv-org]");
    var meta = explorer.querySelector("[data-cv-meta]");
    var summary = explorer.querySelector("[data-cv-summary]");
    var nodes = Array.prototype.slice.call(explorer.querySelectorAll(".cv-node"));

    function setActive(node, shouldFocus) {
      if (!node || node.classList.contains("is-active")) {
        if (shouldFocus && node) {
          node.focus();
        }

        return;
      }

      nodes.forEach(function (item) {
        var isActive = item === node;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      logo.src = node.dataset.logo;
      logo.alt = node.dataset.alt || "";
      group.textContent = node.dataset.group || "";
      title.textContent = node.dataset.title || "";
      org.textContent = node.dataset.org || "";
      meta.textContent = node.dataset.meta || "";
      summary.textContent = node.dataset.summary || "";

      focus.classList.remove("is-swapping");
      void focus.offsetWidth;
      focus.classList.add("is-swapping");

      if (shouldFocus) {
        node.focus();
      }
    }

    nodes.forEach(function (node, index) {
      node.addEventListener("click", function () {
        setActive(node, false);
      });

      node.addEventListener("mouseenter", function () {
        setActive(node, false);
      });

      node.addEventListener("focus", function () {
        setActive(node, false);
      });

      node.addEventListener("keydown", function (event) {
        var nextIndex = index;

        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
          nextIndex = Math.min(nodes.length - 1, index + 1);
        } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
          nextIndex = Math.max(0, index - 1);
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = nodes.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        setActive(nodes[nextIndex], true);
      });
    });
  }

  function wireMobileMenu() {
    var toggle = document.querySelector(".mobile-menu-toggle");
    var menu = document.querySelector(".mobile-menu");
    var close = document.querySelector(".mobile-menu-close");

    if (!toggle || !menu || !close) {
      return;
    }

    function openMenu() {
      menu.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("mobile-menu-open");
      close.focus();
    }

    function closeMenu() {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("mobile-menu-open");
      toggle.focus();
    }

    toggle.addEventListener("click", openMenu);
    close.addEventListener("click", closeMenu);

    menu.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest("a")) {
        document.body.classList.remove("mobile-menu-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !menu.hidden) {
        closeMenu();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      wireMobileMenu();
      wireCvExplorer();
      wireNavigation();
      markReady();
    }, { once: true });
  } else {
    wireMobileMenu();
    wireCvExplorer();
    wireNavigation();
    markReady();
  }

  window.addEventListener("pageshow", markReady);
})();
