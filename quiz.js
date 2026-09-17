const SUPABASE_URL =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb2J5ZWJvYW56Z3lhbnZkY2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjE3NDYsImV4cCI6MjEwNTEzNzc0Nn0.qd09anaLqxjFfVTbsamDghfuKzlTskzxRzN_pqARnK8";

const SUPABASE_ANON_KEY =
"REMPLACE_PAR_TA_CLE_ANON_SUPABASE";

const supabaseClient =
supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
);


/* Vérification connexion */

const sessionToken =
localStorage.getItem("afriquiz_session_token");

if(!sessionToken){
window.location.href="connexion.html";
}


/* Utilisateur */

document.getElementById("userName").textContent =
localStorage.getItem("afriquiz_username") ||
"Utilisateur";


let quizzes=[];


/* Charger les vrais quiz Supabase */

async function loadQuizzes(){

const box=document.getElementById("quizList");

const {data,error} =
await supabaseClient.rpc("get_public_quizzes");

if(error){

console.error(error);

box.innerHTML=
'<div class="message">Impossible de charger les quiz.</div>';

return;
}

quizzes=data || [];

renderQuizzes("all");
}


/* Affichage */

function renderQuizzes(filter){

const box=document.getElementById("quizList");

let list=quizzes;

if(filter==="free"){
list=quizzes.filter(q =>
Number(q.participation_fee)===0
);
}

if(filter==="paid"){
list=quizzes.filter(q =>
Number(q.participation_fee)>0
);
}

if(!list.length){

box.innerHTML=
'<div class="message">Aucun quiz disponible.</div>';

return;
}

box.innerHTML=list.map(q=>{

const fee =
Number(q.participation_fee)===0
? "Gratuit"
: `${q.participation_fee} ${q.currency || "XOF"}`;

return `
<article class="quiz-card">

<h2>${escapeHtml(q.title)}</h2>

<p>${escapeHtml(q.description || "")}</p>

<div class="quiz-info">
${q.question_count || 0} questions<br>
30 secondes par question<br>
Participation : ${fee}
</div>

<button class="start-btn"
onclick="startQuiz('${q.id}')">
Commencer
</button>

</article>
`;

}).join("");
}


/* Démarrer */

function startQuiz(id){

window.location.href =
"quiz-play.html?quiz=" +
encodeURIComponent(id);

}


/* Sécurité affichage */

function escapeHtml(value){

return String(value ?? "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}


/* Filtres */

document.querySelectorAll(".filter")
.forEach(button=>{

button.addEventListener("click",()=>{

document.querySelectorAll(".filter")
.forEach(b=>b.classList.remove("active"));

button.classList.add("active");

renderQuizzes(button.dataset.filter);

});

});


/* Déconnexion */

document.getElementById("logout")
.addEventListener("click",(e)=>{

e.preventDefault();

localStorage.clear();

window.location.href="connexion.html";

});


loadQuizzes();
