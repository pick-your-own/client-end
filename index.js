'use strict';

//https://dh-prod.onrender.com
require('dotenv').config({ path: '../.env' });
const io = require('socket.io-client');
const inquirer = require('inquirer');
const socket = io('https://dh-prod.onrender.com');
const readline = require('readline');

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
  inquirer.prompt([
    {
      name: 'dungeonOptions',
      type: 'rawlist',
      message: 'What level dungeon do you want to do?',
      choices: [
        { name: 'Easy', value: 1 },
        { name: 'Normal', value: 2 },
        { name: 'Hard', value: 3 },
        { name: 'Back to menu', value: 4 },
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
        socket.emit('dungeonLogic', payload);
        break;
      case 3:
        console.log('Selected hard');
        socket.emit('dungeonLogic', payload);
        break;
      case 4:
        console.log('Sending back to menu');
        socket.emit('leaveDungeon', payload);
      }


    });
});

socket.on('chatMessage', (message) => {
  console.log(message.message);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  rl.prompt();

  // rl.on('line', (input) => {
  const sendMessage = (message) => {
    rl.question('Enter message (or type "exit" to quit): ', (inputMessage) => {
      if (inputMessage.toLowerCase() === 'exit') {
        rl.close();
        socket.emit('leaveChat', message);
        return;
      }
      socket.emit('sendMessage', { sender: message, message: inputMessage });
      rl.prompt();
    });
  };

  sendMessage();
});

socket.on('dungeonResults', (payload) => {
  setTimeout(() => {
    console.log('STORY:', payload.story);
    console.log('RESULTS:', payload.result);
    console.log('LOOT:', payload.loot);
  }, 1000);
  setTimeout(() => {
    socket.emit('dungeonFinish', payload);
  }, 2000);
});
