// AFL Graph Page Script
// This script manages the interactive graph generation page of the AFL GUI, allowing users to select solutions, configure graph axes, set sweep ranges, and generate/download graphs based on their data.

// Global state for selected solutions and their components
let selectedGraphSolutionIds = new Set();
const graphSolutionMap = new Map();

// placeholder text for dropdowns when no component is selected
const PLACEHOLDER = {
  x: "--Select X-Axis Component--",
  y: "--Select Y-Axis Component--",
  z: "--Select Z-Axis Component--",
};

// helper function to escape HTML special characters to prevent XSS and ensure safe rendering of user-generated content
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

// checks if the current graph mode is 3D based on the active state of the mode buttons, this is used to determine whether to require a Z-axis selection and how to render the graph
function is3DMode() {
  const btn3d = document.getElementById("3d-btn");
  return btn3d && btn3d.classList.contains("dimension-btn-active");
}

// builds the HTML options for the axis dropdowns based on the components of the selected solutions, this is called whenever the selected solutions change to update the available components for graphing
function buildDropdownOptions(components, placeholderText) {
  let html = `<option value="">${placeholderText}</option>`;

  components.forEach((comp) => {
    const name = comp?.name?.trim();
    if (name) {
      const safe = escapeHtmlText(name);
      html += `<option value="${safe}">${safe}</option>`;
    }
  });

  return html;
}

// merges the components of all selected solutions into a single list of unique components, this is used to populate the axis dropdowns with all available components from the selected solutions without duplicates
function getMergedSelectedComponents() {
  const seen = new Set();
  const merged = [];

  selectedGraphSolutionIds.forEach((id) => {
    const solution = graphSolutionMap.get(id);
    if (!solution || !Array.isArray(solution.components)) return;

    solution.components.forEach((comp) => {
      const key = comp?.name?.trim()?.toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(comp);
    });
  });

  return merged;
}

// retrieves the currently selected solutions based on the selected IDs in the sidebar, this is used when generating the graph to know which solution data to include in the graphing process
function getSelectedSolutions() {
  const selectedSolutions = [];

  selectedGraphSolutionIds.forEach((id) => {
    const solution = graphSolutionMap.get(id);
    if (solution) {
      selectedSolutions.push(solution);
    }
  });

  return selectedSolutions;
}

// populates the axis dropdowns with the components from the currently selected solutions, this is called whenever the selected solutions change to update the available options for graph axes
function populateAxisDropdowns(components) {
  const xDropdown = document.getElementById("x-axis-dropdown");
  const yDropdown = document.getElementById("y-axis-dropdown");
  const zDropdown = document.getElementById("z-axis-dropdown");

  if (!xDropdown || !yDropdown || !zDropdown) return;

  const previousX = xDropdown.value;
  const previousY = yDropdown.value;
  const previousZ = zDropdown.value;

  xDropdown.innerHTML = buildDropdownOptions(components, PLACEHOLDER.x);
  yDropdown.innerHTML = buildDropdownOptions(components, PLACEHOLDER.y);
  zDropdown.innerHTML = buildDropdownOptions(components, PLACEHOLDER.z);

  if ([...xDropdown.options].some((opt) => opt.value === previousX)) {
    xDropdown.value = previousX;
  }
  if ([...yDropdown.options].some((opt) => opt.value === previousY)) {
    yDropdown.value = previousY;
  }
  if ([...zDropdown.options].some((opt) => opt.value === previousZ)) {
    zDropdown.value = previousZ;
  }
}

// resets the axis dropdowns to only show the placeholder option, this is called when no solutions are selected to clear the available options since there are no components to choose from
function resetAxisDropdowns() {
  const xDropdown = document.getElementById("x-axis-dropdown");
  const yDropdown = document.getElementById("y-axis-dropdown");
  const zDropdown = document.getElementById("z-axis-dropdown");

  if (xDropdown) xDropdown.innerHTML = `<option value="">${PLACEHOLDER.x}</option>`;
  if (yDropdown) yDropdown.innerHTML = `<option value="">${PLACEHOLDER.y}</option>`;
  if (zDropdown) zDropdown.innerHTML = `<option value="">${PLACEHOLDER.z}</option>`;
}

// Uses resetAxisDropdowns to clear the dropdowns when no solutions are selected, and otherwise populates them with the components from the selected solutions
function rebuildAxisDropdowns() {
  if (selectedGraphSolutionIds.size === 0) {
    resetAxisDropdowns();
    return;
  }

  populateAxisDropdowns(getMergedSelectedComponents());
}

// rebuilds the sweep configuration blocks for each selected solution, this allows users to set custom sweep ranges for each solution when generating graphs, and is called whenever the selected solutions change to update the available sweep configurations
function rebuildSweepBlocks() {
  const container = document.getElementById("target-blocks-all");
  if (!container) return;

  container.innerHTML = "";

  if (selectedGraphSolutionIds.size === 0) {
    container.innerHTML = `
      <p style="color:#888; font-size:13px; margin:8px 4px;">
        Select solutions from the sidebar to configure sweep ranges.
      </p>
    `;
    return;
  }

  selectedGraphSolutionIds.forEach((id) => {
    const solution = graphSolutionMap.get(id);
    if (!solution) return;

    const safeName = escapeHtmlText(solution.solutionName || "Unnamed Solution");

    const block = document.createElement("div");
    block.className = "target-setting-block";
    block.setAttribute("data-sweep-solution-id", id);

    block.innerHTML = `
      <p class="target-component-title">${safeName}</p>
      <div class="target-block-row">
        <div class="target-block-min">
          <p class="target-label">Start</p>
          <input class="styled-input target-input" type="number" placeholder="0" value="0">
        </div>
        <div class="target-block-max">
          <p class="target-label">Stop</p>
          <input class="styled-input target-input" type="number" placeholder="100" value="100">
        </div>
        <div class="target-block-step">
          <p class="target-label">Step</p>
          <input class="styled-input target-input" type="number" placeholder="10" value="10">
        </div>
      </div>
    `;

    container.appendChild(block);
  });
}

// gets the sweep configuration values from the input fields for each selected solution, this is used when generating the graph to know what ranges to sweep each solution over if the user has configured any sweeps
function getSweepConfigs() {
  const configs = [];

  document.querySelectorAll("#target-blocks-all .target-setting-block").forEach((block) => {
    const id = block.getAttribute("data-sweep-solution-id");
    const solution = graphSolutionMap.get(id);
    const inputs = block.querySelectorAll("input");

    configs.push({
      id,
      solutionName: solution?.solutionName || "",
      start: parseFloat(inputs[0]?.value) || 0,
      stop: parseFloat(inputs[1]?.value) || 0,
      step: parseFloat(inputs[2]?.value) || 1,
    });
  });

  return configs;
}

// toggles the selection of a solution when its card in the sidebar is clicked, this updates the set of selected solution IDs and triggers a rebuild of the axis dropdowns and sweep configuration blocks to reflect the new selection
function toggleGraphSolutionSelection(card, solution) {
  if (!solution?.id) return;

  if (selectedGraphSolutionIds.has(solution.id)) {
    selectedGraphSolutionIds.delete(solution.id);
    card.classList.remove("selected-solution");
  } else {
    selectedGraphSolutionIds.add(solution.id);
    card.classList.add("selected-solution");
  }

  rebuildAxisDropdowns();
  rebuildSweepBlocks();
}

// renders the list of solutions in the sidebar with their names, tags, and components, and sets up click handlers for selecting solutions, this is called on page load and whenever the database is updated to ensure the sidebar reflects the current state of the database
async function renderGraphSidebar() {
  try {
    const allSolutions = await getAllSolutionsFromDb();
    const sidebarList = document.getElementById("sidebar-solution-list");
    if (!sidebarList) return;

    sidebarList.innerHTML = "";
    graphSolutionMap.clear();
    selectedGraphSolutionIds.clear();

    allSolutions.forEach((solution) => {
      graphSolutionMap.set(solution.id, solution);

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

// sets the graph mode to 2D, this updates the active state of the mode buttons and hides the Z-axis dropdown since it's not needed for 2D graphs
function set2DMode() {
  const btn2d = document.getElementById("2d-btn");
  const btn3d = document.getElementById("3d-btn");
  const settings3d = document.getElementById("3d-settings");
  const zDropdown = document.getElementById("z-axis-dropdown");

  if (btn2d) {
    btn2d.classList.add("dimension-btn-active");
    btn2d.classList.remove("dimension-btn-not-active");
  }

  if (btn3d) {
    btn3d.classList.add("dimension-btn-not-active");
    btn3d.classList.remove("dimension-btn-active");
  }

  if (settings3d) {
    settings3d.classList.add("dimension-setting-not-active");
    settings3d.classList.remove("dimension-setting-active");
  }

  if (zDropdown) {
    zDropdown.value = "";
  }
}

// sets the graph mode to 3D, this updates the active state of the mode buttons and shows the Z-axis dropdown since it's needed for 3D graphs
function set3DMode() {
  const btn2d = document.getElementById("2d-btn");
  const btn3d = document.getElementById("3d-btn");
  const settings3d = document.getElementById("3d-settings");

  if (btn3d) {
    btn3d.classList.add("dimension-btn-active");
    btn3d.classList.remove("dimension-btn-not-active");
  }

  if (btn2d) {
    btn2d.classList.add("dimension-btn-not-active");
    btn2d.classList.remove("dimension-btn-active");
  }

  if (settings3d) {
    settings3d.classList.add("dimension-setting-active");
    settings3d.classList.remove("dimension-setting-not-active");
  }
}

// sets up the event listeners for the 2D and 3D mode buttons, this is called on page load to ensure the buttons are interactive and can toggle the graph mode correctly
function setupModeButtons() {
  const btn2d = document.getElementById("2d-btn");
  const btn3d = document.getElementById("3d-btn");

  if (btn2d) {
    btn2d.addEventListener("click", set2DMode);
  }

  if (btn3d) {
    btn3d.addEventListener("click", set3DMode);
  }
}

// renders the generated graph HTML into the graph output box, and ensures that any scripts included in the graph HTML are executed properly by creating new script elements, this is used to display the generated graph after receiving the HTML from the server
function renderGraphResultFromHtml(graphHtml) {
  const graphBox = document.getElementById("graph-output-box");
  if (!graphBox) {
    console.error("Missing #graph-output-box");
    return;
  }

  graphBox.innerHTML = graphHtml || "";

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
}

// renders the status text below the graph with information about the generated graph such as the number of points plotted, how many targets were balanced, and whether it's a 2D or 3D graph, this is called after generating the graph
function renderStatusText(data) {
  const codeOutputBox = document.getElementById("code-output-box");
  if (!codeOutputBox) return;

  const lines = [
    `${data.num_points ?? 0} plotted points`,
    `${data.num_balanced ?? 0} / ${data.num_total ?? 0} targets balanced`,
    data.is_3d ? "3D graph" : "2D graph",
  ];

  codeOutputBox.innerHTML = lines.map((line) => `<p>${escapeHtmlText(line)}</p>`).join("");
}

// generates the graph based on the selected solutions, configured axes, and sweep ranges by sending a request to the server with the necessary data, this is called when the user clicks the "Generate Graph" button
async function generateGraph() {
  const xAxis = document.getElementById("x-axis-dropdown")?.value || "";
  const yAxis = document.getElementById("y-axis-dropdown")?.value || "";
  const zAxis = is3DMode() ? (document.getElementById("z-axis-dropdown")?.value || "") : "";

  if (selectedGraphSolutionIds.size === 0) {
    alert("Select at least one solution from the sidebar.");
    return;
  }

  if (!xAxis || !yAxis) {
    alert("Please select both X and Y axes.");
    return;
  }

  if (is3DMode() && !zAxis) {
    alert("Please select a Z axis for 3D mode.");
    return;
  }

  try {
    const payload = {
      x_axis: xAxis,
      y_axis: yAxis,
      selected_solutions: getSelectedSolutions(),
      sweep_configs: getSweepConfigs(),
    };

    if (is3DMode()) {
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
      alert(data.error || "Graph generation failed.");
      return;
    }

    renderGraphResultFromHtml(data.graph_html || "");
    renderStatusText(data);

    console.log("Graph generated successfully:", data);
  } catch (err) {
    console.error("Error generating graph:", err);
    alert("Failed to generate graph.");
  }
}

// downloads the currently displayed graph as a PNG image by using Plotly's downloadImage function, this is called when the user clicks the "Download Graph" button
async function downloadGraph() {
  const graphBox = document.getElementById("graph-output-box");
  if (!graphBox || !graphBox.innerHTML.trim()) {
    alert("Generate a graph first.");
    return;
  }

  const plotElement = graphBox.querySelector(".js-plotly-plot");
  if (!plotElement) {
    alert("Could not find a rendered graph to download.");
    return;
  }

  if (typeof Plotly === "undefined") {
    alert("Plotly is not loaded yet.");
    return;
  }

  try {
    await Plotly.downloadImage(plotElement, {
      format: "png",
      filename: "afl-graph",
      width: 1400,
      height: 900,
      scale: 2
    });
  } catch (err) {
    console.error("Error downloading graph:", err);
    alert("Failed to download graph.");
  }
}

// initializes the graph page by setting up event listeners, rendering the sidebar, and populating the axis dropdowns based on the current state of the database, this is called when the DOM content is loaded to prepare the page for user interaction
document.addEventListener("DOMContentLoaded", () => {
  setupModeButtons();

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
      resetAxisDropdowns();
      rebuildSweepBlocks();
      set2DMode();
    })
    .catch((error) => {
      console.error("Failed to initialize database on graph page:", error);
    });
});