import { io } from 'socket.io-client';
import './css/inicio.css';
import { Modal } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const socket = io();

class Tabla {

  constructor() {

    this.estado = false;
    this.escenario = '';
    this.listado = document.getElementById('listado');
    this.panel = document.getElementById('panel');
    this.stop = document.getElementById('stop');
    this.titulo = document.getElementById('titulo');
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
      }
    });

    socket.on( 'opened', ( elem ) => {
      this.escenarioActivo( elem.escenario, elem.pid );
    });

  }

  escenarioActivo = ( escena, pid ) => {

    this.escenario = escena;
    this.pid = pid

    this.stop.addEventListener( 'click', this.stopEscenario );

    this.titulo.innerHTML = escena;

    this.listado.style.display = 'none';
    this.panel.style.display = 'block';

    this.estado = true;

  }

  rellenarTD = () => {

    this.estado = false;
    this.escenario = '';
    this.stop.removeEventListener( 'click', this.stopEscenario );

    let lineas = document.querySelectorAll('.linea');

    lineas.forEach( ( e ) => {
      e.children[1].innerHTML = '';
      const escenario = e.children[0].innerHTML;
      let enlace = document.createElement( 'a' );
      enlace.href = "#";
      enlace.title = escenario;
      enlace.innerHTML = 'Iniciar';
      e.children[1].appendChild( enlace );
      enlace.addEventListener( 'click', () => {
        socket.emit( 'openBrowser', escenario );
      });

    });

    this.listado.style.display = 'block';
    this.panel.style.display = 'none';

  }

  stopEscenario = () => {
    socket.emit( 'stop', this.pid ); 
  }

}

const tabla = new Tabla();
tabla.init();
