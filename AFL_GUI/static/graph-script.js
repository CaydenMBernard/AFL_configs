
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
 




  async function renderGraphSidebar() {
    const allSolutions = await getAllSolutionsFromDb();
    const sidebarList = document.getElementById('sidebar-solution-list');
    sidebarList.innerHTML = '';

    allSolutions.forEach(solution => {
        const card = document.createElement('div');
        card.className = 'template-existing-stock-creationpage';

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
    updateTargetBlockLabels();
  }
 
  function resetAxisDropdowns() {
    document.getElementById("x-axis-dropdown").innerHTML =
      `<option value="">${PLACEHOLDER.x}</option>`;
    document.getElementById("y-axis-dropdown").innerHTML =
      `<option value="">${PLACEHOLDER.y}</option>`;
    document.getElementById("z-axis-dropdown").innerHTML =
      `<option value="">${PLACEHOLDER.z}</option>`;
    updateTargetBlockLabels();
  }
 
  // Keep target-block labels in sync with whatever axis is chosen
  function updateTargetBlockLabels() {
    const xVal = document.getElementById("x-axis-dropdown").value || "X-Axis Component";
    const yVal = document.getElementById("y-axis-dropdown").value || "Y-Axis Component";
    const zVal = document.getElementById("z-axis-dropdown").value || "Z-Axis Component";
    document.getElementById("X-target-block-component").textContent = xVal;
    document.getElementById("Y-target-block-component").textContent = yVal;
    document.getElementById("Z-target-block-component").textContent = zVal;
  }
 
  ["x-axis-dropdown", "y-axis-dropdown", "z-axis-dropdown"].forEach(id => {
    document.getElementById(id).addEventListener("change", updateTargetBlockLabels);
  });








  // let selectedGraphSolutionId = null;
 
  // function toggleGraphSolutionSelection(card, solution) {
  //   const isAlreadySelected = selectedGraphSolutionId === solution.id;
 
  //   // Clear all highlights first
  //   document.querySelectorAll(".template-existing-stock-creationpage")
  //     .forEach(c => c.classList.remove("selected-solution"));
 
  //   if (isAlreadySelected) {
  //     // Clicking the active card again → deselect
  //     selectedGraphSolutionId = null;
  //     resetAxisDropdowns();
  //   } else {
  //     // Select the clicked card
  //     selectedGraphSolutionId = solution.id;
  //     card.classList.add("selected-solution");
  //     populateAxisDropdowns(solution.components || []);
  //   }
  // }

let selectedGraphSolutions = []; 

function toggleGraphSolutionSelection(card, solution) {
    // check if in array
    const existingIndex = selectedGraphSolutions.findIndex(s => s.id === solution.id);

    // if in, remove
    if (existingIndex > -1) {
        selectedGraphSolutions.splice(existingIndex, 1);
        card.classList.remove("selected-solution");
    } else {
        // If it wasn't selected, add it to the array and add the highlight
        selectedGraphSolutions.push(solution);
        card.classList.add("selected-solution");
    }

    // update dropdowns
    if (selectedGraphSolutions.length === 0) {
        resetAxisDropdowns();
    } else {
      // get unitque componentes for all the selected cards
        const uniqueComponentsMap = new Map();

        selectedGraphSolutions.forEach(sol => {
            if (sol.components && sol.components.length > 0) {
                sol.components.forEach(comp => {
                    if (comp.name && comp.name.trim() !== "") {
                        uniqueComponentsMap.set(comp.name.trim().toLowerCase(), comp);
                    }
                });
            }
        });

        // convert back into an array
        const combinedComponents = Array.from(uniqueComponentsMap.values());
        populateAxisDropdowns(combinedComponents);
    }
}



function toggleTagFilter(tagElement) {
    tagElement.classList.toggle('unselected');
    tagElement.classList.toggle('selected');
    filterSolutions();
}
