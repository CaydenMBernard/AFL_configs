// graph-script.js

let selectedGraphSolutionId = null;

function escapeHtmlText(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const PLACEHOLDER = {
  x: "--Select X-Axis Component--",
  y: "--Select Y-Axis Component--",
  z: "--Select Z-Axis Component--",
};

async function renderGraphSidebar() {
  try {
    const allSolutions = await getAllSolutionsFromDb();
    const sidebarList = document.getElementById("sidebar-solution-list");
    if (!sidebarList) return;

    sidebarList.innerHTML = "";

    allSolutions.forEach((solution) => {
      const card = document.createElement("div");
      card.className = "template-existing-stock-creationpage";
      card.setAttribute("data-solution-id", solution.id || "");

      let tagsHtml = '<div class="tag-container">';
      if (solution.tags && solution.tags.length > 0) {
        solution.tags.forEach((tag) => {
          tagsHtml += `<div class="base-tag">${escapeHtmlText(tag)}</div>`;
        });
      }
      tagsHtml += "</div>";

      let componentsHtml = "";
      if (solution.components && solution.components.length > 0) {
        solution.components.forEach((comp) => {
          componentsHtml += `
            <p class="sidebar-component-info">
              <span class="sidebar-component-NAME">${escapeHtmlText(comp.name)}:</span>
              <span class="sidebar-component-AMNT">${escapeHtmlText(comp.amount)}</span>
              <span class="sidebar-component-UNIT">${escapeHtmlText(comp.unit)}</span>
            </p>
          `;
        });
      }

      card.innerHTML = `
        <p class="sidebar-solution-name"><strong>${escapeHtmlText(solution.solutionName) || "[Unnamed]"}</strong></p>
        ${tagsHtml}
        ${componentsHtml}
      `;

      card.addEventListener("click", () => toggleGraphSolutionSelection(card, solution));
      sidebarList.appendChild(card);
    });
  } catch (error) {
    console.error("Error rendering graph sidebar:", error);
  }
}

function buildDropdownOptions(components, placeholderText) {
  let html = `<option value="">${placeholderText}</option>`;
  components.forEach((comp) => {
    if (comp.name && comp.name.trim() !== "") {
      const safe = escapeHtmlText(comp.name.trim());
      html += `<option value="${safe}">${safe}</option>`;
    }
  });
  return html;
}

function populateAxisDropdowns(components) {
  const x = document.getElementById("x-axis-dropdown");
  const y = document.getElementById("y-axis-dropdown");
  const z = document.getElementById("z-axis-dropdown");

  if (!x || !y || !z) return;

  x.innerHTML = buildDropdownOptions(components, PLACEHOLDER.x);
  y.innerHTML = buildDropdownOptions(components, PLACEHOLDER.y);
  z.innerHTML = buildDropdownOptions(components, PLACEHOLDER.z);

  updateTargetBlockLabels();
}

function resetAxisDropdowns() {
  const x = document.getElementById("x-axis-dropdown");
  const y = document.getElementById("y-axis-dropdown");
  const z = document.getElementById("z-axis-dropdown");

  if (!x || !y || !z) return;

  x.innerHTML = `<option value="">${PLACEHOLDER.x}</option>`;
  y.innerHTML = `<option value="">${PLACEHOLDER.y}</option>`;
  z.innerHTML = `<option value="">${PLACEHOLDER.z}</option>`;

  updateTargetBlockLabels();
}

function updateTargetBlockLabels() {
  const xVal = document.getElementById("x-axis-dropdown")?.value || "X-Axis Component";
  const yVal = document.getElementById("y-axis-dropdown")?.value || "Y-Axis Component";
  const zVal = document.getElementById("z-axis-dropdown")?.value || "Z-Axis Component";

  const xLabel = document.getElementById("X-target-block-component");
  const yLabel = document.getElementById("Y-target-block-component");
  const zLabel = document.getElementById("Z-target-block-component");

  if (xLabel) xLabel.textContent = xVal;
  if (yLabel) yLabel.textContent = yVal;
  if (zLabel) zLabel.textContent = zVal;
}

function toggleGraphSolutionSelection(card, solution) {
  const isAlreadySelected = selectedGraphSolutionId === solution.id;

  document.querySelectorAll(".template-existing-stock-creationpage")
    .forEach((c) => c.classList.remove("selected-solution"));

  if (isAlreadySelected) {
    selectedGraphSolutionId = null;
    resetAxisDropdowns();
    return;
  }

  selectedGraphSolutionId = solution.id;
  card.classList.add("selected-solution");
  populateAxisDropdowns(solution.components || []);
}

function activateMode(activeBtn, inactiveBtn, activeSettings, inactiveSettings) {
  if (activeBtn) {
    activeBtn.classList.add("dimension-btn-active");
    activeBtn.classList.remove("dimension-btn-not-active");
  }

  if (inactiveBtn) {
    inactiveBtn.classList.add("dimension-btn-not-active");
    inactiveBtn.classList.remove("dimension-btn-active");
  }

  if (activeSettings) {
    activeSettings.classList.add("dimension-setting-active");
    activeSettings.classList.remove("dimension-setting-not-active");
  }

  if (inactiveSettings) {
    inactiveSettings.classList.add("dimension-setting-not-active");
    inactiveSettings.classList.remove("dimension-setting-active");
  }
}

function setupModeButtons() {
  const btntarget = document.getElementById("target-btn");
  const btnsweep = document.getElementById("sweep-btn");
  const settingsTarget = document.getElementById("target-settings");
  const settingsSweep = document.getElementById("sweep-settings");

  if (btntarget && btnsweep && settingsTarget && settingsSweep) {
    btntarget.addEventListener("click", () => {
      activateMode(btntarget, btnsweep, settingsTarget, settingsSweep);
    });

    btnsweep.addEventListener("click", () => {
      activateMode(btnsweep, btntarget, settingsSweep, settingsTarget);
    });
  }

  const btn2d = document.getElementById("2d-btn");
  const btn3d = document.getElementById("3d-btn");
  const settings3d = document.getElementById("3d-settings");
  const zTargetBlock = document.getElementById("z-setting-block");

  if (btn2d && btn3d && settings3d && zTargetBlock) {
    btn2d.addEventListener("click", () => {
      btn2d.classList.add("dimension-btn-active");
      btn2d.classList.remove("dimension-btn-not-active");

      btn3d.classList.add("dimension-btn-not-active");
      btn3d.classList.remove("dimension-btn-active");

      settings3d.classList.add("dimension-setting-not-active");
      settings3d.classList.remove("dimension-setting-active");

      zTargetBlock.classList.add("dimension-setting-not-active");
      zTargetBlock.classList.remove("dimension-setting-active");
    });

    btn3d.addEventListener("click", () => {
      btn3d.classList.add("dimension-btn-active");
      btn3d.classList.remove("dimension-btn-not-active");

      btn2d.classList.add("dimension-btn-not-active");
      btn2d.classList.remove("dimension-btn-active");

      settings3d.classList.add("dimension-setting-active");
      settings3d.classList.remove("dimension-setting-not-active");

      zTargetBlock.classList.add("dimension-setting-active");
      zTargetBlock.classList.remove("dimension-setting-not-active");
    });
  }
}

function toggleTagFilter(tagElement) {
  tagElement.classList.toggle("unselected");
  tagElement.classList.toggle("selected");
  filterSolutions();
}

async function generateGraph() {
  const xAxis = document.getElementById("x-axis-dropdown")?.value || "";
  const yAxis = document.getElementById("y-axis-dropdown")?.value || "";
  const zAxis = document.getElementById("z-axis-dropdown")?.value || "";

  const is3D = document.getElementById("3d-btn")?.classList.contains("dimension-btn-active");

  if (!xAxis || !yAxis) {
    alert("Please select both X and Y axes.");
    return;
  }

  if (is3D && !zAxis) {
    alert("Please select a Z axis for 3D mode.");
    return;
  }

  try {
    const payload = {
      x_axis: xAxis,
      y_axis: yAxis
    };

    if (is3D) {
      payload.z_axis = zAxis;
    }

    const res = await fetch("/api/generate_graph", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.ok) {
      console.error("Graph generation failed:", data);
      alert(JSON.stringify(data, null, 2));
      return;
    }

    const graphBox = document.getElementById("graph-output-box");
    const outputBox = document.getElementById("code-output-box");

    if (!graphBox) {
      console.error("Missing #graph-output-box");
      return;
    }

    graphBox.innerHTML = data.graph_html || "";

    const scripts = graphBox.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.textContent = oldScript.textContent;
      }
      document.body.appendChild(newScript);
      oldScript.remove();
    });

    if (outputBox) {
      outputBox.innerHTML = `
        <p>${data.num_points ?? 0} plotted points</p>
        <p>${data.num_balanced ?? 0} / ${data.num_total ?? 0} targets balanced</p>
        <p>${data.is_3d ? "3D graph" : "2D graph"}</p>
      `;
    }

    console.log("Graph generated successfully:", data);
  } catch (err) {
    console.error("Error generating graph:", err);
    alert("Failed to generate graph.");
  }
}

function downloadGraph() {
  const graphBox = document.getElementById("graph-output-box");
  if (!graphBox || !graphBox.innerHTML.trim()) {
    alert("Generate a graph first.");
    return;
  }

  alert("Download functionality can be added next.");
}

document.addEventListener("DOMContentLoaded", () => {
  setupModeButtons();

  ["x-axis-dropdown", "y-axis-dropdown", "z-axis-dropdown"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", updateTargetBlockLabels);
    }
  });

  const graphBtn = document.getElementById("gen-graph-btn");
  if (graphBtn) {
    graphBtn.addEventListener("click", generateGraph);
  }

  const downloadBtn = document.getElementById("download-graph-btn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadGraph);
  }

  initDb()
    .then(() => {
      renderGraphSidebar();
      updateGlobalTags();
    })
    .catch((error) => {
      console.error("Failed to initialize database on graph page:", error);
    });

  updateTargetBlockLabels();
});