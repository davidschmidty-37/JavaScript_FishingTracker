// Stores all of the fish catches recorded by the user.
let catches = [];

// Stores the chart so it can be updated later.
let catchChart = null;

// Find the buttons and inputs on the webpage.
const addCatchButton = document.getElementById("add-catch");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort-catches");

// Set up event listeners.
addCatchButton.addEventListener("click", addCatch);
searchInput.addEventListener("input", displayCatches);
sortSelect.addEventListener("change", displayCatches);


// Adds a new fish catch.
function addCatch() {
    const species = document.getElementById("species").value;
    const location = document.getElementById("location").value;
    const length = Number(document.getElementById("length").value);
    const lure = document.getElementById("lure").value;
    const date = document.getElementById("date").value;

    // Check that the required information is valid.
    if (
        species.trim() === "" ||
        location.trim() === "" ||
        lure.trim() === "" ||
        date === "" ||
        document.getElementById("length").value.trim() === "" ||
        length <= 0 ||
        !Number.isFinite(length)
    ) {
        alert("Please enter valid information for every field.");
        return;
    }

    // Create an object for the new fish.
    const newCatch = {
        species: species.trim(),
        location: location.trim(),
        length: length,
        lure: lure.trim(),
        date: date
    };

    // Add the fish and save the updated array.
    catches.push(newCatch);
    saveCatches();

    // Refresh the list, statistics, and chart.
    displayCatches();
    updateStatistics();
    updateCatchChart();

    // Clear the form after adding a catch.
    document.getElementById("species").value = "";
    document.getElementById("location").value = "";
    document.getElementById("length").value = "";
    document.getElementById("lure").value = "";
    document.getElementById("date").value = "";
}


// Saves catches in the browser.
function saveCatches() {
    try {
        localStorage.setItem("fishingCatches", JSON.stringify(catches));
    } catch (error) {
        alert("There was a problem saving your catches.");
    }
}


// Loads saved catches from the browser.
function loadCatches() {
    try {
        const savedCatches = localStorage.getItem("fishingCatches");

        if (savedCatches) {
            const parsedCatches = JSON.parse(savedCatches);

            // Make sure the saved data is an array.
            if (Array.isArray(parsedCatches)) {
                catches = parsedCatches;
            } else {
                catches = [];
            }
        }
    } catch (error) {
        // Handle problems with loading saved data.
        alert("There was a problem loading your saved catches.");
        catches = [];
    }

    displayCatches();
    updateStatistics();
    updateCatchChart();
}


// Displays catches after searching and sorting.
function displayCatches() {
    const catchContainer = document.getElementById("catches");

    // Clear the current list.
    catchContainer.innerHTML = "";

    const searchText = searchInput.value.toLowerCase();
    const sortOption = sortSelect.value;

    // Keep each fish's original index while filtering.
    const filteredCatches = catches
        .map(function (fish, index) {
            return {
                fish: fish,
                index: index
            };
        })
        .filter(function (item) {
            return item.fish.species.toLowerCase().includes(searchText);
        });

    // Sort the filtered list.
    filteredCatches.sort(function (a, b) {
        if (sortOption === "newest") {
            return b.fish.date.localeCompare(a.fish.date);
        }

        if (sortOption === "oldest") {
            return a.fish.date.localeCompare(b.fish.date);
        }

        if (sortOption === "largest") {
            return b.fish.length - a.fish.length;
        }

        if (sortOption === "smallest") {
            return a.fish.length - b.fish.length;
        }

        return 0;
    });

    // Create a card for each matching fish.
    filteredCatches.forEach(function (item) {
        const fish = item.fish;
        const index = item.index;

        const catchCard = document.createElement("div");
        catchCard.className = "catch-card";

        // Create the fish details using text elements.
        // This prevents user-entered text from being treated as HTML.
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

        catchCard.appendChild(heading);
        catchCard.appendChild(locationText);
        catchCard.appendChild(lengthText);
        catchCard.appendChild(lureText);
        catchCard.appendChild(dateText);

        // Create a Delete button.
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            // Remove the fish from the original array.
            catches.splice(index, 1);

            // Save and refresh the page content.
            saveCatches();
            displayCatches();
            updateStatistics();
            updateCatchChart();
        });

        catchCard.appendChild(deleteButton);
        catchContainer.appendChild(catchCard);
    });
}


// Updates the fishing statistics.
function updateStatistics() {
    document.getElementById("total-fish").textContent = catches.length;

    // Calculate total length using recursion.
    const totalLength = calculateTotalLength(catches);

    document.getElementById("total-inches").textContent = totalLength;

    // Calculate average fish length.
    const averageLength = document.getElementById("average-length");

    if (catches.length > 0) {
        averageLength.textContent =
            (totalLength / catches.length).toFixed(2);
    } else {
        averageLength.textContent = "0";
    }

    // Find the largest fish.
    const largestFishDisplay = document.getElementById("largest-fish");

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
    // Stop when we reach the end of the array.
    if (index >= fishList.length) {
        return 0;
    }

    // Add this fish's length to the remaining fish lengths.
    return fishList[index].length +
        calculateTotalLength(fishList, index + 1);
}


// Creates or updates the catch length chart.
function updateCatchChart() {
    // Make sure Chart.js loaded before trying to use it.
    if (typeof Chart === "undefined") {
        console.error("Chart.js did not load.");
        return;
    }

    const chartCanvas = document.getElementById("catch-chart");

    // Use each catch as one bar on the chart.
    const labels = catches.map(function (fish, index) {
        return fish.species + " #" + (index + 1);
    });

    const lengths = catches.map(function (fish) {
        return fish.length;
    });

    // Update the existing chart instead of creating duplicates.
    if (catchChart !== null) {
        catchChart.data.labels = labels;
        catchChart.data.datasets[0].data = lengths;
        catchChart.update();
        return;
    }

    // Create the chart for the first time.
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


// Load saved catches when the webpage opens.
loadCatches();