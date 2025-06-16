const CSV_URL = "https://raw.githubusercontent.com/likehomepropriedades/rentabilizar/main/data/dados.csv";
// URL do CSV versionado no GitHub (arquivo raw)
const GITHUB_CSV_URL = "https://raw.githubusercontent.com/likehomepropriedades/rentabilizar/main/data/dados.csv";

// URL do Apps Script responsável apenas pelo upload de imagens
const API_URL = 'https://script.google.com/macros/s/AKfycbyx8e29uo5bIWBl82s0I_o2Mz9ZPzjW-IDp0Xs1TaqRaL0NWK7SbeFtE9dRO9FZcaz9QA/exec';

const USER_EMAIL = 'paula@likehomepropriedades.com.br';

let SHA_ATUAL = ""; // Opcional, se for necessário manter alguma referência

// Geração dos grupos de campos 
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
// --- Lida com as pré-visualizações das imagens ---
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

// --- Upload da imagem para o Google Drive ---
async function uploadImagemParaDrive(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      try {
        const base64 = reader.result;
        if (!base64 || !base64.startsWith('data:image')) {
          return reject('Formato de imagem inválido');
        }
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            email: USER_EMAIL,
            imagemBase64: base64,
            nomeArquivo: file.name
          })
        });
        const data = await res.json();
        if (data.success && data.imageUrl) {
          resolve(data.imageUrl);
        } else {
          reject(data.error || 'Erro ao enviar imagem');
        }
      } catch (err) {
        reject(err.message);
      }
    };
    reader.onerror = () => reject("Erro ao ler o arquivo");
    reader.readAsDataURL(file);
  });
}

// --- Coleta os dados do formulário e faz o upload das imagens ---
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
          valor = await uploadImagemParaDrive(file);
        } catch (erro) {
          alert(`Erro ao enviar imagem "${chave}": ${erro}`);
          throw erro;
        }
      } else {
        // Se nenhum novo arquivo foi selecionado, utiliza a URL já carregada (se existir)
        const linkImg = document.getElementById('link_' + chave);
        if (linkImg && linkImg.href && linkImg.href.startsWith("https://drive.google.com")) {
          valor = linkImg.href;
        }
      }
    } else {
      valor = (input.value || "").replace(/(\r\n|\n|\r)/gm, " ").trim();
      if (valor.startsWith('/admin/')) {
        valor = valor.replace(/^\/admin\//, '/');
      }
    }

    data.push({ chave, valor });
  }

  return Papa.unparse(data);
}

// --- Carrega o CSV a partir do GitHub ---
async function carregarDados() {
  try {
    const res = await fetch(GITHUB_CSV_URL);
    const csvText = await res.text();
    preencherFormulario(csvText);
  } catch (err) {
    alert("Erro ao carregar CSV do GitHub: " + err.message);
  }
}

// --- Preenche o formulário com os dados do CSV ---
function preencherFormulario(csvText) {
  const resultado = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  resultado.data.forEach(({ chave, valor }) => {
    const input = document.querySelector(`[name="${chave}"]`);
    if (input && input.type !== 'file') {
      input.value = valor || '';
    }
    const link = document.getElementById('link_' + chave);
    if (link && valor && valor.startsWith("https://drive.google.com")) {
      link.href = valor;
      link.textContent = 'Ver imagem carregada';
      link.style.display = 'inline';
    }
  });
}

// --- Envia os dados atualizados (gerando o novo CSV) ---
// Nesta nova abordagem, em vez de enviar o CSV para o Apps Script,
// criamos uma versão atualizada do CSV para que você possa fazer o commit manualmente.
async function enviarDados() {
  try {
    const csv = await coletarDadosCSVComUpload();
    // Cria um link para baixar o CSV atualizado
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "dados.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert("CSV atualizado! Faça o commit do novo arquivo no GitHub manualmente.");
  } catch (err) {
    alert("Erro ao enviar dados: " + err.message);
  }
}

// --- Inicialização ---
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
