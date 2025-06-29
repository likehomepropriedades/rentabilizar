const API_URL = 'https://proxy-likehome.vercel.app/api';
const CSV_URL = API_URL;
const USER_EMAIL = 'paula@likehomepropriedades.com.br';
const TOKEN_SECRETO = "likehome_2025_admin_token";

async function enviarParaAPI(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, token: TOKEN_SECRETO })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

function gerarGrupo(id, titulo, campos, quantidade = 6) {
  let html = "";

  for (let i = 1; i <= quantidade; i++) {
    html += `<div class="accordion-item">
      <button class="accordion-toggle material-toggle" type="button">
        <span class="material-icons">expand_more</span>
        <span>${titulo} ${i}</span>
      </button>
      <div class="accordion-content">`;

    campos.forEach(campo => {
      const nomeCampo = `${campo.prefixo}_${i}`;
      html += `<label>${campo.label}: `;

      if (campo.tipo === "textarea") {
        html += `<textarea name="${nomeCampo}"></textarea>`;
      } else if (campo.tipo === "file") {
        html += `
          <input type="file" name="${nomeCampo}" accept="image/*" />
          <a id="link_${nomeCampo}" href="#" target="_blank" style="display:none; margin-left:10px;">Ver imagem</a>
          <br>
          <img id="preview_${nomeCampo}" src="" alt="Preview ${nomeCampo}" style="display:none; max-width: 150px; margin-top: 5px;">
        `;
      } else {
        html += `<input type="${campo.tipo}" name="${nomeCampo}" />`;
      }

      html += `</label>`;
    });

    html += `</div></div>`;
  }

  document.getElementById(id).innerHTML = html;
}

// Gerar grupos
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

// Preview de imagens
document.addEventListener('change', e => {
  if (e.target.type === 'file') {
    const file = e.target.files[0];
    const link = document.getElementById('link_' + e.target.name);
    const preview = document.getElementById('preview_' + e.target.name);

    if (file && link) {
      const url = URL.createObjectURL(file);
      link.href = url;
      link.style.display = 'inline';
      link.textContent = 'Ver imagem selecionada';

      if (preview) {
        preview.src = url;
        preview.style.display = 'inline-block';
      }
    }
  }
});

// Accordions
document.addEventListener('click', e => {
  if (e.target.closest('.accordion-toggle')) {
    const toggle = e.target.closest('.accordion-toggle');
    const content = toggle.nextElementSibling;
    const icon = toggle.querySelector('.material-icons');

    toggle.classList.toggle('active');
    content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + 'px';
    icon.textContent = toggle.classList.contains('active') ? 'expand_less' : 'expand_more';
  }
});

document.querySelectorAll('.toggle-todos').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const containerId = link.dataset.target;
    const container = document.getElementById(containerId);
    if (!container) return;

    const accordions = container.querySelectorAll('.accordion-toggle');
    const algumFechado = Array.from(accordions).some(acc => !acc.classList.contains('active'));

    accordions.forEach(acc => {
      const content = acc.nextElementSibling;
      const icon = acc.querySelector('.material-icons');
      if (algumFechado) {
        acc.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
        if (icon) icon.textContent = 'expand_less';
      } else {
        acc.classList.remove('active');
        content.style.maxHeight = null;
        if (icon) icon.textContent = 'expand_more';
      }
    });

    link.textContent = algumFechado ? 'Fechar todos' : 'Abrir todos';
  });
});

// Upload imagem
async function uploadImagemParaGitHub(file, campo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result;
        const data = await enviarParaAPI({
          email: USER_EMAIL,
          imagemBase64: base64,
          nomeArquivo: `${campo}-${file.name}`,
          campo,
          action: 'upload'
        });
        resolve(data.imageUrl);
      } catch (err) {
        reject(`Erro ao enviar imagem (${campo}): ${err.message}`);
      }
    };
    reader.onerror = () => reject("Erro ao ler o arquivo");
    reader.readAsDataURL(file);
  });
}

// 🔴 VALIDAÇÃO COMPLETA dos campos (texto, textarea e arquivos)
function validarTodosCampos() {
  const formulario = document.getElementById('formulario-conteudo');
  const campos = formulario.querySelectorAll('[name]');
  for (const campo of campos) {
    campo.classList.remove("campo-invalido");

    if (campo.name === 'viewport') continue;

    if (campo.type === 'file') {
      const file = campo.files[0];
      const link = document.getElementById('link_' + campo.name);
      const jaTemImagem = link && link.href.includes("raw.githubusercontent");
      if (!file && !jaTemImagem) {
        campo.classList.add("campo-invalido");
        campo.scrollIntoView({ behavior: "smooth", block: "center" });
        alert(`O campo "${campo.name}" precisa de uma imagem.`);
        return false;
      }
    } else {
      if (!campo.value.trim()) {
        campo.classList.add("campo-invalido");
        campo.focus();
        alert(`Preencha o campo: ${campo.name}`);
        return false;
      }
    }
  }

  return true;
}

// Coleta e envio
async function coletarDadosCSVComUpload() {
  const formulario = document.getElementById('formulario-conteudo');
  const inputs = formulario.querySelectorAll('[name]');
  const data = [];

  for (const input of inputs) {
    const chave = input.name;
    let valor = "";

    if (!chave || chave === 'viewport') continue;

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

    data.push({ chave: chave.trim(), valor });
  }

  const csvSemBOM = Papa.unparse(data);
  return "\uFEFF" + csvSemBOM;
}

// Preencher formulário
function preencherFormulario(csvText) {
  const resultado = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const baseURL = "https://raw.githubusercontent.com/likehomepropriedades/rentabilizar/main/";

  resultado.data.forEach(({ chave, valor }) => {
    const input = document.querySelector(`[name="${chave}"]`);
    if (input && input.type !== 'file') {
      input.value = valor || '';
    }
    const link = document.getElementById('link_' + chave);
    const preview = document.getElementById('preview_' + chave);
    if (link && valor) {
      let url = valor;
      if (!valor.startsWith('http')) {
        const caminho = valor.startsWith('/') ? valor.slice(1) : valor;
        url = baseURL + caminho;
      }
      link.href = url;
      link.textContent = 'Ver imagem carregada';
      link.style.display = 'inline';
      if (preview) {
        preview.src = url;
        preview.style.display = 'inline-block';
      }
    }
  });
}

// Enviar dados
async function enviarDados() {
  const botao = document.getElementById('btn-enviar');
  botao.disabled = true;
  botao.textContent = 'Enviando...';

  try {
    if (!validarTodosCampos()) {
      botao.disabled = false;
      botao.textContent = 'Salvar alterações';
      return;
    }

    const csv = await coletarDadosCSVComUpload();
    await enviarParaAPI({
      email: USER_EMAIL,
      action: "update",
      csv
    });

    alert("Dados atualizados com sucesso no GitHub!");
    await carregarDados();
  } catch (err) {
    alert("Erro ao enviar dados: " + err.message);
  } finally {
    botao.disabled = false;
    botao.textContent = 'Salvar alterações';
  }
}

async function carregarDados() {
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);
    const csvText = await res.text();
    preencherFormulario(csvText);
  } catch (err) {
    alert("Erro ao carregar CSV: " + err.message);
    console.error("Erro ao carregar CSV:", err);
  }
}

// Iniciar
document.addEventListener('DOMContentLoaded', async () => {
  await carregarDados();

  document.getElementById('btn-enviar').addEventListener('click', async e => {
    e.preventDefault();
    await enviarDados();
  });
});
