function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-button");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Get the element with id="defaultOpen" and click on it
document.getElementById("defaultOpen").click();

// add new component block
function addComponent() {
    var container = document.getElementById("Tab1");
    var button = document.querySelector("#Tab1 .add-row-button");
    var count = document.querySelectorAll("#Tab1 .content-block").length + 1;

    var div = document.createElement("div");
    div.className = "content-block";
    div.innerHTML = `
    <label class="input-label">Component ${count}</label>
    <input type="text" id="component-${count}" class="styled-input" placeholder="Enter Component...">
    <!-- add space -->
    <div style="margin-bottom: 10px;">
    </div>
    <div class="row">
        <div class="col">
            <label class="input-label">Amount</label>
            <input type="text" id ="amount-${count}" class="styled-input" placeholder="Enter Amount...">
        </div>
        <div class="col">
            <label class="input-label">Unit</label>
            <input type="text" id="unit-${count}" class="styled-input" placeholder="Enter Unit...">
        </div>
    </div>`;

    container.insertBefore(div, button);
}

async function testAFL() {
  try {
    const res = await fetch("/api/test");
    const data = await res.json();
    console.log("AFL test:", data);

    alert(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
    alert("Failed to call /api/test");
  }
}

async function saveSolution() {
  const name = document.getElementById("solution-name").value.trim();
  const location = document.getElementById("deck-location").value.trim();

  const blocks = document.querySelectorAll("#Tab1 .content-block");
  const masses = {};

  for (let i = 1; i <= blocks.length; i++) {
    const comp = document.getElementById(`component-${i}`)?.value?.trim() || "";
    const amt  = document.getElementById(`amount-${i}`)?.value?.trim() || "";
    const unit = document.getElementById(`unit-${i}`)?.value?.trim() || "";

    if (!comp) continue;
    if (!amt || !unit) continue;

    masses[comp] = `${amt} ${unit}`;
  }

  const payload = { name, location, masses };

  const res = await fetch("/api/add_stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  alert(JSON.stringify(data, null, 2));
}

async function addStockFromValues(name, location, masses) {
  const payload = { name, location, masses };

  try {
    const res = await fetch("/api/add_stock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("add_stock response:", data);
    return data;
  } catch (err) {
    console.error("Error calling /api/add_stock:", err);
    return { ok: false, error: err.message };
  }
}


async function addTargetsFromValues({
  // Possible needed values
  total_vol,
  fill_fraction,
  swept_conc_name,
  swept_stock_name,
  filler_name,
  conc_min,
  conc_max,
  conc_steps,
  stock_vol_min,
  stock_vol_max,
  stock_vol_steps,
  vol_unit = "ul",
  conc_unit = "mg/ml"
}) {
  const payload = {
  // Possible needed values
    total_vol,
    fill_fraction,
    swept_conc_name,
    swept_stock_name,
    filler_name,
    conc_min,
    conc_max,
    conc_steps,
    stock_vol_min,
    stock_vol_max,
    stock_vol_steps,
    vol_unit,
    conc_unit
  };

  try {
    const res = await fetch("/api/add_targets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("add_targets response:", data);
    return data;
  } catch (err) {
    console.error("Error calling /api/add_targets:", err);
    return { ok: false, error: err.message };
  }
}

async function runBalance() {
  try {
    const res = await fetch("/api/balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();
    console.log("balance response:", data);

    if (!data.ok) {
      alert(JSON.stringify(data, null, 2));
      return data;
    }

    alert(`${data.num_balanced} / ${data.num_total} targets balanced`);
    return data;

  } catch (err) {
    console.error("Error calling /api/balance:", err);
    return { ok: false, error: err.message };
  }
}