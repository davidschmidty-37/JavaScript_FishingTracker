# Overview

My name is David Schmidt and I am trying to design a Fishing Tracker App while learning new programming skills and improving current ones. I love to fish and so I figured designing a program that serves me a purpose is a great way to improve my skills. I previously designed this fishing tracker to run from the local browser storage. I mainly did that so I could focus on improving my JavaScript skills. I have never completed a project like this before and so the concept of Web Apps was brand new to me. This program allows the user to log the fish they caught along with some data for each fish. In this update, I added two new pages that help the user compare statistics and easily view their entire catch log. I also added some new features that allow the user to edit existing logs. The major feature of this update is that each catch is now stored on a server powered by node.js. My previous program utilized the browser as the application. Now the browser is just the interface while the code itself handles all the instructions along with a persistent storage in a json file. I'm proud of how the program runs and I'm looking forward to expanding its features. 


[Software Demo Video](https://youtu.be/4SQ7qhUb6zA)

# Web Pages

The main webpage is the Fishing Tracker. It handle a majority of user input. The Statistic page allows the user the view the statistics of each fish and all the comparison methods that I have added. The Detailed catch page basically just provides a presentable view of our json file. The user can view each catch and its associated values very easily. 

# Development Environment

This software was built using Visual Studio Code. It was written in JavaScript, HTML, and CSS. It runs on a local browser while the server is ran by Node.js. I also utilized AI to help design a more asthetic css file.

# Useful Websites

* [Node.js Documentation](https://nodejs.org/docs/latest/api/)
* [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

# Future Work

* Allow pictures to be added to each log
* Utilize the stats being calculated and present them to the user to help them compare better. (Which lures and locations work well together etc.)
* Add a user account system