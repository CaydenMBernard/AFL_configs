
  const btntarget = document.getElementById("target-btn");
  const btnsweep = document.getElementById("sweep-btn");

  const settingsTarget = document.getElementById("target-settings");
  const settingsSweep = document.getElementById("sweep-settings");

  const zTargetBlock = document.getElementById("z-setting-block");

  function activateMode(activeBtn, inactiveBtn, activeSettings, inactiveSettings) {
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

  btntarget.addEventListener("click", () =>
    activateMode(btntarget, btnsweep, settingsTarget, settingsSweep)
  );

  btnsweep.addEventListener("click", () =>
    activateMode(btnsweep, btntarget, settingsSweep, settingsTarget)
  );





const btn2d = document.getElementById("2d-btn");
  const btn3d = document.getElementById("3d-btn");
 
  const settings3d = document.getElementById("3d-settings");
 
  // 2D settings are always visible — only 3D settings toggle
  btn2d.addEventListener("click", () => {
    btn2d.classList.add("dimension-btn-active");
    btn2d.classList.remove("dimension-btn-not-active");
 
    btn3d.classList.add("dimension-btn-not-active");
    btn3d.classList.remove("dimension-btn-active");
 
    settings3d.classList.add("dimension-setting-not-active");
    settings3d.classList.remove("dimension-setting-active");

    zTargetBlock.classList.add("dimension-setting-not-active");    // ✅ NEW
    zTargetBlock.classList.remove("dimension-setting-active");     // ✅ NEW
  });
 
  btn3d.addEventListener("click", () => {
    btn3d.classList.add("dimension-btn-active");
    btn3d.classList.remove("dimension-btn-not-active");
 
    btn2d.classList.add("dimension-btn-not-active");
    btn2d.classList.remove("dimension-btn-active");
 
    settings3d.classList.add("dimension-setting-active");
    settings3d.classList.remove("dimension-setting-not-active");

    zTargetBlock.classList.add("dimension-setting-active");        // ✅ NEW
    zTargetBlock.classList.remove("dimension-setting-not-active"); // ✅ NEW
  });
 
