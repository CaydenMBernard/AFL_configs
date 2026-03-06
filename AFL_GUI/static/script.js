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
        <div class="component-header">
            <label class="input-label">Component</label>
            <button class="delete-button" type="button" onclick="deleteComponent(this)" aria-label="Delete Component">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z" fill="currentColor"/>
                    <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                </svg>
            </button>
        </div>
        <input type="text" id="component-${count}" class="styled-input" placeholder="Enter Component...">
        <!-- add space -->
        <div style="margin-bottom: 10px;">
        </div>
        <div style="display: flex;">
            <div class="col" style="flex: 3; margin-right: 20px;">
                <label class="input-label">Amount</label>
                <input type="text" id="amount-${count}" class="styled-input" placeholder="Enter Amount...">
            </div>
            <div class="col" style="flex: 1; margin-left: 20px;">
            <label class="input-label">Unit</label>
            <select id="unit-${count}" class="styled-input">
                <option value="" disabled selected>Select Unit...</option>
                <optgroup label="Mass">
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                </optgroup>
                <optgroup label="Volume">
                    <option value="ul">ul</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                </optgroup>
                <optgroup label="Concentration">
                    <option value="mg/ml">mg/ml</option>
                    <option value="g/L">g/L</option>
                </optgroup>
            </select>
            </div>
        </div>`;

    container.insertBefore(div, button);
}


// delete component block
function deleteComponent(buttonElement) {
    const componentBlock = buttonElement.closest('.content-block');
    if (componentBlock) {
        componentBlock.remove();
    }
}

// add new tag

function addTag() {
    const tagInput = document.getElementById("tagInput");
    const tagContainer = document.getElementById("tagContainer");
    const dataList = document.getElementById("existingTags");
    const tagString = tagInput.value.trim();

    if (tagString !== "") {
        // Create the pill container
        const newTagPill = document.createElement("div");
        newTagPill.className = "tag-pill";
        
        // Add the text
        const tagLabel = document.createElement("span");
        tagLabel.textContent = tagString;
        tagLabel.className = "tag-text";
        
        // Add the remove button
        const removeIcon = document.createElement("span");
        removeIcon.className = "tag-remove";
        removeIcon.innerHTML = "&times;";
        removeIcon.onclick = function() {
            removeTag(this);
        };

        // Assemble and append
        newTagPill.appendChild(tagLabel);
        newTagPill.appendChild(removeIcon);
        tagContainer.appendChild(newTagPill);

        // Add to datalist if not already present
        let optionExists = false;
        for (let i = 0; i < dataList.options.length; i++) {
            if (dataList.options[i].value === tagString) {
                optionExists = true;
                break;
            }
        }
        if (!optionExists) {
            const newOption = document.createElement("option");
            newOption.value = tagString;
            dataList.appendChild(newOption);
        }

        // Clear the input field
        tagInput.value = "";
    }
}

function removeTag(targetElement) {
    const selectedPill = targetElement.closest('.tag-pill');
    if (selectedPill) {
        selectedPill.remove();
    }
    // remove from datalist every time for now, needs to be fixed later
    const dataList = document.getElementById("existingTags");
    while (dataList.firstChild) {
        dataList.removeChild(dataList.firstChild);
    }
}

// enter to add tag
function handleTagEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault(); 
        addTag();
    }
}


// solution selection
function selectSidebarSolution(clickedElement) {
    const allSolutions = document.querySelectorAll('.template-existing-stcock-creationpage');
    
    for (let i = 0; i < allSolutions.length; i++) {
        allSolutions[i].classList.remove('selected-solution');
    }

    clickedElement.classList.add('selected-solution');
}




// sidebar solution actions
function deleteSidebarSolution(event) {
    event.stopPropagation(); 
    const card = event.target.closest('.template-existing-stcock-creationpage');
    if (card) {
        card.remove();
    }
}

function cloneSolution(event) {
    event.stopPropagation();
    console.log("Clone button clicked!");
}




// sidebar header actions

function createNewSolution() {
    // Un-select any active sidebar card
    const allSolutions = document.querySelectorAll('.template-existing-stcock-creationpage');
    allSolutions.forEach(card => card.classList.remove('selected-solution'));

    // Clear the main solution name input
    const nameInput = document.querySelector('.styled-input[placeholder="Enter solution name"]');
    if (nameInput) nameInput.value = '';
    
    // Clear the tags
    const tagInput = document.getElementById('tagInput');
    if (tagInput) tagInput.value = '';
    
    const tagContainer = document.getElementById('tagContainer');
    if (tagContainer) tagContainer.innerHTML = '';
    
    // Reset components to a single empty block
    const tabContainer = document.getElementById("Tab1");
    const contentBlocks = tabContainer.querySelectorAll('.content-block');
    
    if (contentBlocks.length > 0) {
        // Keep the first block and clear its values
        const firstBlock = contentBlocks[0];
        const inputs = firstBlock.querySelectorAll('input, select');
        inputs.forEach(input => input.value = '');
        
        // Remove any additional component blocks
        for (let i = 1; i < contentBlocks.length; i++) {
            contentBlocks[i].remove();
        }
    }
}

function toggleTagFilter(clickedTag) {
    // Toggles the visual 'active' state on the pill
    clickedTag.classList.toggle('active-filter');
    
    // Triggers the search filter function
    filterSolutions(); 
}

function filterSolutions() {
    const searchInput = document.getElementById('solutionSearch').value.toLowerCase();
    
    // Gather all currently active filter tags
    const activeFilters = document.querySelectorAll('.filter-tag.active-filter');
    const filterTexts = Array.from(activeFilters).map(tag => tag.textContent.toLowerCase());
    
    // Placeholder log - this will run every time you type or click a tag
    console.log("Filtering by text:", searchInput, "and tags:", filterTexts);
}