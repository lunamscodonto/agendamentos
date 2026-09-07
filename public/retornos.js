const form = document.getElementById("formRetorno");
const pacienteSelect = document.getElementById("paciente_id");
const dentistaSelect = document.getElementById("dentista_id");
const dataRetorno = document.getElementById("data_retorno");
const horario = document.getElementById("horario");
const motivo = document.getElementById("motivo");
const observacoes = document.getElementById("observacoes");
const lista = document.getElementById("listaRetornos");
const mensagem = document.getElementById("mensagem");

function hojeISO(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
function esc(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function dataBR(v){if(!v)return "-"; const p=String(v).split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v;}
function horaBR(v){if(!v)return "--:--"; return String(v).slice(0,5);}
function mostrar(texto, tipo="") {
  const erro = tipo === "erro";
  mensagem.textContent = texto ? (erro ? `❌ ${texto}` : `✅ ${texto}`) : "";
  mensagem.className = erro ? "erro" : "sucesso";
  mensagem.style.cssText = texto ? `
    display:block;
    position:fixed;
    top:24px;
    right:24px;
    z-index:99999;
    max-width:420px;
    padding:16px 20px;
    border-radius:14px;
    font-weight:700;
    font-size:16px;
    line-height:1.4;
    color:#ffffff;
    background:${erro ? "#b8473b" : "#176b4d"};
    border:1px solid ${erro ? "#e7a29a" : "#6ad4a7"};
    box-shadow:0 14px 35px rgba(0,0,0,.28);
    opacity:1;
    transform:translateY(0);
    transition:opacity .25s ease, transform .25s ease;
  ` : "display:none;";

  clearTimeout(mensagem._timer);

  if (texto) {
    mensagem._timer = setTimeout(() => {
      mensagem.style.opacity = "0";
      mensagem.style.transform = "translateY(-8px)";
      setTimeout(() => {
        mensagem.style.display = "none";
        mensagem.style.opacity = "1";
        mensagem.style.transform = "translateY(0)";
      }, 250);
    }, 3500);
  }
}

async function carregarCadastros(){
  const [rp, rd] = await Promise.all([fetch("/pacientes"), fetch("/dentistas")]);
  const jp = await rp.json(); const jd = await rd.json();
  if(!rp.ok) throw new Error(jp.erro||"Erro ao carregar pacientes.");
  if(!rd.ok) throw new Error(jd.erro||"Erro ao carregar dentistas.");
  const pacientes=jp.pacientes||[]; const dentistas=jd.dentistas||[];
  pacienteSelect.innerHTML='<option value="">Selecione o paciente</option>'+pacientes.map(p=>`<option value="${esc(p.id)}">${esc(p.nome)}${p.telefone?` — ${esc(p.telefone)}`:""}</option>`).join("");
  dentistaSelect.innerHTML='<option value="">Não informado</option>'+dentistas.map(d=>`<option value="${esc(d.id)}">${esc(d.nome)}</option>`).join("");
}

async function carregarRetornos(){
  lista.innerHTML='<div class="estado">⏳ Carregando retornos...</div>';
  const r=await fetch("/retornos/pendentes"); const j=await r.json();
  if(!r.ok) throw new Error(j.erro||"Erro ao carregar retornos.");
  document.getElementById("totalAtrasados").textContent=j.atrasados||0;
  document.getElementById("totalHoje").textContent=j.hoje||0;
  document.getElementById("totalProximos").textContent=j.proximos||0;
  const itens=j.retornos||[];
  if(!itens.length){lista.innerHTML='<div class="estado">✅ Nenhum retorno pendente.</div>';return;}
  const ordem={atrasado:0,hoje:1,proximo:2};
  lista.innerHTML=itens.slice().sort((a,b)=>(ordem[a.situacao]??9)-(ordem[b.situacao]??9)||String(a.data_retorno).localeCompare(String(b.data_retorno))).map(x=>{
    const situacao=x.situacao==="atrasado"?"Atrasado":x.situacao==="hoje"?"Para hoje":"Próximo";
    return `<div class="item"><div><strong>👤 ${esc(x.pacientes?.nome||"Paciente")}</strong><br><small>📅 ${esc(dataBR(x.data_retorno))} às ⏰ ${esc(horaBR(x.horario))} • 🦷 ${esc(x.dentistas?.nome||"Dentista não informado")}${x.motivo?` • 📝 ${esc(x.motivo)}`:""}</small>${x.observacoes?`<br><small>${esc(x.observacoes)}</small>`:""}</div><div><span class="badge ${esc(x.situacao)}">${situacao}</span><div class="acoes"><button class="realizar" data-id="${esc(x.id)}" data-status="realizado">✅ Realizado</button><button class="cancelar" data-id="${esc(x.id)}" data-status="cancelado">🚫 Cancelar</button></div></div></div>`;
  }).join("");
}

form.addEventListener("submit", async e=>{
  e.preventDefault(); mostrar("");
  try{
    const corpo={paciente_id:pacienteSelect.value,dentista_id:dentistaSelect.value||null,data_retorno:dataRetorno.value,horario:horario.value,motivo:motivo.value.trim()||null,observacoes:observacoes.value.trim()||null};
    const r=await fetch("/retornos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(corpo)});
    const j=await r.json(); if(!r.ok) throw new Error(j.erro||"Não foi possível salvar.");
    mostrar("✅ Retorno cadastrado com sucesso!","sucesso"); form.reset(); dataRetorno.min=hojeISO(); await carregarRetornos();
  }catch(err){mostrar("⚠️ "+err.message,"erro");}
});

document.getElementById("btnLimpar").addEventListener("click",()=>{form.reset();dataRetorno.min=hojeISO();dataRetorno.value=hojeISO();horario.value="08:00";mostrar("");});

lista.addEventListener("click",async e=>{
  const b=e.target.closest("button[data-id]"); if(!b)return;
  if(!confirm(b.dataset.status==="realizado"?"Confirmar retorno como realizado?":"Cancelar este retorno?"))return;
  try{
    const r=await fetch(`/retornos/${encodeURIComponent(b.dataset.id)}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:b.dataset.status})});
    const j=await r.json(); if(!r.ok) throw new Error(j.erro||"Não foi possível atualizar.");
    await carregarRetornos();
  }catch(err){alert("Erro: "+err.message);}
});

(async()=>{dataRetorno.min=hojeISO();dataRetorno.value=hojeISO();horario.value="08:00";try{await carregarCadastros();await carregarRetornos();}catch(err){lista.innerHTML=`<div class="estado erro">⚠️ ${esc(err.message)}</div>`;}})();
