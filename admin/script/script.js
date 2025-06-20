// script.js atualizado para salvar dados e imagens no GitHub via Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbwaWyMMVNy3hGA1gsOC4tI7cFy0gRalZ7yoG68vmBZEqW4Nedll4Gp8ra12vepgWHSLlg/exec';
const CSV_URL = "https://raw.githubusercontent.com/likehomepropriedades/rentabilizar/main/data/dados.csv";
const USER_EMAIL = 'paula@likehomepropriedades.com.br';

function gerarGrupo(id, titulo, campos, quantidade = 6) {
  let html = "";
  for (let i = 1; i <= quantidade; i++) {
    html += `<div class="accordion-item">
      <button class="accordion-toggle" type="button">${titulo} ${i}</button>
      <div class="accordion-content">`;
    campos.forEach(campo => {
      const nomeCampo = `${campo.prefixo}_${i}`;
      html += `<label>${campo.label}: `;
      if (campo.tipo === "textarea") {
        html += `<textarea name="${nomeCampo}"></textarea>`;
      } else if (campo.tipo === "file") {
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

gerarGrupo("grupos-vantagens", "Vantagem", [
  { label: "Ícone", prefixo: "icone_vantagem", tipo: "file" },
  { label: "Texto Destaque", prefixo: "subtitulo_vantagem", tipo: "text" },
  { label: "Descrição", prefixo: "txt_vantagem", tipo: "textarea" }
]);

gerarGrupo("grupos-numeros", "Número", [
  { label: "Ícone", prefixo: "icone_numero", tipo: "file" },
  { label: "Descrição", prefixo: "txt_item", tipo: "text" }
], 5);

gerarGrupo("grupos-servicos", "Serviço", [
  { label: "Título", prefixo: "subtitulo_txt_servicos", tipo: "text" },
  { label: "Descrição", prefixo: "txt_servicos", tipo: "textarea" }
], 5);

// Pré-visualização de imagem selecionada

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
    content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + 'px';
  }
});

async function uploadImagemParaGitHub(file, campo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result;
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: USER_EMAIL,
            imagemBase64: base64,
            nomeArquivo: `${campo}-${file.name}`,
            campo: campo,
            action: 'upload'
          })
        });
        const data = await res.json();
        if (data.success) resolve(data.imageUrl);
        else reject(data.error || 'Erro ao enviar imagem');
      } catch (e) {
        reject(e.message);
      }
    };
    reader.onerror = () => reject("Erro ao ler o arquivo");
    reader.readAsDataURL(file);
  });
}

async function coletarDadosCSVComUpload() {
  const inputs = document.querySelectorAll('[name]');
  const data = [];

  for (const input of inputs) {
    const chave = input.name;
    let valor = "";

    if (input.type === "file") {
      const file = input.files[0];
      if (file) {
        valor = await uploadImagemParaGitHub(file, chave);
      } else {
        const link = document.getElementById('link_' + chave);
        if (link && link.href.includes("raw.githubusercontent")) {
          valor = link.href;
        }
      }
    } else {
      valor = (input.value || "").replace(/\r?\n|\r/g, ' ').trim();
    }

    data.push({ chave, valor });
  }

  return Papa.unparse(data);
}

async function carregarDados() {
  try {
    const res = await fetch(CSV_URL);
    const csvText = await res.text();
    preencherFormulario(csvText);
  } catch (err) {
    alert("Erro ao carregar CSV do GitHub: " + err.message);
  }
}

function preencherFormulario(csvText) {
  const resultado = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  resultado.data.forEach(({ chave, valor }) => {
    const input = document.querySelector(`[name="${chave}"]`);
    if (input && input.type !== 'file') input.value = valor || '';
    const link = document.getElementById('link_' + chave);
    if (link && valor && valor.startsWith("https://raw.githubusercontent")) {
      link.href = valor;
      link.textContent = 'Ver imagem carregada';
      link.style.display = 'inline';
    }
  });
}

async function enviarDados() {
  try {
    const csv = await coletarDadosCSVComUpload();
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: USER_EMAIL, action: "update", csv })
    });
    const resultado = await res.json();
    if (resultado.success) alert("Dados atualizados com sucesso no GitHub!");
    else alert("Erro ao salvar dados: " + (resultado.error || "Desconhecido"));
  } catch (err) {
    alert("Erro ao enviar dados: " + err.message);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await carregarDados();
  document.getElementById('btn-enviar').addEventListener('click', async e => {
    e.preventDefault();
    await enviarDados();
  });
});