// Solution Editor Script
// This script manages the functionality of the solution editor page, including loading and saving solutions to IndexedDB, rendering the list of solutions in the sidebar, handling user interactions for adding/removing components and tags, and ensuring that unsaved changes are tracked to prevent data loss.

// UUID that is loaded
let currentSolutionId = null;

// bool to see if you have any unsaved changes
let hasUnsavedChanges = false;

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

// General delete function for all screen elements
function removeElement(buttonElement, containerClassName) {

    const containerToDelete = buttonElement.closest("." + containerClassName);

    // something in the edit screen has changed
    if (containerClassName === "component-row") {
        setUnsavedState(true);
    }
    
    if (containerToDelete) {
        containerToDelete.remove();
    } else {
        console.error("No container found!");
    }
}

// sets the unsaved state and updates the save button's appearance to indicate whether there are unsaved changes, this is called whenever the user makes a change to the solution data to track whether the current state has unsaved changes
function setUnsavedState(isUnsaved) {
    hasUnsavedChanges = isUnsaved;
    
    const saveBtn = document.querySelector('#saveSolutionButton');
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

// adds a new component row to the components list in the editor, this is called when the user clicks the "Add Component" button to allow them to input details for an additional component in the solution
function addComponent() {
    setUnsavedState(true);

    const container = document.getElementById("componentsList");
    const count = container.querySelectorAll(".component-row").length + 1;

    const div = document.createElement("div");
    div.className = "component-row";
    
    div.innerHTML = `
        <div class="component-col-name">
            <label class="input-label">Component Name</label>
            <input type="text" id="component-${count}" class="styled-input" placeholder="NaCl">
        </div>
        
        <div class="component-col-amount">
            <label class="input-label">Amount</label>
            <input type="number" id="amount-${count}" class="styled-input" placeholder="0.00">
        </div>
        
        <div class="component-col-unit">
            <label class="input-label">Unit</label>
            <select id="unit-${count}" class="styled-input">
                <option value="" disabled selected>Unit...</option>
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
        
        <div class="component-col-action">
            ${count > 1 ? `
            <button class="delete-button" type="button" onclick="removeElement(this, 'component-row')" aria-label="Delete Component">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                    </svg>
            </button>
            ` : '<div style="width: 20px;"></div>'} </div>
    `;

    container.appendChild(div);
}


// adds a new tag to the tag container in the editor, this is called when the user inputs a tag and clicks the "Add Tag" button or presses enter while focused on the tag input
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
        tagContainer.insertBefore(newTagPill, tagInput);

        // clear input
        tagInput.value = "";
    }
}

// adds ability to add tag by pressing enter in the tag input
function handleTagEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault(); 
        addTag();
    }
}



// updates the tag filter buttons in the sidebar to activate or deactivate filtering by the selected tag
function toggleTagFilter(tagElement) {
    tagElement.classList.toggle('unselected');
    tagElement.classList.toggle('selected');
    filterSolutions();
}



// selects a solution from the sidebar and loads it into the editor, this is called when the user clicks on a solution card in the sidebar to view or edit its details
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


// adds a new solution by clearing the editor and resetting the current tracking ID, this is called when the user clicks the "New Solution" button to start creating a new solution from scratch
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
    const nameInput = document.querySelector('input[placeholder="Enter solution name"]');
    if (nameInput) nameInput.value = '';

    const locationInput = document.getElementById('locationInput');
    if (locationInput) locationInput.value = '';
    
    const tagInput = document.getElementById('tagInput');
    if (tagInput) tagInput.value = '';
    
    const tagContainer = document.getElementById('tagContainer');
    if (tagContainer) {
        const existingTags = tagContainer.querySelectorAll('.base-tag');
        existingTags.forEach(tag => tag.remove());
    }
    
    const tabContainer = document.getElementById("Tab1");
    const contentBlocks = document.querySelectorAll('#componentsList .component-row');
    
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

// gets solution data from the editor, formats it into a JSON object, and returns it for saving to the database, this is called when the user clicks the "Save Solution" button to gather all the inputted data into a structured format for storage
function extractSolutionData() {
    const nameInput = document.querySelector('input[placeholder="Enter solution name"]');
    const solutionName = nameInput ? nameInput.value.trim() : "";

    // location
    const locationInput = document.getElementById('locationInput');
    const locationValue = locationInput ? locationInput.value.trim() : "";

    // get tags
    const tagElements = document.querySelectorAll('#tagContainer .base-tag');
    const tags = Array.from(tagElements).map(tag => tag.childNodes[0].textContent.trim());

    // Get Components
    const components = [];
    const contentBlocks = document.querySelectorAll('#componentsList .component-row');

    contentBlocks.forEach(block => {
        const componentInput = block.querySelector('.component-col-name input');
        const amountInput = block.querySelector('.component-col-amount input');
        const unitSelect = block.querySelector('.component-col-unit select');

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
        location: locationValue,
        tags: tags,
        components: components,
    };
}

// loads solution data from a JSON object into the editor, populating all the input fields, tags, and components based on the provided data, this is called after selecting a solution from the sidebar or after cloning a solution to display its details in the editor for viewing or editing
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

    // get location
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.value = solutionJson.location || "";
    }

    // get Tags
    const tagContainer = document.getElementById("tagContainer");
    const tagInput = document.getElementById("tagInput");
    if (tagContainer) {
        const existingTags = tagContainer.querySelectorAll('.base-tag');
        existingTags.forEach(tag => tag.remove()); // make sure only the tags are removed
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
            
            tagContainer.insertBefore(newTagPill, tagInput);
        });
    }

    // do components
    const existingBlocks = document.querySelectorAll('#componentsList .component-row');
    // clear them out first
    existingBlocks.forEach(block => block.remove());

    const container = document.getElementById("componentsList");

    if (solutionJson.components && solutionJson.components.length > 0) {
        solutionJson.components.forEach((comp, index) => {
            const count = index + 1;
            const div = document.createElement("div");
            div.className = "component-row";
            
            div.innerHTML = `
                <div class="component-col-name">
                    <label class="input-label">Component Name</label>
                    <input type="text" id="component-${count}" class="styled-input" placeholder="NaCl" value="${comp.name || ''}">
                </div>
                
                <div class="component-col-amount">
                    <label class="input-label">Amount</label>
                    <input type="number" id="amount-${count}" class="styled-input" placeholder="0.00" value="${comp.amount || ''}" type="number">
                </div>
                
                <div class="component-col-unit">
                    <label class="input-label">Unit</label>
                    <select id="unit-${count}" class="styled-input">
                        <option value="" disabled selected>Unit...</option>
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
                
                <div class="component-col-action">
                    ${count > 1 ? `
                    <button class="delete-button" type="button" onclick="removeElement(this, 'component-row')" aria-label="Delete Component">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                            </svg>
                    </button>
                    ` : '<div style="width: 20px;"></div>'} </div>
            `;
            
            // add the block
            container.appendChild(div);

            const unitSelect = document.getElementById(`unit-${count}`);
            if (unitSelect && comp.unit) {
                unitSelect.value = comp.unit;
            }
        });
    } else {
        // If there are no components for some reason, just add an empty row
        addComponent(); 
    }
}

// renders the list of solutions in the sidebar with their names, tags, and components, and sets up click handlers for selecting solutions, this is called on page load and whenever the database is updated to ensure the sidebar reflects the current state of the database
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
                        <span class="sidebar-component-NAME">${escapeHtmlText(comp.name)}</span> 
                        <span class="div"></span>
                        <span class="sidebar-component-AMNT">${escapeHtmlText(comp.amount)}</span> 
                        <span class="sidebar-component-UNIT">${escapeHtmlText(comp.unit)}</span>
                    </p>`;
                });
            }

            // make the cards
            card.innerHTML = /*html*/ `
                <div class="sidebar-solution-header">
                    <div>
                    <p class="sidebar-solution-name"><strong>${escapeHtmlText(solution.solutionName) || '[Unnamed Solution]'}</strong></p>
                    ${solution.location ? `<p style="margin: 0; font-size: 12px; color: #666; padding: 5px 5px; display: flex; align-items: center; gap: 4px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" flex-shrink="0">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                        </svg>
                        <span>${escapeHtmlText(solution.location)}</span>
                        </p>` : ''}
                    </div>
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
                <div class="components-container">
                    ${componentsHtml}
                </div>
            `;

            sidebarList.appendChild(card);
        });

    } catch (error) {
        console.error("Error rendering sidebar solutions:", error);
    }
}



// Start DB connection when the page loads and render the sidebar with the solutions from the database, this ensures that the user sees the most up-to-date list of solutions when they open the editor page. Also prevents changing pages without saving
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



// saves the current solution data from the editor to IndexedDB, this is called when the user clicks the "Save Solution" button to persist their changes to the database. It also checks for duplicate solution names and prompts the user if a duplicate is found to prevent using the same name as an existing solution
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

        // check for name duplicate
        const allSolutions = await getAllSolutionsFromDb();
        
        const duplicateExists = allSolutions.some(sol => 
            sol.solutionName.toLowerCase().trim() === solutionJson.solutionName.toLowerCase().trim() && 
            sol.id !== solutionJson.id
        );

        if (duplicateExists) {
            alert("A solution with this name already exists. Please choose a different name.");
            return; // Stop the save process
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







// deletes a solution from IndexedDB based on its ID, this is called when the user clicks the delete button on a solution card in the sidebar to remove that solution from the database. It also prompts the user for confirmation before deleting to prevent accidental deletions
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

// clones an existing solution by creating a new solution with the same data but a new unique ID, this is called when the user clicks the clone button on a solution card in the sidebar to create a duplicate of that solution which they can then modify and save as a new solution. It also prompts the user for confirmation if there are unsaved changes to prevent data loss
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

