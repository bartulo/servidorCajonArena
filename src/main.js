import { io } from 'socket.io-client';
import './css/inicio.css';
import { Modal } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const socket = io();

class Tabla {

  constructor() {

    this.estado = false;
    this.escenario = '';
    this.solicitudModal = new Modal(document.getElementById('solicitud'));
    this.join = document.getElementById('join');

  }

  init() {

    this.join.addEventListener('click', () => {
      socket.emit( 'solicitudAceptada', this.escenario );
      this.solicitudModal.hide();
    })

    socket.on( 'onload', ( p ) => {
      if ( p.proyector ) {
        this.escenarioActivo( p.escenario, p.pid );
      } else {
        this.rellenarTD();
      }
    });

    socket.on( 'out', (  ) => {
      this.rellenarTD();
    });

    socket.on( 'solicitud', () => {
      if ( this.estado ) {
        this.solicitudModal.show();
        console.log( this.escenario );
      }
    });

    socket.on( 'opened', ( elem ) => {
      this.escenarioActivo( elem.escenario, elem.pid );
    });

  }

  escenarioActivo = ( escena, pid ) => {

    this.escenario = escena;
    let escenarioElem = document.querySelector(`#${this.escenario}`);
    let lineas = document.querySelectorAll('.linea');

    lineas.forEach( ( e ) => {
      e.children[1].innerHTML = '';
    });

    let stop = document.createElement('button');
    stop.innerHTML = 'Parar';
    escenarioElem.appendChild( stop );

    stop.addEventListener( 'click', () => {
      socket.emit( 'stop', pid );
    });

    this.estado = true;

  }

  rellenarTD = () => {

    this.estado = false;
    this.escenario = '';

    let lineas = document.querySelectorAll('.linea');

    lineas.forEach( ( e ) => {
      e.children[1].innerHTML = '';
      const escenario = e.children[0].innerHTML;
      let enlace = document.createElement( 'a' );
      enlace.href = `app/visor/${escenario}`;
      enlace.title = escenario;
      enlace.target = '_blank';
      enlace.innerHTML = 'Iniciar';
      e.children[1].appendChild( enlace );
      enlace.addEventListener( 'click', () => {
        socket.emit( 'openBrowser', escenario );
      });

    });

  }

}

const tabla = new Tabla();
tabla.init();
