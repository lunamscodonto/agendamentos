let dentistas = [];
const lista = document.getElementById('listaDentistas');
const contador = document.getElementById('contador');
const pesquisa = document.getElementById('pesquisa');
const form = document.getElementById('formDentista');
const mensagem = document.getElementById('mensagem');

function mostrarMensagem(texto, erro=false){ if(!mensagem)return; mensagem.textContent=texto; mensagem.className=erro?'mensagem erro':'mensagem'; mensagem.style.display='block'; setTimeout(()=>mensagem.style.display='none',3000); }
async function carregarDentistas(){
  try{
    const r=await fetch('/dentistas'); const j=await r.json();
    if(!r.ok) throw new Error(j.erro||'Erro ao carregar profissionais');
    dentistas=j.dentistas||j.data||j||[]; renderizar();
  }catch(e){ console.error(e); mostrarMensagem(e.message,true); }
}
function renderizar(){
  const termo=(pesquisa?.value||'').toLowerCase().trim();
  const itens=dentistas.filter(d=>[d.nome,d.cro,d.especialidade,d.telefone,d.email].filter(Boolean).join(' ').toLowerCase().includes(termo));
  if(contador) contador.textContent=`${itens.length} profissional(is)`;
  if(!lista)return;
  if(!itens.length){lista.innerHTML='<div class="estado-vazio"><div class="icone">🦷</div><h3>Nenhum profissional cadastrado</h3><p>Cadastre o primeiro profissional.</p></div>';return;}
  lista.innerHTML=itens.map(d=>`<article class="paciente-card"><h3>🦷 ${esc(d.nome)}</h3><p><strong>CRO:</strong> ${esc(d.cro||'-')}</p><p><strong>Especialidade:</strong> ${esc(d.especialidade||'-')}</p><p><strong>Telefone:</strong> ${esc(d.telefone||'-')}</p><p><strong>E-mail:</strong> ${esc(d.email||'-')}</p></article>`).join('');
}
form?.addEventListener('submit',async e=>{e.preventDefault(); const body={nome:document.getElementById('nome')?.value.trim(),cro:document.getElementById('cro')?.value.trim(),especialidade:document.getElementById('especialidade')?.value.trim(),telefone:document.getElementById('telefone')?.value.trim(),email:document.getElementById('email')?.value.trim(),observacoes:document.getElementById('observacoes')?.value.trim()}; try{const r=await fetch('/dentistas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(j.erro||'Erro ao cadastrar profissional');mostrarMensagem('Profissional cadastrado com sucesso.');form.reset();carregarDentistas();}catch(e){console.error(e);mostrarMensagem(e.message,true);}});
pesquisa?.addEventListener('input',renderizar); document.getElementById('btnLimpar')?.addEventListener('click',()=>form?.reset());
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
carregarDentistas();
