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
    this.visor = document.getElementById('visor');
    this.form = document.querySelector('form');
    this.solicitudModal = new Modal(document.getElementById('solicitud'));
    this.room1 = document.getElementById('room1');
    this.room2 = document.getElementById('room2');
    this.mostrarRoom1 = document.getElementById('mostrar-room1');
    this.mostrarRoom2 = document.getElementById('mostrar-room2');

  }

  init() {

    this.room1.addEventListener('click', () => {
      socket.emit( 'solicitudAceptada', { escenario: this.escenario, room: 'room1' } );
      this.solicitudModal.hide();
    })

    this.room2.addEventListener('click', () => {
      socket.emit( 'solicitudAceptada', { escenario: this.escenario, room: 'room2' } );
      this.solicitudModal.hide();
    })

    this.mostrarRoom1.addEventListener('click', () => {
      socket.emit( 'mostrarRoom', 'room1' );
    })

    this.mostrarRoom2.addEventListener('click', () => {
      socket.emit( 'mostrarRoom', 'room2' );
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

    socket.on( 'linea_room', ( linea ) => {
      console.log( linea ); 
    });

  }

  escenarioActivo = ( escena, pid ) => {

    this.escenario = escena;
    this.pid = pid

    this.stop.addEventListener( 'click', this.stopEscenario );
    this.visor.addEventListener( 'click', this.abrirVisor );

    this.titulo.innerHTML = escena;

    this.listado.style.display = 'none';
    this.panel.style.display = 'block';

    this.estado = true;

  }

  rellenarTD = () => {

    this.estado = false;
    this.escenario = '';
    this.stop.removeEventListener( 'click', this.stopEscenario );
    this.visor.removeEventListener( 'click', this.abrirVisor );

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

      e.children[2].innerHTML = '';
      let borrar = document.createElement( 'a' );
      borrar.href = "#";
      borrar.title = borrar;
      borrar.innerHTML = 'Borrar';
      e.children[2].appendChild( borrar );
      borrar.addEventListener( 'click', () => {
        socket.emit( 'borrarEscenario', escenario );
      });

    });

    this.listado.style.display = 'block';
    this.panel.style.display = 'none';

  }

  stopEscenario = () => {

    socket.emit( 'stop', this.pid ); 

  }

  abrirVisor = () => {

    this.form.action = `app/visor/${ this.escenario }/master`;
    this.form.target = '_blanket';
    this.form.submit();

  }

}

const tabla = new Tabla();
tabla.init();
