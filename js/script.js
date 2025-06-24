const CSV_URL = 'https://proxy-likehome.vercel.app/api'; // seu proxy Vercel

function removerBOM(texto) {
  if (texto.charCodeAt(0) === 0xFEFF) {
    return texto.slice(1);
  }
  return texto;
}

fetch(CSV_URL)
  .then(response => response.json())
  .then(data => {
    const csvText = removerBOM(data.csv);
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    }).data;

    const dados = Object.fromEntries(parsed.map(row => [row.chave, row.valor]));

    Object.entries(dados).forEach(([key, value]) => {
      const el = document.getElementById(key);
      if (el) {
        if (el.tagName === 'IMG') {
          el.src = value;
        } else {
          el.innerText = value;
        }
      }
    });

    document.querySelectorAll('[data-content]').forEach(el => {
      const key = el.dataset.content;
      if (dados[key]) el.textContent = dados[key];
    });
  })
  .catch(err => console.error('Erro ao carregar CSV:', err));



  //validar nr telefone com DDD
   const telefoneInput = document.getElementById('telefone');

  telefoneInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número

    if (value.length > 11) {
      value = value.slice(0, 11); // Limita a 11 dígitos
    }

    // Aplica a máscara: (99) 99999-9999
    if (value.length >= 2 && value.length <= 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 6 && value.length <= 10) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    } else if (value.length === 11) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    }

    e.target.value = value;
  });

  // Opcional: força preenchimento com DDD no submit
  document.querySelector('form')?.addEventListener('submit', function (e) {
    const tel = telefoneInput.value.replace(/\D/g, '');
    if (tel.length < 10) {
      alert('Por favor, informe um número com DDD válido.');
      telefoneInput.focus();
      e.preventDefault();
    }
  });