// This file handles all interactions with the indexedDB database, including saving, retrieving, and filtering solutions based on tags and search input.

// IndexedDB setup
const dbName = "solutionDatabase";
const storeName = "savedSolutions";
let dbInstance;

// initialize the database and create the object store if it doesn't exist
function initDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = function(event) {
            dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains(storeName)) {
                // this makes it know to seperate and update based on the id instead of names or other values
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

// loads a solution into the database, if the id already exists it will update it instead of creating a new entry 
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

// get all of the solutions from the database, this is used to update all of the solutions on the page when one is added, updated, or deleted
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

// updates all of the tags in the datalist and the filter based on the current solutions in the database, this is called whenever a solution is added, updated, or deleted to make sure the tags are always up to date
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


// filters the solutions on the page based on the search input and the activated tags, this is called whenever the search input changes or a tag filter is toggled to make sure the displayed solutions are always up to date with the current filters
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