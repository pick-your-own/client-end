'use strict';

//https://dh-prod.onrender.com
require('dotenv').config({ path: '../.env' });
const io = require('socket.io-client');
const inquirer = require('inquirer');
const mongoose = require('mongoose');
const socket = io('https://dh-prod.onrender.com');
// const { User } = require('../src/models/User');
const readline = require('readline');

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => console.error('MongoDB connection error:', error));



// START LISTENER
socket.on('start', () => {

  inquirer.prompt([
    {
      name: 'username',
      type: 'input',
      message: 'Log in with username:',
    },

    {
      name: 'password',
      type: 'password',
      message: 'Enter your password:',
    },
  ])

    .then((answer) => {
      const payload = {
        username: answer.username,
        password: answer.password,
      };
      socket.emit('login', payload);
    });
});




socket.on('accessGranted', (payload) => {
  if (payload.access === true) {
    socket.emit('leaveChat', payload);
  } else {
    inquirer.prompt([
      {
        name: 'signupUsername',
        type: 'input',
        message: 'Create a username:',
      },
      {
        name: 'signupPassword',
        type: 'password',
        message: 'New password',
      },

    ])
      .then((answer) => {
        const newUsername = answer.signupUsername;
        const newPassword = answer.signupPassword;
        payload.username = newUsername;
        payload.password = newPassword;
        console.log('User created');
        socket.emit('createUser', payload);
      });
  }
});




// ROOM MENU LISTENER
socket.on('roomMenu', (payload) => {
  inquirer.prompt([
    {
      name: 'menuChoice',
      type: 'rawlist',
      message: 'Welcome to Dungeon Hopper\nChoose an option:',
      choices: [
        { name: 'Chat', value: 1 },
        { name: 'Play with friends', value: 2 },
        { name: 'Play alone', value: 3 },
        { name: 'Play with randoms', value: 4 },
      ],
    },
  ])
    .then((answer) => {
      const selectedOption = answer.menuChoice;
      payload.room = selectedOption;
      switch (selectedOption) {
      case 1:
        console.log('Selected: Chat');
        socket.emit('chatJoin', payload);
        break;
      case 2:
        console.log('Selected: Play with friends');
        socket.emit('chatJoin', payload);
        break;
      case 3:
        console.log('Selected: Play alone');
        socket.emit('chatJoin', payload);
        break;
      case 4:
        console.log('Selected: Play with randoms');
        socket.emit('chatJoin', payload);
        break;
      default:
        console.log('Invalid option');
        break;
      }

    });
});

// DUNGEON MENU LISTENER
socket.on('dungeonMenu', (payload) => {
  console.log('======>', payload);
  inquirer.prompt([
    {
      name: 'dungeonOptions',
      type: 'rawlist',
      message: 'What level dungeon do you want to do?',
      choices: [
        { name: 'Easy', value: 1 },
        { name: 'Normal', value: 2 },
        { name: 'Hard', value: 3 },
      ],
    },
  ])
    .then((answer) => {
      const selectedOption = answer.dungeonOptions;
      payload.mode = selectedOption;
      switch (selectedOption) {
      case 1:
        console.log('Selected easy');
        socket.emit('dungeonLogic', payload);
        break;
      case 2:
        console.log('Selected normal');
        socket.emit('dungeonLogic', 'normal');
        break;
      case 3:
        console.log('Selected hard');
        socket.emit('hardD', 'hard');
        break;
      }

    });
});

// CHAT ROOM INTERACTION
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to send messages
const sendMessage = () => {
  rl.question('Enter message (or type "exit" to quit): ', (inputMessage) => {
    if (inputMessage.toLowerCase() === 'exit') {
      rl.close();
      socket.emit('leaveChat');
      return;
    }
    socket.emit('sendMessage', { message: inputMessage });
    rl.prompt();
  });
};

// Listener for incoming chat messages
socket.on('chatMessage', (data) => {
  console.log(data.sender + ': ' + data.message);
  rl.prompt();
});

// Listener for successful chat room join
socket.on('chatJoin', () => {
  console.log('Joined the chat room successfully!');
  rl.prompt();
  sendMessage();
});

// Listener for typing notifications
socket.on('typing', (data) => {
  console.log(`${data.username} is typing...`);
});

sendMessage();


socket.on('dungeonResults', (payload) => {
  setTimeout(() => {
    console.log('STORY:', payload.story);
    console.log('RESULTS:', payload.result);
    console.log('LOOT:', payload.loot);
  }, 1000);
  socket.emit('');
});
// End of the dungeons results

// const colorReset = '\x1b[0m';
// const colorCyan = '\x1b[36m';
// const colorGreenLight = '\x1b[92m';