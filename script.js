// Stores the catches currently loaded from the server in browser memory.
let catches = [];

// Stores the chart as a let so we can change it later.
let catchChart = null;


// Connects html elements to javaScript variables so we can utilize them later.
const addCatchButton = document.getElementById("add-catch");
const searchInput = document.getElementById("search");
const locationFilter = document.getElementById("location-filter");
const minLengthFilter = document.getElementById("min-length-filter");
const sortSelect = document.getElementById("sort-catches");
const clearFiltersButton = document.getElementById("clear-filters");


// Listners define which action should run based on user actions.
addCatchButton.addEventListener("click", addCatch);
searchInput.addEventListener("input", loadCatches);
locationFilter.addEventListener("input", loadCatches);
minLengthFilter.addEventListener("input", loadCatches);
sortSelect.addEventListener("change", displayCatches);
clearFiltersButton.addEventListener("click", clearFilters);


// Loads catches from the Express server. This function is what actually communicates with the express server
async function loadCatches() {
// try blocks potential errors. I placed this here to prevent crashes while loading the server
    try {
        const queryParameters = new URLSearchParams();

        const species = searchInput.value.trim();
        const location = locationFilter.value.trim();
        const minimumLength = minLengthFilter.value.trim();

        // Add only filters that contain user input.
        if (species !== "") {
            queryParameters.set("species", species);
        }

        if (location !== "") {
            queryParameters.set("location", location);
        }

        if (minimumLength !== "") {
            queryParameters.set("minLength", minimumLength);
        }

        const queryString = queryParameters.toString();

        // Ask the server for all catches or filtered catches.
        const response = await fetch(
            queryString
                ? `/api/catches?${queryString}`
                : "/api/catches"
        );

        if (!response.ok) {
            throw new Error("Could not load catches.");
        }

        // Convert the server response from JSON into JavaScript data.
        catches = await response.json();

        // Refresh the list, statistics, and chart.
        displayCatches();
        updateStatistics();
        updateCatchChart();
    } catch (error) {
        console.error(error);
        alert("There was a problem loading catches from the server.");
    }
}


// Clears all search and filter inputs.
function clearFilters() {
    searchInput.value = "";
    locationFilter.value = "";
    minLengthFilter.value = "";
    sortSelect.value = "newest";

    loadCatches();
}


// Sends a new catch to the Express server.
async function addCatch() {
    // Find html element and read its value
    const species = document.getElementById("species").value.trim();
    const location = document.getElementById("location").value.trim();
    const lengthInput = document.getElementById("length").value;
    const length = Number(lengthInput);
    const lure = document.getElementById("lure").value.trim();
    const date = document.getElementById("date").value;

    // Check that every required field contains valid information.
    if (
        species === "" ||
        location === "" ||
        lure === "" ||
        date === "" ||
        lengthInput.trim() === "" ||
        length <= 0 ||
        !Number.isFinite(length)
    ) {
        alert("Please enter valid information for every field.");
        return;
    }

    // Create an object containing the new catch information. This keeps data correctly grouped
    const newCatch = {
        species: species,
        location: location,
        length: length,
        lure: lure,
        date: date
    };

    try {
        // Send the new fish to the server as JSON.
        const response = await fetch("/api/catches", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newCatch)
        });

        if (!response.ok) {
            throw new Error("The server rejected the catch.");
        }

        clearForm();
        await loadCatches();
    } catch (error) {
        console.error(error);
        alert("There was a problem saving the catch.");
    }
}


// User does not have to manually delete their inputs to give new inputs.
function clearForm() {
    document.getElementById("species").value = "";
    document.getElementById("location").value = "";
    document.getElementById("length").value = "";
    document.getElementById("lure").value = "";
    document.getElementById("date").value = "";
}


// Displays catches after filtering and sorting.
function displayCatches() {
    const catchContainer = document.getElementById("catches");
    // Clears current card so we can display updated information.
    catchContainer.innerHTML = "";

    // Make a copy so sorting does not change the original array.
    const sortedCatches = [...catches];
    // Handles user desired sort by based on date and size
    sortedCatches.sort(function (a, b) {
        if (sortSelect.value === "newest") {
            return b.date.localeCompare(a.date);
        }

        if (sortSelect.value === "oldest") {
            return a.date.localeCompare(b.date);
        }

        if (sortSelect.value === "largest") {
            return b.length - a.length;
        }

        if (sortSelect.value === "smallest") {
            return a.length - b.length;
        }

        return 0;
    });
    // Handles empty results
    if (sortedCatches.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No catches found.";
        catchContainer.appendChild(emptyMessage);
        return;
    }

    sortedCatches.forEach(function (fish) {
        catchContainer.appendChild(createCatchCard(fish));
    });
}


// Creates the visual card for one fish.
function createCatchCard(fish) {
    const catchCard = document.createElement("div");
    catchCard.className = "catch-card";

    const heading = document.createElement("h3");
    heading.textContent = fish.species;

    const locationText = document.createElement("p");
    locationText.textContent = "Location: " + fish.location;

    const lengthText = document.createElement("p");
    lengthText.textContent = "Length: " + fish.length + " inches";

    const lureText = document.createElement("p");
    lureText.textContent = "Lure/Fly: " + fish.lure;

    const dateText = document.createElement("p");
    dateText.textContent = "Date: " + fish.date;
    // Creates a button to edit catch directly on the card.
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";

    editButton.addEventListener("click", function () {
        showEditForm(catchCard, fish);
    });
    // Creates a button for the  user to delete a fish directly from the created card.
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
        deleteCatch(fish.id);
    });

    catchCard.appendChild(heading);
    catchCard.appendChild(locationText);
    catchCard.appendChild(lengthText);
    catchCard.appendChild(lureText);
    catchCard.appendChild(dateText);
    catchCard.appendChild(editButton);
    catchCard.appendChild(deleteButton);

    return catchCard;
}


// Replaces a catch card with editable input fields.
function showEditForm(catchCard, fish) {
    // Clears card.
    catchCard.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent = "Edit Catch";
    // Creates inputs to recieve edits.
    const speciesInput = createEditInput("Species", fish.species);
    const locationInput = createEditInput("Location", fish.location);
    const lengthInput = createEditInput("Length", fish.length);
    const lureInput = createEditInput("Lure or Fly", fish.lure);
    const dateInput = createEditInput("Date", fish.date);

    lengthInput.type = "number";
    dateInput.type = "date";
    // Create save button.
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Changes";
    // Defines save button and updates card.
    saveButton.addEventListener("click", function () {
        const updatedCatch = {
            species: speciesInput.value.trim(),
            location: locationInput.value.trim(),
            length: Number(lengthInput.value),
            lure: lureInput.value.trim(),
            date: dateInput.value
        };

        updateCatch(fish.id, updatedCatch);
    });
    // Creates a cancel button that will reload card from server
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", loadCatches);

    catchCard.appendChild(heading);
    catchCard.appendChild(speciesInput);
    catchCard.appendChild(locationInput);
    catchCard.appendChild(lengthInput);
    catchCard.appendChild(lureInput);
    catchCard.appendChild(dateInput);
    catchCard.appendChild(saveButton);
    catchCard.appendChild(cancelButton);
}


// Creates an input element for the edit form.
function createEditInput(labelText, value) {
    const input = document.createElement("input");

    input.type = "text";
    input.placeholder = labelText;
    input.value = value;

    return input;
}


// Sends updated catch information to the Express server.
async function updateCatch(id, updatedCatch) {
    if (
        updatedCatch.species === "" ||
        updatedCatch.location === "" ||
        updatedCatch.lure === "" ||
        updatedCatch.date === "" ||
        updatedCatch.length <= 0 ||
        !Number.isFinite(updatedCatch.length)
    ) {
        alert("Please enter valid information for every field.");
        return;
    }
    // Ensures potential errors don't crash the program
    try {
        const response = await fetch(`/api/catches/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedCatch)
        });

        if (!response.ok) {
            throw new Error("The server rejected the update.");
        }

        await loadCatches();
    } catch (error) {
        console.error(error);
        alert("There was a problem updating the catch.");
    }
}


// Deletes a catch through the Express server.
async function deleteCatch(id) {
    const shouldDelete = confirm(
        "Are you sure you want to delete this catch?"
    );
    // Confirms user is accidentally deleting a catch
    if (!shouldDelete) {
        return;
    }

    try {
        const response = await fetch(`/api/catches/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("The server rejected the deletion.");
        }

        await loadCatches();
    } catch (error) {
        console.error(error);
        alert("There was a problem deleting the catch.");
    }
}


// Updates the statistics displayed on the main page.
function updateStatistics() {
    document.getElementById("total-fish").textContent = catches.length;
    // Calls calculateTotalLength to display updated total length
    const totalLength = calculateTotalLength(catches);

    document.getElementById("total-inches").textContent = totalLength;

    const averageLength = document.getElementById("average-length");
    // Finds and defines average length
    if (catches.length > 0) {
        averageLength.textContent =
            (totalLength / catches.length).toFixed(2);
    } else {
        averageLength.textContent = "0";
    }

    const largestFishDisplay = document.getElementById("largest-fish");
    // Finds and returns largest fish for stats. Handles empty case
    if (catches.length > 0) {
        const largestFish = catches.reduce(function (biggest, fish) {
            if (fish.length > biggest.length) {
                return fish;
            }

            return biggest;
        });

        largestFishDisplay.textContent =
            largestFish.species + " - " + largestFish.length + " inches";
    } else {
        largestFishDisplay.textContent = "None";
    }
}


// Recursively calculates the total length of all fish.
function calculateTotalLength(fishList, index = 0) {
    if (index >= fishList.length) {
        return 0;
    }

    return fishList[index].length +
        calculateTotalLength(fishList, index + 1);
}


// Creates or updates the catch length chart.
function updateCatchChart() {
    // Prevents a failure to load chart from disrupting the program.
    if (typeof Chart === "undefined") {
        console.error("Chart.js did not load.");
        return;
    }
    // Connect html element to variable.
    const chartCanvas = document.getElementById("catch-chart");
    // Converts catches into labels so we can display them on the chart.
    const labels = catches.map(function (fish, index) {
        return fish.species + " #" + (index + 1);
    });
    // Creates an array only focusing on a fish and its length.
    const lengths = catches.map(function (fish) {
        return fish.length;
    });

    if (catchChart !== null) {
        catchChart.data.labels = labels;
        catchChart.data.datasets[0].data = lengths;
        catchChart.update();
        return;
    }
    // Creates and defines html element for chart
    catchChart = new Chart(chartCanvas, {
        type: "bar",

        data: {
            labels: labels,

            datasets: [{
                label: "Fish Length (inches)",
                data: lengths,
                backgroundColor: "rgba(54, 115, 75, 0.7)",
                borderColor: "rgb(37, 75, 54)",
                borderWidth: 1
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: true,

            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Length (inches)"
                    }
                },

                x: {
                    title: {
                        display: true,
                        text: "Fish"
                    }
                }
            },

            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}


// Load saved catches when the page first opens.
loadCatches();