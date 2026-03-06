
  const btn2d = document.getElementById("2d-btn");
  const btn3d = document.getElementById("3d-btn");

  const settings2d = document.getElementById("2d-settings");
  const settings3d = document.getElementById("3d-settings");

  function activateDimension(activeBtn, inactiveBtn, activeSettings, inactiveSettings) {
    // Button classes
    activeBtn.classList.add("dimension-btn-active");
    activeBtn.classList.remove("dimension-btn-not-active");

    inactiveBtn.classList.add("dimension-btn-not-active");
    inactiveBtn.classList.remove("dimension-btn-active");

    // Settings classes
    activeSettings.classList.add("dimension-setting-active");
    activeSettings.classList.remove("dimension-setting-not-active");

    inactiveSettings.classList.add("dimension-setting-not-active");
    inactiveSettings.classList.remove("dimension-setting-active");
  }

  btn2d.addEventListener("click", () =>
    activateDimension(btn2d, btn3d, settings2d, settings3d)
  );

  btn3d.addEventListener("click", () =>
    activateDimension(btn3d, btn2d, settings3d, settings2d)
  );
