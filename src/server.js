import http from 'http';
import { readFile, writeFile, stat } from 'fs/promises';
import { extname, join, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename=fileURLToPath(import.meta.url), __dirname=dirname(__filename);
const ROOT=join(__dirname,'..'), PUBLIC=join(ROOT,'public'), BUGS_FILE=join(ROOT,'data','bugs.json');
const PORT=process.env.PORT||3030;
const ACCESS_CODE=process.env.ACCESS_CODE||'QAJOB2026';

const stories=[
 {id:'US-001',jira:'NEX-142',title:'Autenticação de clientes',desc:'Como cliente cadastrado, quero acessar minha conta com e-mail e senha para consultar meus pedidos.',criteria:['Credenciais válidas permitem acesso.','Credenciais inválidas são rejeitadas.','Campos obrigatórios são validados.','Após 5 tentativas inválidas a conta deve ser bloqueada.'],lab:'login',bugs:[
  ['BUG-001-01',['senha vazia','sem senha'],'Login aceita senha vazia.'],['BUG-001-02',['5 tentativas','cinco tentativas','bloqueio'],'Conta não é bloqueada após 5 tentativas inválidas.'],['BUG-001-03',['mostrar senha','olho','visibilidade'],'Botão de mostrar senha não volta a ocultá-la.']]},
 {id:'US-002',jira:'NEX-155',title:'Cadastro de novo cliente',desc:'Como visitante, quero criar uma conta para realizar compras.',criteria:['Nome, e-mail e senha são obrigatórios.','E-mail deve ter formato válido.','Senhas devem coincidir.'],lab:'register',bugs:[
  ['BUG-002-01',['email inválido','e-mail inválido','formato'],'Cadastro aceita e-mail sem formato válido.'],['BUG-002-02',['senhas diferentes','senha diferente','não coincidem'],'Cadastro aceita confirmação de senha diferente.'],['BUG-002-03',['nome vazio','sem nome','nome obrigatório'],'Cadastro permite nome vazio.']]},
 {id:'US-003',jira:'NEX-168',title:'Busca de produtos',desc:'Como cliente, quero buscar produtos pelo nome para encontrá-los rapidamente.',criteria:['Busca ignora diferença entre maiúsculas/minúsculas.','Busca vazia não deve retornar erro.','Mensagem deve indicar quando nada for encontrado.'],lab:'search',bugs:[
  ['BUG-003-01',['maiúscula','minúscula','case sensitive'],'Busca é sensível a maiúsculas/minúsculas.'],['BUG-003-02',['busca vazia','campo vazio','vazio'],'Busca vazia retorna todos os produtos.'],['BUG-003-03',['nenhum resultado','não encontrado','mensagem'],'Busca sem resultado não exibe mensagem adequada.']]},
 {id:'US-004',jira:'NEX-174',title:'Carrinho de compras',desc:'Como cliente, quero alterar quantidades no carrinho para controlar meu pedido.',criteria:['Quantidade mínima é 1.','Total deve acompanhar a quantidade.','Item pode ser removido.'],lab:'cart',bugs:[
  ['BUG-004-01',['quantidade zero','zero','negativa'],'Carrinho permite quantidade zero/negativa.'],['BUG-004-02',['total incorreto','valor total','não atualiza'],'Total não é recalculado ao alterar quantidade.'],['BUG-004-03',['remover','excluir item','remoção'],'Botão remover não exclui o item do carrinho.']]},
 {id:'US-005',jira:'NEX-181',title:'Aplicação de cupom',desc:'Como cliente, quero aplicar um cupom válido para receber desconto.',criteria:['Cupom válido aplica desconto.','Cupom inválido é rejeitado.','Cupom não pode ser aplicado duas vezes.'],lab:'coupon',bugs:[
  ['BUG-005-01',['cupom inválido','invalido'],'Cupom inválido é aceito.'],['BUG-005-02',['duas vezes','duplicado','reaplicar'],'Mesmo cupom pode ser aplicado repetidamente.'],['BUG-005-03',['desconto incorreto','percentual','valor do desconto'],'Percentual do desconto calculado incorretamente.']]},
 {id:'US-006',jira:'NEX-193',title:'Checkout e pagamento',desc:'Como cliente, quero finalizar a compra informando dados de pagamento.',criteria:['Cartão deve ter 16 dígitos.','CVV é obrigatório.','Pedido só é criado com dados válidos.'],lab:'checkout',bugs:[
  ['BUG-006-01',['cartão curto','menos de 16','16 dígitos'],'Checkout aceita cartão com menos de 16 dígitos.'],['BUG-006-02',['cvv vazio','sem cvv','cvv obrigatório'],'Checkout aceita CVV vazio.'],['BUG-006-03',['duplo clique','pedido duplicado','duas compras'],'Duplo clique cria pedidos duplicados.']]},
 {id:'US-007',jira:'NEX-205',title:'Atualização de perfil',desc:'Como cliente, quero alterar meu nome e telefone para manter meus dados atualizados.',criteria:['Nome não pode ficar vazio.','Telefone deve conter apenas números.','Salvar deve confirmar a alteração.'],lab:'profile',bugs:[
  ['BUG-007-01',['nome vazio','sem nome'],'Perfil salva nome vazio.'],['BUG-007-02',['telefone letras','telefone inválido','letras'],'Telefone aceita caracteres alfabéticos.'],['BUG-007-03',['sem confirmação','mensagem de sucesso','feedback'],'Alteração é salva sem feedback ao usuário.']]},
 {id:'US-008',jira:'NEX-216',title:'Recuperação de senha',desc:'Como cliente, quero solicitar recuperação de senha pelo meu e-mail.',criteria:['E-mail é obrigatório.','Formato do e-mail deve ser válido.','Sistema não deve expor se o e-mail existe.'],lab:'recover',bugs:[
  ['BUG-008-01',['email vazio','e-mail vazio','sem email'],'Recuperação aceita e-mail vazio.'],['BUG-008-02',['formato inválido','email inválido','e-mail inválido'],'Recuperação aceita e-mail malformado.'],['BUG-008-03',['email existe','usuário existe','expõe'],'Mensagem revela se o e-mail está cadastrado.']]},
 {id:'US-009',jira:'NEX-228',title:'Cadastro de endereço',desc:'Como cliente, quero cadastrar um endereço de entrega.',criteria:['CEP deve ter 8 dígitos.','Número é obrigatório.','Estado deve ser selecionado.'],lab:'address',bugs:[
  ['BUG-009-01',['cep curto','cep inválido','8 dígitos'],'Aceita CEP com menos de 8 dígitos.'],['BUG-009-02',['número vazio','sem número','numero obrigatorio'],'Permite salvar endereço sem número.'],['BUG-009-03',['estado vazio','sem estado','uf'],'Permite salvar sem selecionar estado.']]},
 {id:'US-010',jira:'NEX-239',title:'Newsletter',desc:'Como visitante, quero assinar a newsletter para receber novidades.',criteria:['E-mail deve ser válido.','Não permitir assinatura duplicada.','Exibir confirmação de cadastro.'],lab:'newsletter',bugs:[
  ['BUG-010-01',['email inválido','e-mail inválido'],'Newsletter aceita e-mail inválido.'],['BUG-010-02',['duplicado','duas vezes','já cadastrado'],'Mesmo e-mail pode ser cadastrado várias vezes.'],['BUG-010-03',['sem confirmação','não confirma','feedback'],'Cadastro não apresenta confirmação adequada.']]},
 {id:'US-011',jira:'NEX-247',title:'Logout da sessão',desc:'Como cliente autenticado, quero sair da conta com segurança.',criteria:['Logout encerra a sessão.','Voltar no navegador não deve reabrir conteúdo protegido.','Token local deve ser removido.'],lab:'logout',bugs:[
  ['BUG-011-01',['sessão continua','não encerra','permanece logado'],'Logout visual não encerra a sessão.'],['BUG-011-02',['voltar','back','página protegida'],'Após logout, voltar exibe conteúdo protegido.'],['BUG-011-03',['token','localstorage','armazenado'],'Token permanece armazenado após logout.']]}
];

function publicStories(){return stories.map(({bugs,...s})=>({...s,bugCount:bugs.length}));}
function answerKey(){return stories.map(s=>({id:s.id,jira:s.jira,title:s.title,bugs:s.bugs.map(([id,,answer])=>({id,answer}))}));}
async function readBugs(){try{return JSON.parse(await readFile(BUGS_FILE,'utf8'));}catch{return []}}
async function saveBugs(x){await writeFile(BUGS_FILE,JSON.stringify(x,null,2));}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}
function scoreBug(bug){const story=stories.find(s=>s.id===bug.storyId);if(!story)return {matched:null,points:1};const hay=`${bug.title} ${bug.steps} ${bug.actual} ${bug.expected}`.toLowerCase();const found=story.bugs.find(([,keys])=>keys.some(k=>hay.includes(k)));return found?{matched:found[0],points:10}:{matched:null,points:2};}
async function body(req){return new Promise((resolve,reject)=>{let x='';req.on('data',c=>x+=c);req.on('end',()=>{try{resolve(JSON.parse(x||'{}'))}catch(e){reject(e)}})})}

async function handleApi(req,res,url){
 const studentEmail=(req.headers['x-student-email']||'').toString().trim().toLowerCase();
 if(req.method==='POST'&&url.pathname==='/api/access'){try{const x=await body(req);if(!x.email||!x.name||x.code!==ACCESS_CODE)return json(res,401,{error:'Código de acesso inválido. Confira o código enviado após a compra.'});return json(res,200,{ok:true,email:String(x.email).toLowerCase()});}catch{return json(res,400,{error:'Dados de acesso inválidos.'})}}
 if(req.method==='GET'&&url.pathname==='/api/stories')return json(res,200,{stories:publicStories()});
 if(req.method==='GET'&&url.pathname==='/api/answers')return json(res,200,{stories:answerKey()});
 if(req.method==='GET'&&url.pathname==='/api/bugs'){
  const allBugs=await readBugs(); const bugs=allBugs.filter(b=>(b.studentEmail||'')===studentEmail); const score=bugs.reduce((s,b)=>s+(b.points||0),0);
  const progress=stories.map(s=>{const found=[...new Set(bugs.filter(b=>b.storyId===s.id).map(b=>b.matched).filter(Boolean))];return {storyId:s.id,found:found.length,required:s.bugs.length,passed:found.length===s.bugs.length};});
  return json(res,200,{bugs,score,maxScore:stories.length*30,found:[...new Set(bugs.map(b=>b.matched).filter(Boolean))].length,totalRequired:stories.reduce((n,s)=>n+s.bugs.length,0),progress});
 }
 if(req.method==='POST'&&url.pathname==='/api/bugs'){
  try{const bug=await body(req);if(!bug.storyId||!bug.title||!bug.steps||!bug.actual||!bug.expected||!bug.severity)return json(res,400,{error:'Preencha todos os campos obrigatórios.'});
   if(!studentEmail)return json(res,401,{error:'Sessão do aluno não identificada.'}); const result=scoreBug(bug),bugs=await readBugs(),now=new Date().toISOString();
   const duplicate=result.matched&&bugs.some(b=>b.studentEmail===studentEmail&&b.storyId===bug.storyId&&b.matched===result.matched);
   const item={id:`RPT-${String(bugs.length+1).padStart(3,'0')}`,...bug,priority:bug.priority||'Média',observations:bug.observations||'',evidence:bug.evidence||'',studentEmail,...result,points:duplicate?0:result.points,duplicate,status:'Aguardando correção',correctionStatus:'pending',correctionNote:'',retestCount:0,createdAt:now,updatedAt:now,timeline:[{at:now,label:'Bug criado',note:'Defeito registrado pelo QA e encaminhado para análise.'}]};bugs.push(item);await saveBugs(bugs);return json(res,201,item);
  }catch{return json(res,400,{error:'JSON inválido.'})}
 }
 if(req.method==='POST'&&/^\/api\/bugs\/[^/]+\/retest$/.test(url.pathname)){
  const id=decodeURIComponent(url.pathname.split('/')[3]),bugs=await readBugs(),i=bugs.findIndex(b=>b.id===id&&b.studentEmail===studentEmail);if(i<0)return json(res,404,{error:'Bug report não encontrado.'});
  const item=bugs[i],story=stories.find(s=>s.id===item.storyId),defect=story?.bugs.find(([bid])=>bid===item.matched),now=new Date().toISOString();
  if(defect){item.status='Corrigido';item.correctionStatus='passed';item.correctionNote=`Correção simulada: ${defect[2]}`;}else{item.status='Necessita revisão';item.correctionStatus='failed';item.correctionNote='O report não corresponde a um defeito previsto desta US. Revise passos, resultado atual e esperado.';}
  item.retestedAt=now;item.retestCount=(item.retestCount||0)+1;item.updatedAt=now;item.timeline.push({at:now,label:item.correctionStatus==='passed'?'Reteste aprovado':'Reteste falhou',note:item.correctionNote});bugs[i]=item;await saveBugs(bugs);return json(res,200,item);
 }
 if(req.method==='PUT'&&/^\/api\/bugs\/[^/]+$/.test(url.pathname)){
  const id=decodeURIComponent(url.pathname.split('/')[3]),bugs=await readBugs(),i=bugs.findIndex(b=>b.id===id&&b.studentEmail===studentEmail);if(i<0)return json(res,404,{error:'Bug report não encontrado.'});
  const item=bugs[i];if(!item.retestedAt)return json(res,409,{error:'A edição é liberada somente após executar o primeiro reteste.'});if(item.correctionStatus==='closed')return json(res,409,{error:'Bug fechado não pode ser editado. Reabra o bug antes de alterar.'});
  try{const x=await body(req);if(!x.title||!x.steps||!x.actual||!x.expected||!x.severity)return json(res,400,{error:'Preencha todos os campos obrigatórios.'});
   const updated={...item,title:String(x.title).trim(),steps:String(x.steps).trim(),actual:String(x.actual).trim(),expected:String(x.expected).trim(),severity:String(x.severity),priority:String(x.priority||item.priority||'Média'),evidence:String(x.evidence||''),observations:String(x.observations||'')};
   const result=scoreBug(updated),duplicate=result.matched&&bugs.some((b,idx)=>idx!==i&&b.studentEmail===studentEmail&&b.storyId===updated.storyId&&b.matched===result.matched),now=new Date().toISOString();
   updated.matched=result.matched;updated.duplicate=!!duplicate;updated.points=duplicate?0:result.points;updated.status='Reaberto';updated.correctionStatus='reopened';updated.correctionNote='Report atualizado pelo QA. Execute um novo reteste para validar a correção.';updated.updatedAt=now;updated.timeline=[...(item.timeline||[]),{at:now,label:'Bug editado / Reaberto',note:'Informações do report foram ajustadas pelo QA após o reteste e enviadas para nova análise.'}];
   bugs[i]=updated;await saveBugs(bugs);return json(res,200,updated);
  }catch{return json(res,400,{error:'Dados de edição inválidos.'})}
 }
 if(req.method==='DELETE'&&/^\/api\/bugs\/[^/]+$/.test(url.pathname)){
  const id=decodeURIComponent(url.pathname.split('/')[3]),bugs=await readBugs(),i=bugs.findIndex(b=>b.id===id&&b.studentEmail===studentEmail);if(i<0)return json(res,404,{error:'Bug report não encontrado.'});bugs.splice(i,1);await saveBugs(bugs);return json(res,200,{ok:true});
 }
 if(req.method==='POST'&&/^\/api\/bugs\/[^/]+\/(approve|reopen)$/.test(url.pathname)){
  const p=url.pathname.split('/'),id=decodeURIComponent(p[3]),action=p[4],bugs=await readBugs(),i=bugs.findIndex(b=>b.id===id&&b.studentEmail===studentEmail);if(i<0)return json(res,404,{error:'Bug report não encontrado.'});const item=bugs[i],now=new Date().toISOString();
  if(action==='approve'){if(item.correctionStatus!=='passed')return json(res,409,{error:'Execute um reteste aprovado antes de fechar.'});item.status='Fechado';item.correctionStatus='closed';item.timeline.push({at:now,label:'Correção aprovada / Bug fechado',note:'QA aprovou a correção e encerrou o defeito.'});}
  else{item.status='Reaberto';item.correctionStatus='reopened';item.timeline.push({at:now,label:'Bug reaberto',note:'QA reabriu o defeito para nova correção.'});}
  item.updatedAt=now;bugs[i]=item;await saveBugs(bugs);return json(res,200,item);
 }
 if(req.method==='DELETE'&&url.pathname==='/api/bugs'){const bugs=await readBugs();await saveBugs(bugs.filter(b=>(b.studentEmail||'')!==studentEmail));return json(res,200,{ok:true});}
 return json(res,404,{error:'Not found'});
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8'};
http.createServer(async(req,res)=>{const url=new URL(req.url,`http://${req.headers.host}`);if(url.pathname.startsWith('/api/'))return handleApi(req,res,url);let p=url.pathname==='/'?'/index.html':url.pathname;p=normalize(p).replace(/^([.][.][/\\])+/,'');const file=join(PUBLIC,p);if(!file.startsWith(PUBLIC)){res.writeHead(403);return res.end('Forbidden')}try{const s=await stat(file);if(!s.isFile())throw 0;const d=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(d)}catch{const d=await readFile(join(PUBLIC,'index.html'));res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(d)}}).listen(PORT,()=>console.log(`QA Job Simulator — Hotmart MVP 1.1 em http://localhost:${PORT}`));
