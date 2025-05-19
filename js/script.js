// script.js
// Carrega dados do CSV e preenche a página
fetch('data/dados.csv')
  .then(response => response.text())
  .then(csvText => {
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    }).data; // array de objetos {chave, valor}

    // Converte para objeto chave->valor
    const dados = Object.fromEntries(parsed.map(row => [row.chave, row.valor]));

    // Percorre todas as entradas e tenta inserir por ID
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

    // Se também usar data-content etc.
    document.querySelectorAll('[data-content]').forEach(el=>{
      const key = el.dataset.content;
      if (dados[key]) el.textContent = dados[key];
    });
  })
  .catch(err => console.error('Erro ao carregar CSV:', err));
