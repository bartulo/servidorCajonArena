import { io } from 'socket.io-client';

const socket = io();
const solicitud = document.querySelector('#solicitud');

solicitud.addEventListener('click', () => {
  socket.emit('solicitud', 'hola')
});

socket.on('aceptada', () => {
  document.querySelect('form').submit();
});