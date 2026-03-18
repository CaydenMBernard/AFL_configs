// UUID that is loaded
let currentSolutionId = null;
// database stuff (indexdb)
const dbName = "solutionDatabase";
const storeName = "savedSolutions";
let dbInstance;

// bool to see if you have any unsaved changes
let hasUnsavedChanges = false;

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

// General delete function for all screen elements
function removeElement(buttonElement, containerClassName) {

    const containerToDelete = buttonElement.closest("." + containerClassName);

    // something in the edit screen has changed
    if (containerClassName == "content-block") {
        setUnsavedState(true);
    }
    
    if (containerToDelete) {
        containerToDelete.remove();
    } else {
        console.error("No container found!");
    }
}


function setUnsavedState(isUnsaved) {
    hasUnsavedChanges = isUnsaved;
    
    const saveBtn = document.querySelector('.save-solution-button');
    if (saveBtn) {
        if (isUnsaved) {
            saveBtn.classList.add('unsaved');
            // saveBtn.textContent = 'Save Solution *';
        } else {
            saveBtn.classList.remove('unsaved');
            // saveBtn.textContent = 'Save Solution';
        }
    }
}

// add new component block
function addComponent() {

    // set something changed
    setUnsavedState(true);

    var container = document.getElementById("Tab1");
    var button = document.querySelector("#Tab1 .add-row-button");
    var count = document.querySelectorAll("#Tab1 .content-block").length + 1;

    var div = document.createElement("div");
    div.className = "content-block";
    div.innerHTML = `
        <div class="component-header">
            <label class="input-label">Component</label>

            ${count > 1 ? `
            <button class="delete-button" type="button" onclick="removeElement(this, 'content-block')" aria-label="Delete Component">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z" fill="currentColor"/>
                    <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                </svg>
            </button>
            ` : ''}

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

    // set something changed
    setUnsavedState(true);

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



async function selectSidebarSolution(clickedElement) {

    // stop if it is not saved
    if (hasUnsavedChanges) {
        const confirmLeave = confirm("You have unsaved changes. Do you want to leave without saving?");
        if (!confirmLeave) {
            return;
        }
    }

    // visual selection
    const allSolutions = document.querySelectorAll('.template-existing-stock-creationpage');
    allSolutions.forEach(solution => {
        solution.classList.remove('selected-solution');
    });
    clickedElement.classList.add('selected-solution');

    // load from backend
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
    const allSolutions = document.querySelectorAll('.template-existing-stock-creationpage');
    allSolutions.forEach(card => card.classList.remove('selected-solution'));

    // clear data from editor
    const nameInput = document.querySelector('.styled-input[placeholder="Enter solution name"]');
    if (nameInput) nameInput.value = '';
    
    const tagInput = document.getElementById('tagInput');
    if (tagInput) tagInput.value = '';
    
    const tagContainer = document.getElementById('tagContainer');
    if (tagContainer) tagContainer.innerHTML = '';
    
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



// get data into and out of json format


function extractSolutionData() {
    const nameInput = document.querySelector('input[placeholder="Enter solution name"]');
    const solutionName = nameInput ? nameInput.value.trim() : "";

    // get tags
    const tagElements = document.querySelectorAll('#tagContainer .base-tag');
    const tags = Array.from(tagElements).map(tag => tag.childNodes[0].textContent.trim());

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


function loadSolutionIntoEditor(solutionJson) {
    if (!solutionJson) return;

    // reset on a new solution
    setUnsavedState(false);

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
    
    // create the tags
    if (solutionJson.tags && solutionJson.tags.length > 0) {
        solutionJson.tags.forEach(tagString => {
            const newTagPill = document.createElement("div");
            newTagPill.className = "base-tag";
            
            newTagPill.textContent = tagString;
            
            const removeIcon = document.createElement("span");
            removeIcon.className = "tag-remove";
            removeIcon.innerHTML = "&times;";
            removeIcon.onclick = function() {
                removeElement(this, 'base-tag');
            };

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
            
            div.innerHTML = `
                <div class="component-header">
                    <label class="input-label">Component</label>

                    ${count > 1 ? `
                    <button class="delete-button" type="button" onclick="removeElement(this, 'content-block')" aria-label="Delete Component">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z" fill="currentColor"/>
                            <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                        </svg>
                    </button>
                    ` : ''}

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
            
            // add the block
            container.insertBefore(div, addButton);

            // do the dropdown options
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


async function renderSidebarSolutions() {
    try {
        const allSolutions = await getAllSolutionsFromDb();
        const sidebarList = document.getElementById('sidebar-solution-list');

        if (!sidebarList) return;

        // Clear out the hardcoded placeholder HTML
        sidebarList.innerHTML = '';

        allSolutions.forEach(solution => {
            const card = document.createElement('div');
            card.className = 'template-existing-stock-creationpage';
            
            // attach id to the card
            card.setAttribute('data-solution-id', solution.id);
            
            card.onclick = function() { 
                selectSidebarSolution(this); 
            };

            // make tags
            let tagsHtml = '<div class="tag-container">';
            if (solution.tags && solution.tags.length > 0) {
                solution.tags.forEach(tag => {
                    tagsHtml += `<div class="base-tag">${escapeHtmlText(tag)}</div>`;
                });
            }
            tagsHtml += '</div>';

            // make the componentss
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

            // make the cards
            card.innerHTML = `
                <div class="sidebar-solution-header">
                    <p class="sidebar-solution-name"><strong>${escapeHtmlText(solution.solutionName) || '[Unnamed Solution]'}</strong></p>
                    <div class="sidebar-actions">
                        <button class="icon-button" onclick="cloneSolution(event, '${solution.id}')" title="Clone Solution">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                            </svg>
                        </button>
                        <button class="icon-button delete-icon" onclick="deleteSidebarSolution(event, '${solution.id}')" title="Delete Solution">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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


// Most database things --------------------------------------------------------------------

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
        updateGlobalTags();
        const sidebarCards = document.querySelectorAll('.template-existing-stock-creationpage');
        if (sidebarCards.length > 0) {
            selectSidebarSolution(sidebarCards[0]);
        } else {
            createNewSolution();
        }
    }).catch(error => {
        console.error("Failed to initialize database on load:", error);
    });

    const editorTab = document.getElementById('Tab1');
    if (editorTab) {
        editorTab.addEventListener('input', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
                setUnsavedState(true);
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

        request.onsuccess = async function() {
            console.log("Successfully saved to IndexedDB:", solutionJson);

            currentSolutionId = solutionJson.id;
            setUnsavedState(false);

            await renderSidebarSolutions();
            await updateGlobalTags();

            // select card
            const allSolutions = document.querySelectorAll('.template-existing-stock-creationpage');
            allSolutions.forEach(card => card.classList.remove('selected-solution'));

            const savedCard = document.querySelector(`[data-solution-id="${solutionJson.id}"]`);
            if (savedCard) {
                savedCard.classList.add('selected-solution');
            }

            alert("Solution saved successfully!");
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
            updateGlobalTags();
            
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

    // aask first
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

        // generate the new ID upfront
        const newCloneId = crypto.randomUUID();

        // clone it all
        const clonedSolution = {
            ...originalSolution, 
            id: newCloneId, 
            solutionName: `${originalSolution.solutionName || "Unnamed Solution"} (Copy)`
        };

        // save to database
        const transaction = dbInstance.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(clonedSolution);

        // update backend
        request.onsuccess = async () => {
            console.log("Solution cloned successfully.");

            currentSolutionId = newCloneId;
            
            setUnsavedState(false);
            
            // Load the data into the center editor
            loadSolutionIntoEditor(clonedSolution);

            await renderSidebarSolutions();
            await updateGlobalTags();

            const allSolutions = document.querySelectorAll('.template-existing-stock-creationpage');
            allSolutions.forEach(card => card.classList.remove('selected-solution'));
            
            const clonedCard = document.querySelector(`[data-solution-id="${newCloneId}"]`);
            if (clonedCard) {
                clonedCard.classList.add('selected-solution');
            }
        };

        request.onerror = (event) => {
            console.error("Error saving cloned solution:", event.target.errorCode);
            alert("Failed to clone the solution.");
        };
        
    } catch (error) {
        console.error("Error during cloning:", error);
    }
}



// Updates tag related data (searches through the database)
async function updateGlobalTags() {
    try {
        const allSolutions = await getAllSolutionsFromDb();
        const uniqueTags = new Set();

        // get all tags from all solutions
        allSolutions.forEach(solution => {
            if (solution.tags && Array.isArray(solution.tags)) {
                solution.tags.forEach(tag => {
                    uniqueTags.add(tag.trim().toLowerCase()); 
                });
            }
        });

        const sortedTags = Array.from(uniqueTags).sort();

        // update datalist
        const dataList = document.getElementById("existingTags");
        if (dataList) {
            dataList.innerHTML = "";
            sortedTags.forEach(tag => {
                const option = document.createElement("option");
                option.value = tag;
                dataList.appendChild(option);
            });
        }

        // update the filter
        const filterContainer = document.getElementById("sidebarTagFilters");
        if (filterContainer) {
            // keep what was selected
            const currentlySelected = Array.from(filterContainer.querySelectorAll('.selected'))
                .map(btn => btn.textContent.trim().toLowerCase());

            filterContainer.innerHTML = "";
            
            // build back the tags
            sortedTags.forEach(tag => {
                const btn = document.createElement("button");
                btn.textContent = tag;
                
                // reapply if they were filtering it
                if (currentlySelected.includes(tag)) {
                    btn.className = "base-tag selected";
                } else {
                    btn.className = "base-tag unselected";
                }
                
                // Attach the click event
                btn.onclick = function() { toggleTagFilter(this); };
                
                filterContainer.appendChild(btn);
            });
        }
    } catch (error) {
        console.error("Error updating global tags:", error);
    }
}