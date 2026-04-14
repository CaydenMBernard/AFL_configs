
  // const btntarget = document.getElementById("target-btn");
  // const btnsweep = document.getElementById("sweep-btn");

  // const settingsTarget = document.getElementById("target-settings");
  // const settingsSweep = document.getElementById("sweep-settings");

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

  // btntarget.addEventListener("click", () =>
  //   activateMode(btntarget, btnsweep, settingsTarget, settingsSweep)
  // );

  // btnsweep.addEventListener("click", () =>
  //   activateMode(btnsweep, btntarget, settingsSweep, settingsTarget)
  // );





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

    // zTargetBlock.classList.add("dimension-setting-not-active");    // ✅ NEW
    // zTargetBlock.classList.remove("dimension-setting-active");     // ✅ NEW
  });
 
  btn3d.addEventListener("click", () => {
    btn3d.classList.add("dimension-btn-active");
    btn3d.classList.remove("dimension-btn-not-active");
 
    btn2d.classList.add("dimension-btn-not-active");
    btn2d.classList.remove("dimension-btn-active");
 
    settings3d.classList.add("dimension-setting-active");
    settings3d.classList.remove("dimension-setting-not-active");

    // zTargetBlock.classList.add("dimension-setting-active");        // ✅ NEW
    // zTargetBlock.classList.remove("dimension-setting-not-active"); // ✅ NEW
  });
 




  async function renderGraphSidebar() {
    const allSolutions = await getAllSolutionsFromDb();
    const sidebarList = document.getElementById('sidebar-solution-list');
    sidebarList.innerHTML = '';

    // Rebuild the solution map on each render
    _graphSolutionMap.clear();

    allSolutions.forEach(solution => {
      _graphSolutionMap.set(solution.id, solution);

        const card = document.createElement('div');
        card.className = 'template-existing-stock-creationpage';
        card.setAttribute('data-solution-id', solution.id);

        let tagsHtml = '<div class="tag-container">';
        if (solution.tags && solution.tags.length > 0) {
            solution.tags.forEach(tag => {
                tagsHtml += `<div class="base-tag">${escapeHtmlText(tag)}</div>`;
            });
        }
        tagsHtml += '</div>';

        let componentsHtml = '';
        if (solution.components && solution.components.length > 0) {
            solution.components.forEach(comp => {
                componentsHtml += `
                <p class="sidebar-component-info">
                    <span class="sidebar-component-NAME">${escapeHtmlText(comp.name)}:</span>
                    <span class="sidebar-component-AMNT">${escapeHtmlText(comp.amount)}</span>
                    <span class="sidebar-component-UNIT">${escapeHtmlText(comp.unit)}</span>
                </p>`;
            });
        }

        card.innerHTML = `
            <p class="sidebar-solution-name"><strong>${escapeHtmlText(solution.solutionName) || '[Unnamed]'}</strong></p>
            ${tagsHtml}
            ${componentsHtml}
        `;

        card.addEventListener('click', () => toggleGraphSolutionSelection(card, solution));

        sidebarList.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initDb().then(() => {
      renderGraphSidebar();
      updateGlobalTags();
    });
  });

function escapeHtmlText(unsafe) {
    if (!unsafe) return "";
    return unsafe.toString()
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


















// ── Axis dropdown helpers ─────────────────────────────────────────────────
 
  const PLACEHOLDER = {
    x: "--Select X-Axis Component--",
    y: "--Select Y-Axis Component--",
    z: "--Select Z-Axis Component--",
  };
 
  function buildDropdownOptions(components, placeholderText) {
    let html = `<option value="">${placeholderText}</option>`;
    components.forEach(comp => {
      if (comp.name && comp.name.trim() !== "") {
        const safe = escapeHtmlText(comp.name.trim());
        html += `<option value="${safe}">${safe}</option>`;
      }
    });
    return html;
  }
 
  function populateAxisDropdowns(components) {
    document.getElementById("x-axis-dropdown").innerHTML =
      buildDropdownOptions(components, PLACEHOLDER.x);
    document.getElementById("y-axis-dropdown").innerHTML =
      buildDropdownOptions(components, PLACEHOLDER.y);
    document.getElementById("z-axis-dropdown").innerHTML =
      buildDropdownOptions(components, PLACEHOLDER.z);
    // updateTargetBlockLabels();
  }
 
  function resetAxisDropdowns() {
    document.getElementById("x-axis-dropdown").innerHTML =
      `<option value="">${PLACEHOLDER.x}</option>`;
    document.getElementById("y-axis-dropdown").innerHTML =
      `<option value="">${PLACEHOLDER.y}</option>`;
    document.getElementById("z-axis-dropdown").innerHTML =
      `<option value="">${PLACEHOLDER.z}</option>`;
    // updateTargetBlockLabels();
  }
 
  // Keep target-block labels in sync with whatever axis is chosen
  // function updateTargetBlockLabels() {
  //   const xVal = document.getElementById("x-axis-dropdown").value || "X-Axis Component";
  //   const yVal = document.getElementById("y-axis-dropdown").value || "Y-Axis Component";
  //   const zVal = document.getElementById("z-axis-dropdown").value || "Z-Axis Component";
  //   document.getElementById("X-target-block-component").textContent = xVal;
  //   document.getElementById("Y-target-block-component").textContent = yVal;
  //   document.getElementById("Z-target-block-component").textContent = zVal;
  // }
 
  // ["x-axis-dropdown", "y-axis-dropdown", "z-axis-dropdown"].forEach(id => {
  //   document.getElementById(id).addEventListener("change", updateTargetBlockLabels);
  // });


    function rebuildSweepBlocks() {
    const container = document.getElementById("target-blocks-all");
    container.innerHTML = "";
 
    if (selectedGraphSolutionIds.size === 0) {
      // Show an empty-state hint
      container.innerHTML = `<p style="color:#888; font-size:13px; margin:8px 4px;">Select solutions from the sidebar to configure sweep ranges.</p>`;
      return;
    }
 
    selectedGraphSolutionIds.forEach(id => {
      const sol = _graphSolutionMap.get(id);
      if (!sol) return;
 
      const safeName = escapeHtmlText(sol.solutionName || "Unnamed Solution");
 
      const block = document.createElement("div");
      block.className = "target-setting-block";
      block.setAttribute("data-sweep-solution-id", id);
 
      block.innerHTML = `
        <p class="target-component-title">${safeName}</p>
        <div class="target-block-row">
          <div class="target-block-min">
            <p class="target-label">Start</p>
            <input class="styled-input target-input" type="number" placeholder="0">
          </div>
          <div class="target-block-max">
            <p class="target-label">Stop</p>
            <input class="styled-input target-input" type="number" placeholder="100">
          </div>
          <div class="target-block-step">
            <p class="target-label">Step</p>
            <input class="styled-input target-input" type="number" placeholder="1">
          </div>
        </div>
      `;
 
      container.appendChild(block);
    });
  }

   /**
   * Returns an array of sweep config objects — one per selected solution.
   * { id, solutionName, start, stop, step }
   */
  function getSweepConfigs() {
    const configs = [];
    document.querySelectorAll("#target-blocks-all .target-setting-block").forEach(block => {
      const id = block.getAttribute("data-sweep-solution-id");
      const sol = _graphSolutionMap.get(id);
      const inputs = block.querySelectorAll("input");
      configs.push({
        id,
        solutionName: sol ? sol.solutionName : "",
        start: parseFloat(inputs[0]?.value) || 0,
        stop:  parseFloat(inputs[1]?.value) || 0,
        step:  parseFloat(inputs[2]?.value) || 1,
      });
    });
    return configs;
  }





  // NEW (replace with this):
const selectedGraphSolutionIds = new Set();
const _graphSolutionMap = new Map();

function toggleGraphSolutionSelection(card, solution) {
    if (selectedGraphSolutionIds.has(solution.id)) {
        // Deselect
        selectedGraphSolutionIds.delete(solution.id);
        card.classList.remove("selected-solution");
    } else {
        // Select
        selectedGraphSolutionIds.add(solution.id);
        card.classList.add("selected-solution");
    }

    if (selectedGraphSolutionIds.size === 0) {
        resetAxisDropdowns();
    } else {
        // Merge unique components across all selected solutions
        const seen = new Set();
        const mergedComponents = [];

        document.querySelectorAll(".template-existing-stock-creationpage.selected-solution")
            .forEach(selectedCard => {
                const id = selectedCard.getAttribute("data-solution-id");
                // We need the solution data — get it from the stored map
                const sol = _graphSolutionMap.get(id);
                if (sol) {
                    (sol.components || []).forEach(comp => {
                        const key = comp.name?.trim().toLowerCase();
                        if (key && !seen.has(key)) {
                            seen.add(key);
                            mergedComponents.push(comp);
                        }
                    });
                }
            });

        populateAxisDropdowns(mergedComponents);

        // Always rebuild the per-solution sweep blocks
    rebuildSweepBlocks();
    }
}

function toggleTagFilter(tagElement) {
    tagElement.classList.toggle('unselected');
    tagElement.classList.toggle('selected');
    filterSolutions();
}
