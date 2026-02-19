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
