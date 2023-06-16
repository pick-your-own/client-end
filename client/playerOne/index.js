'use strict';

'use strict';

require('dotenv').config({ path: '../.env' });
const io = require('socket.io-client');
const inquirer = require('inquirer');
const mongoose = require('mongoose');
const socket = io('http://localhost:4000');
const { User } = require('../src/models/User');
const readline = require('readline');

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => console.error('MongoDB connection error:', error));

let username = '';

// START LISTENER
socket.on('start', () => {

  inquirer.prompt({
    name: 'username',
    type: 'input',
    message: 'Log in with username:',
  })
    .then((answer) => {
      const enteredUsername = answer.username;
      // Check if username exists in the database
      User.findOne({ name: enteredUsername }).exec()
        .then((user) => {
          if (user) {
            inquirer.prompt({
              name: 'password',
              type: 'password',
              message: 'Enter your password:',
            })
              .then((answer) => {
                const enteredPassword = answer.password;
                // Compare the entered password with the password in the database
                if (enteredPassword === user.password) {
                  username = user.name;
                  socket.emit('login', username);
                } else {
                  console.log('Incorrect password');
                }
              });
          } else {
            console.log('Username not found');
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
                // Create a new user in the database
                const newUser = new User({ name: newUsername, password: newPassword });
                newUser.save()
                  .then(() => {
                    console.log('User created');
                    socket.emit('login', newUser);
                  })
                  .catch((error) => {
                    console.error('Error creating user:', error);
                  });
              });
          }
        })
        .catch((error) => {
          console.error('Error querying user:', error);
        });
    });
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

// CHAT MESSAGE LISTENER

socket.on('chatMessage', (message) => {
  console.log(message);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const sendMessage = () => {
    rl.question('Enter message (or type "exit" to quit): ', (inputMessage) => {
      if (inputMessage.toLowerCase() === 'exit') {
        rl.close();
        socket.emit('roomMenu');
        return;
      }
      socket.emit('sendMessage', { sender: username, message: inputMessage });
      sendMessage();
    });
  };

  sendMessage();
});

// SENDING MESSAGES LISTENER
socket.on('sendMessage', (data) => {
  const { sender, message } = data;
  const formattedMessage = `${colorGreenLight}${sender.padStart(70)}:${colorReset} ${colorCyan}${message}`;
  console.log(formattedMessage);
  socket.emit('chatMessage', { sender, message });
});

// CHAT JOIN LISTENER
// socket.on('chatJoin', (payload) => {
//   console.log(payload);
// });

// ROOM JOIN SUCCESS


// dungeons results from the functions after completion will bring you back to the menu

socket.on('dungeonResults', (payload) => {
  setTimeout(() => {
    console.log('STORY:', payload.story);
    console.log('RESULTS:', payload.result);
    console.log('LOOT:', payload.loot);
  }, 1000);
  
});
// End of the dungeons results

const colorReset = '\x1b[0m';
const colorCyan = '\x1b[36m';
const colorGreenLight = '\x1b[92m';