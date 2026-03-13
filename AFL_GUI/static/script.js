// UUID that is loaded
let currentSolutionId = null;
// database stuff (indexdb)
const dbName = "solutionDatabase";
const storeName = "savedSolutions";
let dbInstance;

// bool to see if you have any unsaved changes
let hasUnsavedChanges = false;



function openTab(evt, tabName) {

    // stop if it is not saved
    if (hasUnsavedChanges) {
        const confirmLeave = confirm("You have unsaved changes. Do you want to leave without saving?");
        if (!confirmLeave) {
            return;
        }
    }

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

// // Get the element with id="defaultOpen" and click on it
// document.getElementById("defaultOpen").click();

// add new component block
function addComponent() {

    // set something changed
    hasUnsavedChanges = true;

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

    // set something changed
    hasUnsavedChanges = true;

    const componentBlock = buttonElement.closest('.content-block');
    if (componentBlock) {
        componentBlock.remove();
    }
}

// add new tag

function addTag() {

    // set something changed
    hasUnsavedChanges = true;

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

    // set something changed
    hasUnsavedChanges = true;

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
async function selectSidebarSolution(clickedElement) {

    // stop if it is not saved
    if (hasUnsavedChanges) {
        const confirmLeave = confirm("You have unsaved changes. Do you want to leave without saving?");
        if (!confirmLeave) {
            return;
        }
    }

    // do the visual selection
    const allSolutions = document.querySelectorAll('.template-existing-stcock-creationpage');
    for (let i = 0; i < allSolutions.length; i++) {
        allSolutions[i].classList.remove('selected-solution');
    }
    clickedElement.classList.add('selected-solution');

    // 2. Fetch and load the data
    const solutionId = clickedElement.getAttribute('data-solution-id');
    
    if (solutionId) {
        try {
            const solutionJson = await getSolutionFromDb(solutionId);
            loadSolutionIntoEditor(solutionJson);
        } catch (error) {
            console.error("Error loading solution from database:", error);
            alert("Could not load the selected solution.");
        }
    }
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

    // stop if it is not saved
    if (hasUnsavedChanges) {
        const confirmLeave = confirm("You have unsaved changes. Do you want to leave without saving?");
        if (!confirmLeave) {
            return;
        }
    }

    // reset uuid loaded tracker
    currentSolutionId = null;

    // Un-select active sidebar
    const allSolutions = document.querySelectorAll('.template-existing-stcock-creationpage');
    allSolutions.forEach(card => card.classList.remove('selected-solution'));

    // clear name
    const nameInput = document.querySelector('.styled-input[placeholder="Enter solution name"]');
    if (nameInput) nameInput.value = '';
    
    // clear tags
    const tagInput = document.getElementById('tagInput');
    if (tagInput) tagInput.value = '';
    
    const tagContainer = document.getElementById('tagContainer');
    if (tagContainer) tagContainer.innerHTML = '';
    
    // reset components
    const tabContainer = document.getElementById("Tab1");
    const contentBlocks = tabContainer.querySelectorAll('.content-block');
    
    if (contentBlocks.length > 0) {
        const firstBlock = contentBlocks[0];
        const inputs = firstBlock.querySelectorAll('input, select');
        inputs.forEach(input => input.value = '');
        
        for (let i = 1; i < contentBlocks.length; i++) {
            contentBlocks[i].remove();
        }
    }
}

function toggleTagFilter(clickedTag) {
    clickedTag.classList.toggle('active-filter');
    filterSolutions(); 
}

function filterSolutions() {
    const searchInput = document.getElementById('solutionSearch').value.toLowerCase();
    
    const activeFilters = document.querySelectorAll('.filter-tag.active-filter');
    const filterTexts = Array.from(activeFilters).map(tag => tag.textContent.toLowerCase());
    
    console.log("Filtering by text:", searchInput, "and tags:", filterTexts);
}




// saving solutions

function extractSolutionData() {
    const nameInput = document.querySelector('input[placeholder="Enter solution name"]');
    const solutionName = nameInput ? nameInput.value.trim() : "";

    // get tags
    const tagElements = document.querySelectorAll('#tagContainer .tag-text');
    const tags = Array.from(tagElements).map(tag => tag.textContent);

    // Get Components
    const components = [];
    const contentBlocks = document.querySelectorAll('#Tab1 .content-block');

    contentBlocks.forEach(block => {
        const componentInput = block.querySelector('input[placeholder="Enter Component..."]');
        const amountInput = block.querySelector('input[placeholder="Enter Amount..."]');
        const unitSelect = block.querySelector('select');

        if (componentInput && componentInput.value.trim() !== "") {
            components.push({
                name: componentInput.value.trim(),
                amount: amountInput ? amountInput.value.trim() : "",
                unit: unitSelect ? unitSelect.value : ""
            });
        }
    });

    // uuid
    const finalId = currentSolutionId ? currentSolutionId : crypto.randomUUID();

    return {
        id: finalId,
        solutionName: solutionName,
        tags: tags,
        components: components,
    };
}



// setup indexdb



function initDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = function(event) {
            dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains(storeName)) {
                // this makes it know to seperate and update based on the id
                dbInstance.createObjectStore(storeName, { keyPath: "id" });
            }
        };

        request.onsuccess = function(event) {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = function(event) {
            console.error("IndexedDB initialization error:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// Start DB connection when the page loads
document.addEventListener("DOMContentLoaded", () => {
    // load in the database and load the sidebar
    initDb().then(() => {
        console.log("Database ready!");
        renderSidebarSolutions();
    });

    const editorTab = document.getElementById('Tab1');
    if (editorTab) {
        editorTab.addEventListener('input', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
                hasUnsavedChanges = true;
            }
        });
    }

    // stop from changing pages if you are saving
    const navLinks = document.querySelectorAll('#top-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            if (hasUnsavedChanges) {
                const confirmLeave = confirm("You have unsaved changes. Do you want to leave without saving?");
                if (!confirmLeave) {
                    event.preventDefault();
                }
            }
        });
    });
});


// saving the solution

async function saveSolution() {
    const solutionJson = extractSolutionData();

    // make sure it isn't empty
    if (!solutionJson.solutionName) {
        alert("There was no solution name!!");
        return;
    }

    try {
        // make sure indexdb is ready
        if (!dbInstance) {
            await initDb();
        }

        const transaction = dbInstance.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);

        // make a new item or store it based on id
        const request = store.put(solutionJson);

        request.onsuccess = function() {
            console.log("Successfully saved to IndexedDB:", solutionJson);
            alert("Solution saved successfully!");
            
            // update the sidebar
            renderSidebarSolutions();

            // reset after saved
            hasUnsavedChanges = false;
        };

        request.onerror = function() {
            console.error("Error saving the solution.");
            alert("Failed to save solution.");
        };

    } catch (error) {
        console.error("Database transaction failed", error);
    }
}


// loading the solution from db

async function getSolutionFromDb(solutionId) {
    return new Promise(async (resolve, reject) => {
        if (!dbInstance) {
            await initDb();
        }

        const transaction = dbInstance.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(solutionId);

        request.onsuccess = (event) => {
            const solutionJson = event.target.result;
            resolve(solutionJson);
        };

        request.onerror = (event) => {
            console.error("Failed to fetch solution:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}



function loadSolutionIntoEditor(solutionJson) {
    if (!solutionJson) return;

    // reset on a new solution
    hasUnsavedChanges = false;

    // update current tracking id
    currentSolutionId = solutionJson.id;

    // get solution name
    const nameInput = document.querySelector('input[placeholder="Enter solution name"]');
    if (nameInput) {
        nameInput.value = solutionJson.solutionName || "";
    }

    // get Tags
    const tagContainer = document.getElementById("tagContainer");
    if (tagContainer) {
        tagContainer.innerHTML = ""; // Clear existing tags first
    }
    
    if (solutionJson.tags && solutionJson.tags.length > 0) {
        solutionJson.tags.forEach(tagString => {
            const newTagPill = document.createElement("div");
            newTagPill.className = "tag-pill";
            
            const tagLabel = document.createElement("span");
            tagLabel.textContent = tagString;
            tagLabel.className = "tag-text";
            
            const removeIcon = document.createElement("span");
            removeIcon.className = "tag-remove";
            removeIcon.innerHTML = "&times;";
            removeIcon.onclick = function() {
                removeTag(this);
            };

            newTagPill.appendChild(tagLabel);
            newTagPill.appendChild(removeIcon);
            tagContainer.appendChild(newTagPill);
        });
    }

    // do components
    const existingBlocks = document.querySelectorAll('#Tab1 .content-block');
    // clear them out first
    existingBlocks.forEach(block => block.remove());

    const container = document.getElementById("Tab1");
    const addButton = document.querySelector("#Tab1 .add-row-button");

    if (solutionJson.components && solutionJson.components.length > 0) {
        solutionJson.components.forEach((comp, index) => {
            const count = index + 1;
            const div = document.createElement("div");
            div.className = "content-block";
            
            // 1. Keep the HTML string clean and easy to edit
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
                <input type="text" id="component-${count}" class="styled-input" placeholder="Enter Component..." value="${comp.name || ''}">
                <div style="margin-bottom: 10px;"></div>
                <div style="display: flex;">
                    <div class="col" style="flex: 3; margin-right: 20px;">
                        <label class="input-label">Amount</label>
                        <input type="text" id="amount-${count}" class="styled-input" placeholder="Enter Amount..." value="${comp.amount || ''}">
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
            
            // 2. Insert the block into the container
            container.insertBefore(div, addButton);

            // 3. Set the dropdown value via JavaScript
            const unitSelect = document.getElementById(`unit-${count}`);
            if (unitSelect && comp.unit) {
                unitSelect.value = comp.unit;
            }
        });
    }else {
        // If there are no components for some reason, just add an empty row
        addComponent(); 
    }
}


// Get all saved solutions from the database

function getAllSolutionsFromDb() {
    return new Promise(async (resolve, reject) => {
        if (!dbInstance) {
            await initDb();
        }

        const transaction = dbInstance.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        
        // get all of the items
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error("Failed to fetch all solutions:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}



// load soltuions into sidebar


function escapeHtmlText(unsafeText) {
    if (!unsafeText) return "";
    return unsafeText
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

async function renderSidebarSolutions() {
    try {
        const allSolutions = await getAllSolutionsFromDb();
        const sidebarList = document.getElementById('sidebar-solution-list');

        if (!sidebarList) return;

        // Clear out the hardcoded placeholder HTML
        sidebarList.innerHTML = '';

        allSolutions.forEach(solution => {
            const card = document.createElement('div');
            card.className = 'template-existing-stcock-creationpage';
            
            // Crucial: attach the ID to the card so we can click it later
            card.setAttribute('data-solution-id', solution.id);
            
            // Attach the click event directly
            card.onclick = function() { 
                selectSidebarSolution(this); 
            };

            // 1. Build the Tags HTML string
            let tagsHtml = '<div class="tag-container">';
            if (solution.tags && solution.tags.length > 0) {
                solution.tags.forEach(tag => {
                    // Changed to a span and updated the class name
                    tagsHtml += `<span class="sidebar-tag">${escapeHtmlText(tag)}</span>`;
                });
            }
            tagsHtml += '</div>';

            // 2. Build the Components HTML string
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

            // 3. Assemble the full card template
            card.innerHTML = `
                <div class="sidebar-header">
                    <p class="sidebar-solution-name"><strong>${escapeHtmlText(solution.solutionName) || '[Unnamed Solution]'}</strong></p>
                    <div class="sidebar-actions">
                        <button class="icon-button" onclick="cloneSolution(event, '${solution.id}')" title="Clone Solution">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                            </svg>
                        </button>
                        <button class="icon-button delete-icon" onclick="deleteSidebarSolution(event, '${solution.id}')" title="Delete Solution">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>
                ${tagsHtml}
                ${componentsHtml}
            `;

            sidebarList.appendChild(card);
        });

    } catch (error) {
        console.error("Error rendering sidebar solutions:", error);
    }
}


// deleting in the sidebar

async function deleteSidebarSolution(event, solutionId) {
    // Stop the card's onclick event from firing
    event.stopPropagation(); 

    const confirmDelete = confirm("Are you sure you want to delete this solution?");
    if (!confirmDelete) return;

    try {
        if (!dbInstance) await initDb();

        const transaction = dbInstance.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        
        const request = store.delete(solutionId);

        request.onsuccess = () => {
            console.log("Solution deleted!!");
            
            // Refresh the sidebar to remove the card
            renderSidebarSolutions();
            
            // if it was the selected one then clear it
            if (currentSolutionId === solutionId) {
                hasUnsavedChanges = false; 
                createNewSolution();
            }
        };

        request.onerror = (event) => {
            console.error("Error deleting solution:", event.target.errorCode);
            alert("Failed to delete the solution.");
        };
    } catch (error) {
        console.error("Database error during deletion:", error);
    }
}


async function cloneSolution(event, solutionId) {
    // Stop the card's onclick event from firing
    event.stopPropagation();

    // Guardrail: don't wipe out their current work without asking
    if (hasUnsavedChanges) {
        const confirmLeave = confirm("You have unsaved changes. Do you want to leave without saving?");
        if (!confirmLeave) return;
    }

    try {
        // get original data
        const originalSolution = await getSolutionFromDb(solutionId);
        
        if (!originalSolution) {
            alert("Could not find the original solution to clone.");
            return;
        }

        // clone it all
        const clonedSolution = {
            ...originalSolution, 
            id: crypto.randomUUID(), // new uuid
            solutionName: `${originalSolution.solutionName || "Unnamed Solution"} (Copy)`,
            lastEdited: new Date().toISOString()
        };

        // save to database
        const transaction = dbInstance.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(clonedSolution);

        request.onsuccess = () => {
            console.log("Solution cloned successfully.");

            renderSidebarSolutions();

            hasUnsavedChanges = false;
            loadSolutionIntoEditor(clonedSolution);
        };

        request.onerror = (event) => {
            console.error("Error saving cloned solution:", event.target.errorCode);
            alert("Failed to clone the solution.");
        };

        // do the visual selection
        const allSolutions = document.querySelectorAll('.template-existing-stcock-creationpage');
        for (let i = 0; i < allSolutions.length; i++) {
            allSolutions[i].classList.remove('selected-solution');
        }
        clickedElement.classList.add('selected-solution');
        
    } catch (error) {
        console.error("Error during cloning:", error);
    }
}