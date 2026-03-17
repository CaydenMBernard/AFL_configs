

// General delete function for all screen elements
function removeElement(buttonElement, containerClassName) {

    const containerToDelete = buttonElement.closest("." + containerClassName);
    
    if (containerToDelete) {
        containerToDelete.remove();
    } else {
        console.error("No container found!");
    }
}

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
            <button class="delete-button" type="button" onclick="removeElement(this, 'content-block')" aria-label="Delete Component">
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


// add new tag

function addTag() {
    const tagInput = document.getElementById("tagInput");
    const tagContainer = document.getElementById("tagContainer");
    const dataList = document.getElementById("existingTags");
    const tagString = tagInput.value.trim();

    if (tagString !== "") {
        // create base item
        const newTagPill = document.createElement("div");
        newTagPill.className = "base-tag"; 
        newTagPill.appendChild(document.createTextNode(tagString));
        
        // add remove button
        const removeIcon = document.createElement("span");
        removeIcon.className = "tag-remove";
        removeIcon.innerHTML = "&times;";
        removeIcon.onclick = function() {
            removeElement(this, 'base-tag');
        };


        newTagPill.appendChild(removeIcon);
        tagContainer.appendChild(newTagPill);

        // add to datalist (will be replaced at some point)
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

        // clear input
        tagInput.value = "";
    }
}

// enter to add tag
function handleTagEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault(); 
        addTag();
    }
}



// tag filters

function toggleTagFilter(tagElement) {
    tagElement.classList.toggle('unselected');
    tagElement.classList.toggle('selected');
    filterSolutions();
}



function filterSolutions() {
    // get search string
    const searchInput = document.getElementById("solutionSearch");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

    // get activated tags
    const activeFilters = Array.from(document.querySelectorAll("#sidebarTagFilters .base-tag.selected"))
        .map(tag => tag.textContent.trim().toLowerCase());

    // get all solutions
    const solutionCards = document.querySelectorAll(".template-existing-stock-creationpage");
    
    // look to see if any of the values are in the card to keep them active or hide them
    solutionCards.forEach((card, index) => {
        const cardText = card.textContent.toLowerCase();
        const matchesSearch = cardText.includes(searchTerm);

        const cardTags = Array.from(card.querySelectorAll(".tag-container .base-tag"))
            .map(tag => tag.textContent.trim().toLowerCase());

        const matchesTags = activeFilters.length === 0 || activeFilters.every(filter => cardTags.includes(filter));

        if (matchesSearch && matchesTags) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}



function selectSidebarSolution(clickedElement) {
    const allSolutions = document.querySelectorAll('.template-existing-stock-creationpage');

    allSolutions.forEach(solution => {
        solution.classList.remove('selected-solution');
    });

    clickedElement.classList.add('selected-solution');
}




