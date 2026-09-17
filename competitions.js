const supabaseClient = supabase.createClient(
    "https://ypobyeboanzgyanvdcdq.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb2J5ZWJvYW56Z3lhbnZkY2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjE3NDYsImV4cCI6MjEwNTEzNzc0Nn0.qd09anaLqxjFfVTbsamDghfuKzlTskzxRzN_pqARnK8"
);

const sessionToken =
    localStorage.getItem("afriquiz_session_token");

const userId =
    localStorage.getItem("afriquiz_user_id");

const username =
    localStorage.getItem("afriquiz_username") ||
    "Utilisateur";


/* SESSION */

if(!sessionToken || !userId){

    window.location.href =
        "connexion.html";
}


/* ELEMENTS */

const sidebar =
    document.getElementById("sidebar");

const openMenu =
    document.getElementById("openMenu");

const closeMenu =
    document.getElementById("closeMenu");

const overlay =
    document.getElementById("overlay");

const logoutBtn =
    document.getElementById("logoutBtn");

const usernameElement =
    document.getElementById("username");

const grid =
    document.getElementById(
        "competitionsGrid"
    );

const filters =
    document.querySelectorAll(
        ".filter"
    );


usernameElement.textContent =
    username;


/* DONNEES */

let competitions = [];
let currentFilter = "all";


/* MENU */

openMenu.addEventListener(
    "click",
    () => {

        sidebar.classList.add("open");
        overlay.classList.add("active");

    }
);


closeMenu.addEventListener(
    "click",
    closeSidebar
);


overlay.addEventListener(
    "click",
    closeSidebar
);


function closeSidebar(){

    sidebar.classList.remove("open");
    overlay.classList.remove("active");

}


/* LOGOUT */

logoutBtn.addEventListener(
    "click",
    async () => {

        try{

            await supabaseClient.rpc(
                "revoke_app_session",
                {
                    p_session_token_hash:
                        await hashToken(sessionToken)
                }
            );

        }catch(error){

            console.error(error);

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
    }
);


/* FILTRES */

filters.forEach(filter => {

    filter.addEventListener(
        "click",
        () => {

            filters.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );

            filter.classList.add(
                "active"
            );

            currentFilter =
                filter.dataset.filter;

            renderCompetitions();
        }
    );

});


/* CHARGEMENT */

loadCompetitions();


async function loadCompetitions(){

    grid.innerHTML = `
        <div class="loading">
            Chargement des compétitions...
        </div>
    `;

    try{

        /*
         * Même RPC que la page Quiz.
         * Aucun accès direct à competitions
         * n'est nécessaire.
         */

        const {
            data,
            error
        } = await supabaseClient.rpc(
            "get_public_quizzes"
        );


        if(error){
            throw error;
        }


        competitions =
            data || [];


        renderCompetitions();


    }catch(error){

        console.error(
            "Erreur compétitions :",
            error
        );

        grid.innerHTML = `
            <div class="error">

                Impossible de charger
                les compétitions.

                <br><br>

                <small>
                    ${escapeHtml(
                        error.message
                    )}
                </small>

            </div>
        `;
    }
}


/* AFFICHAGE */

function renderCompetitions(){

    let filtered =
        [...competitions];


    if(currentFilter === "free"){

        filtered =
            filtered.filter(
                competition =>
                    Number(
                        competition.participation_fee
                    ) === 0
            );
    }


    if(currentFilter === "paid"){

        filtered =
            filtered.filter(
                competition =>
                    Number(
                        competition.participation_fee
                    ) > 0
            );
    }


    if(!filtered.length){

        grid.innerHTML = `
            <div class="empty">
                Aucune compétition
                disponible dans cette catégorie.
            </div>
        `;

        return;
    }


    grid.innerHTML =
        filtered
            .map(
                competition =>
                    createCompetitionCard(
                        competition
                    )
            )
            .join("");


    document
        .querySelectorAll(
            ".card-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    const competition =
                        competitions.find(
                            item =>
                                item.id === id
                        );

                    if(
                        competition
                    ){

                        openCompetition(
                            competition
                        );
                    }

                }
            );

        });
}


/* CARD */

function createCompetitionCard(
    competition
){

    const fee =
        Number(
            competition.participation_fee
        ) || 0;


    const currency =
        competition.currency ||
        "XOF";


    const status =
        competition.status ||
        "registration";


    let statusText =
        "Inscriptions";


    if(status === "live"){
        statusText = "En direct";
    }

    if(status === "finished"){
        statusText = "Terminée";
    }

    if(status === "cancelled"){
        statusText = "Annulée";
    }


    const feeText =
        fee === 0
            ? "Gratuit"
            : `${formatNumber(fee)} ${currency}`;


    let buttonText =
        "Participer";


    let disabled = false;


    if(status === "finished"){

        buttonText =
            "Compétition terminée";

        disabled = true;
    }


    if(status === "cancelled"){

        buttonText =
            "Compétition annulée";

        disabled = true;
    }


    return `
        <article class="competition-card">

            <div class="card-top">

                <span class="status ${status}">
                    ${statusText}
                </span>

                <span class="fee">
                    ${feeText}
                </span>

            </div>


            <h2>
                ${escapeHtml(
                    competition.title
                )}
            </h2>


            <p class="description">
                ${escapeHtml(
                    competition.description ||
                    "Aucune description disponible."
                )}
            </p>


            <div class="card-info">

                <div class="info-item">
                    Participants
                    <strong>
                        ${competition.max_participants || "—"}
                    </strong>
                </div>

                <div class="info-item">
                    Début
                    <strong>
                        ${formatDate(
                            competition.starts_at
                        )}
                    </strong>
                </div>

            </div>


            <button
                class="card-button ${disabled ? "disabled" : ""}"
                data-id="${competition.id}"
                ${disabled ? "disabled" : ""}>

                ${buttonText}

            </button>

        </article>
    `;
}


/* OUVERTURE */

function openCompetition(
    competition
){

    /*
     * Pour une compétition gratuite,
     * on ouvre directement le quiz.
     */

    const fee =
        Number(
            competition.participation_fee
        ) || 0;


    if(fee === 0){

        window.location.href =
            `quiz-play.html?quiz=${competition.id}`;

        return;
    }


    /*
     * Les compétitions payantes
     * utiliseront ensuite la page
     * de paiement/participation.
     */

    alert(
        `Participation : ${formatNumber(fee)} ${competition.currency || "XOF"}`
    );
}


/* DATE */

function formatDate(date){

    if(!date){
        return "À définir";
    }

    const value =
        new Date(date);

    if(
        Number.isNaN(
            value.getTime()
        )
    ){
        return "À définir";
    }

    return value.toLocaleDateString(
        "fr-FR",
        {
            day:"2-digit",
            month:"2-digit",
            year:"numeric"
        }
    );
}


/* NOMBRE */

function formatNumber(value){

    return Number(
        value
    ).toLocaleString(
        "fr-FR"
    );
}


/* HASH */

async function hashToken(token){

    const encoder =
        new TextEncoder();

    const data =
        encoder.encode(token);

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return Array.from(
        new Uint8Array(hash)
    )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2,"0")
        )
        .join("");
}


/* SECURITE HTML */

function escapeHtml(value){

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
          }
