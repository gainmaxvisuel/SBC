const supabaseClient = supabase.createClient(
    "https://ypobyeboanzgyanvdcdq.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb2J5ZWJvYW56Z3lhbnZkY2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjE3NDYsImV4cCI6MjEwNTEzNzc0Nn0.qd09anaLqxjFfVTbsamDghfuKzlTskzxRzN_pqARnK8"
);


// ==========================
// ÉLÉMENTS
// ==========================

const sidebar = document.getElementById("sidebar");
const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");
const logoutBtn = document.getElementById("logoutBtn");
const quizList = document.getElementById("quizList");

let quizzes = [];


// ==========================
// MENU
// ==========================

openMenu.addEventListener("click", () => {
    sidebar.classList.add("open");
    openMenu.setAttribute("aria-expanded", "true");
});

closeMenu.addEventListener("click", () => {
    sidebar.classList.remove("open");
    openMenu.setAttribute("aria-expanded", "false");
});


// ==========================
// CHARGEMENT
// ==========================

document.addEventListener("DOMContentLoaded", loadQuizzes);


async function loadQuizzes(){

    const token =
        localStorage.getItem("afriquiz_session_token");

    if(!token){
        window.location.href = "connexion.html";
        return;
    }


    document.getElementById("topUsername").textContent =
        localStorage.getItem("afriquiz_username") ||
        "Utilisateur";


    try{

        const { data, error } =
            await supabaseClient.rpc(
                "get_public_quizzes"
            );


        if(error){
            throw error;
        }


        quizzes = data || [];

        renderQuizzes("all");


    }catch(error){

        console.error(
            "Erreur chargement quiz :",
            error
        );

        quizList.innerHTML = `
            <div class="empty">
                Impossible de charger les quiz.
            </div>
        `;
    }
}


// ==========================
// AFFICHAGE
// ==========================

function renderQuizzes(filter){

    let list = quizzes;


    if(filter === "free"){

        list = quizzes.filter(q =>
            Number(q.participation_fee) === 0
        );

    }


    if(filter === "paid"){

        list = quizzes.filter(q =>
            Number(q.participation_fee) > 0
        );

    }


    if(!list.length){

        quizList.innerHTML = `
            <div class="empty">
                Aucun quiz disponible.
            </div>
        `;

        return;
    }


    quizList.innerHTML = list.map(q => {

        const fee =
            Number(q.participation_fee) === 0
            ? "Gratuit"
            : `${q.participation_fee} ${q.currency || "XOF"}`;


        return `
            <article class="quiz-card">

                <h2>
                    ${escapeHtml(q.title)}
                </h2>

                <p>
                    ${escapeHtml(q.description || "")}
                </p>

                <div class="quiz-info">

                    ${Number(q.question_count || 0)}
                    questions<br>

                    30 secondes par question<br>

                    Participation :
                    <span class="quiz-price">
                        ${escapeHtml(fee)}
                    </span>

                </div>

                <button
                    class="start-btn"
                    onclick="startQuiz('${q.id}')">

                    Commencer

                </button>

            </article>
        `;

    }).join("");
}


// ==========================
// DÉMARRER QUIZ
// ==========================

function startQuiz(id){

    window.location.href =
        "quiz-play.html?quiz=" +
        encodeURIComponent(id);

}


// ==========================
// FILTRES
// ==========================

document.querySelectorAll(".filter")
.forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".filter")
        .forEach(btn =>
            btn.classList.remove("active")
        );


        button.classList.add("active");


        renderQuizzes(
            button.dataset.filter
        );

    });

});


// ==========================
// DÉCONNEXION
// ==========================

logoutBtn.addEventListener("click", async () => {

    const token =
        localStorage.getItem(
            "afriquiz_session_token"
        );


    if(token){

        try{

            const tokenHash =
                await sha256(token);


            await supabaseClient.rpc(
                "revoke_app_session",
                {
                    p_session_token_hash:
                        tokenHash
                }
            );

        }catch(error){

            console.error(
                "Erreur déconnexion :",
                error
            );

        }

    }


    localStorage.removeItem(
        "afriquiz_session_token"
    );

    localStorage.removeItem(
        "afriquiz_user_id"
    );

    localStorage.removeItem(
        "afriquiz_professional_id"
    );

    localStorage.removeItem(
        "afriquiz_username"
    );

    localStorage.removeItem(
        "afriquiz_country"
    );


    window.location.href =
        "connexion.html";

});


// ==========================
// SHA-256
// ==========================

async function sha256(text){

    const data =
        new TextEncoder().encode(text);

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return Array.from(
        new Uint8Array(hash)
    )
    .map(byte =>
        byte
        .toString(16)
        .padStart(2,"0")
    )
    .join("");
}


// ==========================
// SÉCURITÉ HTML
// ==========================

function escapeHtml(value){

    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
          }
