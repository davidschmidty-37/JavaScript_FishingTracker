// Express handles communication between the browser and the server.
const express = require("express");
const path = require("path");

// Firebase Admin keeps database access on the trusted server instead of
// exposing Firebase credentials to the browser.
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// This private file authorizes the server to access the Firebase project.
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
    credential: cert(serviceAccount)
});

// This object is the server's connection to Firestore.
const db = getFirestore();

const app = express();
const port = 3000;

// API requests contain JSON data, so Express must convert that data into
// JavaScript objects that the routes can use.
app.use(express.json());


// User-entered text is escaped before being placed into HTML to prevent
// the browser from interpreting input as executable HTML.
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// Validation keeps incomplete or invalid records out of the database.
function isValidCatch(fish) {
    return (
        fish &&
        String(fish.species).trim() !== "" &&
        String(fish.location).trim() !== "" &&
        String(fish.lure).trim() !== "" &&
        String(fish.date).trim() !== "" &&
        Number.isFinite(Number(fish.length)) &&
        Number(fish.length) > 0
    );
}


// Keeping Firestore retrieval in one function prevents each route from
// repeating the same process of converting documents into JavaScript objects.
async function getAllCatches() {
    const snapshot = await db.collection("catches").get();

    return snapshot.docs.map(function (document) {
        return {
            id: document.id,
            ...document.data()
        };
    });
}


// This function keeps the table layout in one place so the catch page
// does not need to manually build a row for every document.
function createCatchRows(catchList) {
    if (catchList.length === 0) {
        return `
            <tr>
                <td colspan="6">No catches found.</td>
            </tr>
        `;
    }

    return catchList.map(function (fish) {
        return `
            <tr>
                <td>${escapeHtml(fish.species)}</td>
                <td>${escapeHtml(fish.location)}</td>
                <td>${fish.length} inches</td>
                <td>${escapeHtml(fish.lure)}</td>
                <td>${escapeHtml(fish.date)}</td>
                <td>${escapeHtml(fish.id)}</td>
            </tr>
        `;
    }).join("");
}


// Statistics are calculated on the server so the page always reflects
// the current data retrieved from Firestore.
function createStatsPage(catchList) {
    const totalFish = catchList.length;

    const totalInches = catchList.reduce(function (total, fish) {
        return total + Number(fish.length);
    }, 0);

    const averageLength =
        totalFish > 0 ? (totalInches / totalFish).toFixed(2) : "0";

    let largestFish = null;

    if (totalFish > 0) {
        largestFish = catchList.reduce(function (largest, fish) {
            return Number(fish.length) > Number(largest.length)
                ? fish
                : largest;
        });
    }

    const largestFishText = largestFish
        ? `${escapeHtml(largestFish.species)} - ${largestFish.length} inches`
        : "None";

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Fishing Statistics</title>
            <link rel="stylesheet" href="/style.css">
        </head>

        <body>
            <header>
                <h1>Fishing Statistics</h1>
                <p>Statistics generated from Firestore data.</p>
            </header>

            <main>
                <section>
                    <h2>Server Statistics</h2>

                    <p>Total Fish: ${totalFish}</p>
                    <p>Total Inches: ${totalInches}</p>
                    <p>Average Length: ${averageLength} inches</p>
                    <p>Largest Fish: ${largestFishText}</p>

                    <p>
                        <a href="/">Return to Fishing Tracker</a>
                    </p>

                    <p>
                        <a href="/catches">View Detailed Catch Log</a>
                    </p>
                </section>
            </main>
        </body>
        </html>
    `;
}


// This page gives users a simple way to view the records stored in Firestore.
function createCatchesPage(catchList) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Detailed Catch Log</title>
            <link rel="stylesheet" href="/style.css">
        </head>

        <body>
            <header>
                <h1>Detailed Catch Log</h1>
                <p>All catches currently saved in Firestore.</p>
            </header>

            <main>
                <section>
                    <h2>Cloud-Saved Catches</h2>

                    <table>
                        <tr>
                            <th>Species</th>
                            <th>Location</th>
                            <th>Length</th>
                            <th>Lure</th>
                            <th>Date</th>
                            <th>ID</th>
                        </tr>

                        ${createCatchRows(catchList)}
                    </table>

                    <p>
                        <a href="/">Return to Fishing Tracker</a>
                    </p>

                    <p>
                        <a href="/stats">View Fishing Statistics</a>
                    </p>
                </section>
            </main>
        </body>
        </html>
    `;
}


// This endpoint is the API's read operation. It retrieves cloud data and
// applies filters before sending the results back to the browser.
app.get("/api/catches", async function (request, response) {
    try {
        const speciesSearch = String(
            request.query.species || ""
        ).toLowerCase();

        const locationSearch = String(
            request.query.location || ""
        ).toLowerCase();

        const minimumLength = Number(request.query.minLength);
        const allCatches = await getAllCatches();

        const filteredCatches = allCatches.filter(function (fish) {
            const matchesSpecies =
                fish.species.toLowerCase().includes(speciesSearch);

            const matchesLocation =
                fish.location.toLowerCase().includes(locationSearch);

            const matchesMinimumLength =
                !request.query.minLength ||
                Number(fish.length) >= minimumLength;

            return (
                matchesSpecies &&
                matchesLocation &&
                matchesMinimumLength
            );
        });

        response.json(filteredCatches);
    } catch (error) {
        console.error("Unable to retrieve catches:", error);

        response.status(500).json({
            error: "Unable to retrieve catches from the database."
        });
    }
});


// This endpoint is the API's create operation. It validates the submitted
// data before allowing a new document to be added to Firestore.
app.post("/api/catches", async function (request, response) {
    const fish = request.body;

    if (!isValidCatch(fish)) {
        response.status(400).json({
            error: "Please provide valid catch information."
        });

        return;
    }

    const newCatch = {
        species: String(fish.species).trim(),
        location: String(fish.location).trim(),
        length: Number(fish.length),
        lure: String(fish.lure).trim(),
        date: String(fish.date).trim()
    };

    try {
        const documentReference = await db
            .collection("catches")
            .add(newCatch);

        response.status(201).json({
            id: documentReference.id,
            ...newCatch
        });
    } catch (error) {
        console.error("Unable to add catch:", error);

        response.status(500).json({
            error: "Unable to add catch to the database."
        });
    }
});


// This older route is kept so the original form behavior continues to work.
app.post("/catches", async function (request, response) {
    const fish = request.body;

    if (!isValidCatch(fish)) {
        response.status(400).send("Please provide valid catch information.");

        return;
    }

    const newCatch = {
        species: String(fish.species).trim(),
        location: String(fish.location).trim(),
        length: Number(fish.length),
        lure: String(fish.lure).trim(),
        date: String(fish.date).trim()
    };

    try {
        await db.collection("catches").add(newCatch);
        response.redirect("/stats");
    } catch (error) {
        console.error("Unable to add catch:", error);

        response.status(500).send(
            "Unable to add catch to the database."
        );
    }
});


// This endpoint is the API's update operation. The document ID identifies
// exactly which catch should be changed.
app.put("/api/catches/:id", async function (request, response) {
    const updatedCatch = {
        species: request.body.species,
        location: request.body.location,
        length: request.body.length,
        lure: request.body.lure,
        date: request.body.date
    };

    if (!isValidCatch(updatedCatch)) {
        response.status(400).json({
            error: "Please provide valid catch information."
        });

        return;
    }

    updatedCatch.species = String(updatedCatch.species).trim();
    updatedCatch.location = String(updatedCatch.location).trim();
    updatedCatch.length = Number(updatedCatch.length);
    updatedCatch.lure = String(updatedCatch.lure).trim();
    updatedCatch.date = String(updatedCatch.date).trim();

    try {
        const catchReference = db
            .collection("catches")
            .doc(request.params.id);

        const catchDocument = await catchReference.get();

        if (!catchDocument.exists) {
            response.status(404).json({
                error: "Catch not found."
            });

            return;
        }

        await catchReference.update(updatedCatch);

        response.json({
            id: request.params.id,
            ...updatedCatch
        });
    } catch (error) {
        console.error("Unable to update catch:", error);

        response.status(500).json({
            error: "Unable to update catch in the database."
        });
    }
});


// This endpoint is the API's delete operation. The document is checked
// first so the program can return a useful message if the ID is invalid.
app.delete("/api/catches/:id", async function (request, response) {
    try {
        const catchReference = db
            .collection("catches")
            .doc(request.params.id);

        const catchDocument = await catchReference.get();

        if (!catchDocument.exists) {
            response.status(404).json({
                error: "Catch not found."
            });

            return;
        }

        const deletedCatch = {
            id: catchDocument.id,
            ...catchDocument.data()
        };

        await catchReference.delete();

        response.json(deletedCatch);
    } catch (error) {
        console.error("Unable to delete catch:", error);

        response.status(500).json({
            error: "Unable to delete catch from the database."
        });
    }
});


// These routes serve the files that make up the browser interface.
app.get("/", function (request, response) {
    response.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", function (request, response) {
    response.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", function (request, response) {
    response.sendFile(path.join(__dirname, "script.js"));
});


// The pages retrieve fresh data each time so they do not display outdated
// information left over from when the server first started.
app.get("/stats", async function (request, response) {
    try {
        const allCatches = await getAllCatches();
        response.send(createStatsPage(allCatches));
    } catch (error) {
        console.error("Unable to create statistics page:", error);
        response.status(500).send("Unable to load statistics.");
    }
});

app.get("/catches", async function (request, response) {
    try {
        const allCatches = await getAllCatches();
        response.send(createCatchesPage(allCatches));
    } catch (error) {
        console.error("Unable to create catch page:", error);
        response.status(500).send("Unable to load catch log.");
    }
});


// Gives users a clear response when they request an unknown address.
app.use(function (request, response) {
    response.status(404).send("<h1>404</h1><p>Page not found.</p>");
});


// Starts the server so the tracker can be opened in a browser.
app.listen(port, function () {
    console.log(`Express server running at http://localhost:${port}`);
});