const sendMessages = document.getElementById('messages');
const writeMessage = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesTextarea = document.getElementById('messages-textarea');
const indexElem = document.getElementById('client-index');
const webRoomsWebSocketServerAddr = 'https://nosch.uber.space/web-rooms/';

let clientId = null;
let clientCount = null;

// Text senden
function sendText() {
    const text = writeMessage.value.trim();
    if (text !== "") {
        // Nachricht an Server schicken
        sendRequest('*broadcast-message*', ['chat', clientId, text]);
        // Eigene Nachricht sofort anzeigen
        messagesTextarea.value += `Du: ${text}\n`;
        messagesTextarea.scrollTop = messagesTextarea.scrollHeight;
        writeMessage.value = "";
    }
}

sendButton.addEventListener('pointerdown', sendText);

// Senden auch mit Entertaste
writeMessage.addEventListener('keydown', (event) => {
    if (event.code === 'Enter') {
        event.preventDefault();
        sendText();
    }
});

/****************************************************************
 * websocket communication
 */
const socket = new WebSocket(webRoomsWebSocketServerAddr);

// listen to opening websocket connections
socket.addEventListener('open', (event) => {
  sendRequest('*enter-room*', 'interactive-chat');
  sendRequest('*subscribe-client-count*');

  // ping the server regularly with an empty message to prevent the socket from closing
  setInterval(() => socket.send(''), 30000);
});

socket.addEventListener("close", (event) => {
  clientId = null;
  document.body.classList.add('disconnected');
  sendRequest('*broadcast-message*', ['end', clientId]);
});

// listen to messages from server
socket.addEventListener('message', (event) => {
  const data = event.data;

  if (data.length > 0) {
    const incoming = JSON.parse(data);
    const selector = incoming[0];

    // dispatch incomming messages
    switch (selector) {
      case '*client-id*':
        clientId = incoming[1] + 1;
        indexElem.innerHTML = `#${clientId}/${clientCount}`;
        break;

      case '*client-count*':
        clientCount = incoming[1];
        indexElem.innerHTML = `#${clientId}/${clientCount}`;
        break;

      case 'chat': {
        // Chatnachricht anzeigen
        const senderId = incoming[1];
        const message = incoming[2];
        messagesTextarea.value += `Client ${senderId}: ${message}\n`;
        messagesTextarea.scrollTop = messagesTextarea.scrollHeight;
        break;
      }

      case 'start': {
        const id = incoming[1];
        break;
      }
      case 'end': {
        const id = incoming[1];
        break;
      }

      case '*error*': {
        const message = incoming[1];
        console.warn('server error:', ...message);
        break;
      }

      default:
        break;
    }
  }
});

function setErrorMessage(text) {
  messageElem.innerText = text;
  messageElem.classList.add('error');
}

function sendRequest(...message) {
  const str = JSON.stringify(message);
  socket.send(str);
}
