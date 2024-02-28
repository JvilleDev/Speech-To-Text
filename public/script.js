async function obtenerReemplazos() {
  try {
    const response = await fetch('/api/reemplazar');
    if (!response.ok) {
      throw new Error('No se pudo obtener la lista de reemplazos');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function reemplazarTexto(transcript) {
  const reemplazos = await obtenerReemplazos();

  if (reemplazos.length === 0) {
    return transcript;
  }

  let texto = transcript;

  for (const reemplazo of reemplazos) {
    const palabra = new RegExp(`\\b${reemplazo.palabra}\\b`, 'gi');
    texto = texto.replace(palabra, reemplazo.reemplazar);
  }

  return texto;
}



document.addEventListener('DOMContentLoaded', async () => {
  const dropbtn = document.getElementById('dropbtn');
  const recordButton = document.getElementById('record-button');
  const transcriptionDiv = document.getElementById('transcription');
  let recognition;

  let allText = '';
  let newText = document.createElement('span');
  newText.setAttribute('id', 'newText');
  newText.textContent = '';
  let historyText = document.createElement('span');
  historyText.setAttribute('id', 'allText');
  historyText.textContent = '';
  let lineBreakTimeout;

const socket = io();
socket.on('connect',()=>{
  showAlert('Conexión exitosa al servidor', 'info');
})
  transcriptionDiv.appendChild(historyText);
  transcriptionDiv.appendChild(newText);

  recordButton.addEventListener('click', () => {
    if (!recognition) {
      if ('SpeechRecognition' in window) {
        recognition = new SpeechRecognition();
      } else if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
      } else {
        alert('El reconocimiento de voz no es compatible con este navegador.');
        return;
      }

      recognition.lang = 'es-ES';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.audioDeviceId = undefined;

      recognition.onresult = async (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          scrollToBottomIfNeeded();
        }
        let todoText ="";
        const processedText = await reemplazarTexto(transcript);
        newText.textContent = processedText;
        todoText += allText + processedText;
        socket.emit('allText', todoText)
        socket.emit('transcription', processedText);
        

        clearTimeout(lineBreakTimeout);

        if (event.results[event.results.length - 1].isFinal) {
          allText += ' ' + processedText;
          historyText.textContent += ' ' + processedText;
          newText.textContent = '';
          scrollToBottomIfNeeded();
        }
      };

      recognition.onend = () => {
        if (recognition) {
          recognition.start();
        }
      };

      recognition.onerror = (event) => {
        showAlert(`Error en la transcripción: ${event.error}`, 'danger');
        recognition.start();
      };

      recognition.start();
      recordButton.classList.add('recording');
      recordButton.innerHTML = '<i class="fas fa-stop"></i>';
      showAlert(`Transcripción iniciada`, 'success');
    } else {
      recognition.stop();
      recognition = null;
      recordButton.classList.remove('recording');
      recordButton.innerHTML = '<i class="fas fa-microphone"></i>';
      showAlert(`Transcripción terminada`, 'danger');
    }
  });
});

function scrollToBottomIfNeeded() {
  const transcriptionDiv = document.getElementById("transcription");
  transcriptionDiv.scrollTop = transcriptionDiv.scrollHeight;
}

async function cargarReemplazos() {
  const response = await fetch('/reemplazar');
  const data = await response.json();
  const tbody = document.getElementById('reemplazosBody');
  tbody.innerHTML = '';

  data.forEach((reemplazo, index) => {
      const row = document.createElement('tr');
      tbody.appendChild(row);

      const palabraCell = document.createElement('td');
      palabraCell.textContent = reemplazo.palabra;
      row.appendChild(palabraCell);

      const reemplazarCell = document.createElement('td');
      reemplazarCell.textContent = reemplazo.reemplazar;
      row.appendChild(reemplazarCell);

      const accionesCell = document.createElement('td');
      row.appendChild(accionesCell);

      const editarBtn = document.createElement('button');
      editarBtn.textContent = 'Editar';
      editarBtn.className = 'btn btn-primary btn-sm mr-2';
      editarBtn.addEventListener('click', () => editarReemplazo(index));
      accionesCell.appendChild(editarBtn);

      const eliminarBtn = document.createElement('button');
      eliminarBtn.textContent = 'Eliminar';
      eliminarBtn.className = 'btn btn-danger btn-sm';
      eliminarBtn.addEventListener('click', () => eliminarReemplazo(reemplazo.palabra));
      accionesCell.appendChild(eliminarBtn);
  });
}
const agregarBtn = document.getElementById('agregarBtn');
let formularioVisible = false;
function toggleFormulario() {
  if (formularioVisible) {
    ocultarFormularioAgregar();
  } else {
    mostrarFormularioAgregar();
  }
  formularioVisible = !formularioVisible;
}
function mostrarFormularioAgregar() {
    const agregarForm = document.getElementById('agregarForm');
    agregarForm.style.display = 'block';
}
function ocultarFormularioAgregar() {
    const agregarForm = document.getElementById('agregarForm');
    agregarForm.style.display = 'none';
}
function editarReemplazo(index) {
  const tbody = document.getElementById('reemplazosBody');
  const row = tbody.rows[index];
  const palabra = row.cells[0].textContent;
  const reemplazar = row.cells[1].textContent;
  const palabraInput = document.createElement('input');
  palabraInput.type = 'text';
  palabraInput.value = palabra;
  const reemplazarInput = document.createElement('input');
  reemplazarInput.type = 'text';
  reemplazarInput.value = reemplazar;
  const guardarBtn = document.createElement('button');
  guardarBtn.textContent = 'Guardar';
  guardarBtn.addEventListener('click', async () => {
      const nuevaReemplazo = {
          body: {
              palabra: palabraInput.value,
              reemplazar: reemplazarInput.value
          }
      };
      const response = await fetch(`/reemplazar/${index}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(nuevaReemplazo)
      });

      if (response.ok) {
          cargarReemplazos();
      }
  });
  row.cells[0].innerHTML = '';
  row.cells[0].appendChild(palabraInput);
  row.cells[1].innerHTML = '';
  row.cells[1].appendChild(reemplazarInput);
  row.cells[2].innerHTML = '';
  row.cells[2].appendChild(guardarBtn);
}

async function eliminarReemplazo(palabra) {
    const response = await fetch(`/reemplazar/${palabra}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        cargarReemplazos();
    }
}

document.addEventListener('DOMContentLoaded', () => {
  const nuevoReemplazoForm = document.getElementById('nuevoReemplazoForm');
  nuevoReemplazoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const palabraInput = document.getElementById('palabra');
    const reemplazarInput = document.getElementById('replace');
    const nuevaReemplazo = {
      palabra: palabraInput.value,
      reemplazar: reemplazarInput.value
    };
    console.log(nuevaReemplazo)
    const response = await fetch('/reemplazar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nuevaReemplazo)
    });

    if (response.ok) {
      cargarReemplazos();
      palabraInput.value = '';
      reemplazarInput.value = '';
      ocultarFormularioAgregar();
    }
  });
});
cargarReemplazos();