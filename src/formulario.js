import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';

const socket = io();
const solicitud = document.querySelector('#solicitud');

solicitud.addEventListener('click', () => {
  socket.emit('solicitud', 'hola')
});

socket.on('solicitudAceptada', ( data ) => {
  document.querySelector('form').action = `${document.location.href}/${data.escenario}/${data.room}`;
  document.querySelector('form').submit();
});
