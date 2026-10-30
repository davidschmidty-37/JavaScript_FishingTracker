# Overview

My name is David Schmidt and I am to designing a Fishing Tracker App while learning new programming skills and improving current ones. I love to fish and so I figured designing a program that serves me a purpose is a great way to improve my skills. I previously designed this fishing tracker to run from the local browser storage. I mainly did that so I could focus on improving my JavaScript skills. I have never completed a project like this before and so the concept of Web Apps was brand new to me. This program allows the user to log the fish they caught along with some data for each fish. I previously had the express server storing data in catches.json. I had GET, POST, PUT, and DELETE from the server.js file editing the json. In this most recent update. I removed the catches.json file and now the server communicates with google Firebase using Firestore. The data is now stored to cloud. This will allow me to make further updates towards the cloud in the future.

[Software Demo Video](https://youtu.be/6nFD4BhCWUo)

# Cloud Database

This project uses Google Firebase Cloud Firestore. Firestore is a cloud-based NoSQL database that stores information in collections and documents.

The database contains one collection called `catches`. Each fishing catch is stored as its own document. Firestore automatically gives every document a unique ID.

Each document contains the following fields:

- `species` - The type of fish caught
- `location` - Where the fish was caught
- `length` - The length of the fish in inches
- `lure` - The lure or bait used
- `date` - The date of the catch

# Development Environment

I developed this project using Visual Studio Code, Node.js, npm, Google Firebase Console, Google Firestore, and GitHub.

The project uses the following technologies:

- JavaScript
- HTML
- CSS
- Node.js
- Express
- Firebase Admin SDK
- Google Cloud Firestore

# Useful Websites

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Cloud Firestore Server Quickstart](https://firebase.google.com/docs/firestore/quickstart-server)
- [Firestore Database Documentation](https://firebase.google.com/docs/firestore)
- [Express.js Documentation](https://expressjs.com/)
- [MDN Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Markdown Cheat Sheet](https://www.markdownguide.org/cheat-sheet/)

# Future Work

- Make the application online so anyone can access it from anywhere
- Add photos to each entry
- Add an account system and allow users to create an account.
