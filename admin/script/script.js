const API_URL = 'https://script.google.com/macros/s/AKfycbxYTOj-NdzndaUqi263xYb_NEBKd2IBINhmneeUm7raSnhJrEWZvjNmsrfRz2-9suLD_w/exec';
const USER_EMAIL = 'paula@likehomepropriedades.com.br';  // <-- email autorizado
let SHA_ATUAL = '';

// Gera grupos (igual seu código original)
function gerarGrupo(id, titulo, campos, quantidade = 6) {
  let html = '';
  for (let i = 1; i <= quantidade; i++) {
    html += `<div class="accordion-item">
      <button class="accordion-toggle" type="button">${titulo} ${i}</button>
      <div class="accordion-content">`;
    campos.forEach(campo => {
      const nomeCampo = `${campo.prefixo}_${i}`;
      html += `<label>${campo.label}: `;
      if (campo.tipo === 'textarea') {
        html += `<textarea name="${nomeCampo}"></textarea>`;
      } else if (campo.tipo === 'file') {
        html += `<input type="file" name="${nomeCampo}" accept="image/*" />
                 <a id="link_${nomeCampo}" href="#" target="_blank" style="display:none; margin-left:10px;">Ver imagem</a>`;
      } else {
        html += `<input type="${campo.tipo}" name="${nomeCampo}" />`;
      }
      html += `</label>`;
    });
    html += `</div></div>`;
  }
  document.getElementById(id).innerHTML = html;
}

gerarGrupo('grupos-vantagens', 'Vantagem', [
  { label: 'Ícone', prefixo: 'icone_vantagem', tipo: 'file' },
  { label: 'Texto Destaque', prefixo: 'subtitulo_vantagem', tipo: 'text' },
  { label: 'Descrição', prefixo: 'txt_vantagem', tipo: 'textarea' }
]);

gerarGrupo('grupos-numeros', 'Número', [
  { label: 'Ícone', prefixo: 'icone_numero', tipo: 'file' },
  { label: 'Descrição', prefixo: 'txt_item', tipo: 'text' }
], 5);

gerarGrupo('grupos-servicos', 'Serviço', [
  { label: 'Título', prefixo: 'subtitulo_txt_servicos', tipo: 'text' },
  { label: 'Descrição', prefixo: 'txt_servicos', tipo: 'textarea' }
], 5);

document.addEventListener('change', function (e) {
  if (e.target.type === 'file') {
    const file = e.target.files[0];
    const link = document.getElementById('link_' + e.target.name);
    if (file && link) {
      const url = URL.createObjectURL(file);
      link.href = url;
      link.style.display = 'inline';
      link.textContent = 'Ver imagem selecionada';
    }
  }
});

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('accordion-toggle')) {
    e.target.classList.toggle('active');
    const content = e.target.nextElementSibling;
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  }
});

// Upload de imagem para backend, enviando email para autorização
async function uploadImagemParaGithub(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      try {
        const base64 = reader.result;
        const nomeArquivo = file.name;

        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: USER_EMAIL,
            imagemBase64: base64,
            nomeArquivo: nomeArquivo
          }),
        });

        const data = await res.json();
        if (data.success && data.imageUrl) {
          resolve(data.imageUrl);
        } else {
          reject(data.error || "Erro ao enviar imagem");
        }
      } catch (err) {
        reject(err.message);
      }
    };
    reader.readAsDataURL(file);
  });
}

// Coleta dados e faz upload de imagens
async function coletarDadosCSVComUpload() {
  const inputs = document.querySelectorAll('[name]');
  const data = [];

  for (const input of inputs) {
    const chave = input.name;
    let valor = "";

    if (input.type === "file") {
      const file = input.files[0];
      if (file) {
        try {
          valor = await uploadImagemParaGithub(file);
        } catch (erro) {
          alert(`Erro ao enviar imagem "${chave}": ${erro}`);
          throw erro;
        }
      }
    } else {
      valor = (input.value || "").replace(/(\r\n|\n|\r)/gm, " ").trim();
      if (typeof valor === 'string' && valor.startsWith('/admin/')) {
        valor = valor.replace(/^\/admin\//, '/');
      }
    }

    data.push({ chave, valor });
  }

  return Papa.unparse(data);
}

// Carrega CSV do backend enviando email para autorização
async function carregarDados() {
  const url = `${API_URL}?email=${encodeURIComponent(USER_EMAIL)}`;
  const res = await fetch(url, { method: 'GET' });
  const data = await res.json();

  if (data.error) {
    alert('Erro ao carregar CSV: ' + data.error);
    return;
  }

  SHA_ATUAL = data.sha || '';
  preencherFormulario(data.csv);
}

// Preenche o formulário com os dados do CSV
function preencherFormulario(csvText) {
  const resultado = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  resultado.data.forEach(({ chave, valor }) => {
    const input = document.querySelector(`[name="${chave}"]`);
    if (input && input.type !== 'file') {
      input.value = valor || '';
    }
    const link = document.getElementById('link_' + chave);
    if (link && valor) {
      try {
        const baseUrl = 'https://rentabilizar.likehomepropriedades.com.br';
        const urlCorrigida = new URL(valor.replace(/^\/admin\//, '/'), baseUrl);
        link.href = urlCorrigida.href;
        link.textContent = 'Ver imagem carregada';
        link.style.display = 'inline';
      } catch {
        link.style.display = 'none';
      }
    }
  });
}

// Envia CSV atualizado ao backend, junto com SHA e email para autorização
async function enviarDados() {
  try {
    const csv = await coletarDadosCSVComUpload();
    const payload = {
      email: USER_EMAIL,
      csv,
      sha: SHA_ATUAL
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.success) {
      SHA_ATUAL = data.commit;
      alert('Conteúdo atualizado com sucesso! Commit: ' + data.commit);
    } else {
      alert('Erro ao salvar: ' + (data.error || 'Erro desconhecido'));
    }
  } catch (err) {
    alert('Erro ao enviar dados: ' + err.message);
  }
}

// Inicializa a página
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await carregarDados();
    document.getElementById('btn-enviar').addEventListener('click', async e => {
      e.preventDefault();
      await enviarDados();
    });
  } catch (err) {
    console.error('Erro de inicialização:', err);
  }
});
