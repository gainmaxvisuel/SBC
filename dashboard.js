const supabaseClient = supabase.createClient(
    "https://ypobyeboanzgyanvdcdq.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb2J5ZWJvYW56Z3lhbnZkY2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjE3NDYsImV4cCI6MjEwNTEzNzc0Nn0.qd09anaLqxJfFVTbsamDghfuKzlTskzxRzN_pqARnK8"
);


// ==========================
// ÉLÉMENTS
// ==========================

const sidebar = document.getElementById("sidebar");
const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");
const logoutBtn = document.getElementById("logoutBtn");


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

document.addEventListener("DOMContentLoaded", loadDashboard);


async function loadDashboard() {

    const token = localStorage.getItem("afriquiz_session_token");

    // Pas de session
    if (!token) {
        window.location.href = "connexion.html";
        return;
    }

    try {

        const tokenHash = await sha256(token);

        const { data, error } = await supabaseClient.rpc(
            "validate_app_session",
            {
                p_session_token_hash: tokenHash
            }
        );

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            clearSession();
            window.location.href = "connexion.html";
            return;
        }

        const user = data[0];

        displayUser(user);

    } catch (error) {

        console.error("Erreur dashboard :", error);

        // On utilise les informations déjà récupérées
        // par la page connexion si elles existent.
        const username =
            localStorage.getItem("afriquiz_username");

        const professionalId =
            localStorage.getItem("afriquiz_professional_id");

        if (username) {
            displayLocalUser(username, professionalId);
        } else {
            clearSession();
            window.location.href = "connexion.html";
        }
    }
}


// ==========================
// AFFICHER UTILISATEUR
// ==========================

function displayUser(user) {

    const username = user.username || "Utilisateur";
    const professionalId = user.professional_id || "—";

    document.getElementById("username").textContent = username;

    document.getElementById("topUsername").textContent = username;

    document.getElementById("professionalId").textContent =
        "ID : " + professionalId;

    document.getElementById("sidebarUsername").textContent =
        username;

    document.getElementById("sidebarProfessionalId").textContent =
        professionalId;

    localStorage.setItem(
        "afriquiz_username",
        username
    );

    localStorage.setItem(
        "afriquiz_professional_id",
        professionalId
    );

    document.title = `Afriquiz — ${username}`;

    loadUserStatistics(user.user_id);
}


// ==========================
// MODE LOCAL
// ==========================

function displayLocalUser(username, professionalId) {

    document.getElementById("username").textContent = username;

    document.getElementById("topUsername").textContent = username;

    document.getElementById("professionalId").textContent =
        "ID : " + (professionalId || "—");

    document.getElementById("sidebarUsername").textContent =
        username;

    document.getElementById("sidebarProfessionalId").textContent =
        professionalId || "—";

    document.title = `Afriquiz — ${username}`;
}


// ==========================
// STATISTIQUES
// ==========================

async function loadUserStatistics(userId) {

    try {

        const { data, error } = await supabaseClient
            .from("competition_participants")
            .select(`
                id,
                competition_id,
                status,
                total_points,
                correct_answers,
                total_answer_time_ms,
                final_rank,
                current_phase_id
            `)
            .eq("user_id", userId);

        if (error) {
            throw error;
        }

        const participations = data || [];

        const totalCompetitions = participations.length;

        const totalScore = participations.reduce(
            (total, item) =>
                total + Number(item.total_points || 0),
            0
        );

        const totalCorrect = participations.reduce(
            (total, item) =>
                total + Number(item.correct_answers || 0),
            0
        );


        document.getElementById("totalCompetitions").textContent =
            totalCompetitions;

        document.getElementById("totalScore").textContent =
            totalScore;

        document.getElementById("totalCorrect").textContent =
            totalCorrect;

        document.getElementById("performanceCorrect").textContent =
            totalCorrect;


        // Pour l'instant, les quiz généraux seront
        // branchés lorsque leur système sera créé.
        document.getElementById("totalQuizzes").textContent =
            totalCompetitions;

        document.getElementById("performanceQuizzes").textContent =
            totalCompetitions;


        // Temps total
        const totalTime = participations.reduce(
            (total, item) =>
                total + Number(item.total_answer_time_ms || 0),
            0
        );

        document.getElementById("performanceTime").textContent =
            formatTime(totalTime);


        // Taux de réussite
        let rate = 0;

        if (totalCompetitions > 0) {

            const totalPossible =
                participations.reduce(
                    (total, item) =>
                        total + Number(item.correct_answers || 0),
                    0
                );

            if (totalPossible > 0) {
                rate = Math.round(
                    (totalCorrect / totalPossible) * 100
                );
            }
        }

        document.getElementById("performanceRate").textContent =
            rate + "%";


        // Compétition active
        const active = participations.find(
            item =>
                item.status === "active" ||
                item.status === "qualified"
        );

        if (active) {
            document.getElementById(
                "activeCompetition"
            ).textContent =
                "Une compétition est actuellement active.";
        }


        loadRecords(userId);

    } catch (error) {

        console.error(
            "Erreur statistiques :",
            error
        );
    }
}


// ==========================
// RECORDS
// ==========================

async function loadRecords(userId) {

    try {

        const { data, error } = await supabaseClient
            .from("records")
            .select(`
                record_type,
                value_numeric
            `)
            .eq("user_id", userId);

        if (error) {
            throw error;
        }

        const records = data || [];

        records.forEach(record => {

            const value = record.value_numeric;

            switch (record.record_type) {

                case "fastest_correct_answer":
                    document.getElementById(
                        "recordFastest"
                    ).textContent =
                        formatTime(value);
                    break;

                case "most_correct_answers":
                    document.getElementById(
                        "recordCorrect"
                    ).textContent =
                        value;
                    break;

                case "highest_score":
                    document.getElementById(
                        "recordScore"
                    ).textContent =
                        value;
                    break;

                case "best_streak":
                    document.getElementById(
                        "recordStreak"
                    ).textContent =
                        value;
                    break;
            }

        });

    } catch (error) {

        console.error(
            "Erreur records :",
            error
        );
    }
}


// ==========================
// DÉCONNEXION
// ==========================

logoutBtn.addEventListener(
    "click",
    async () => {

        const token =
            localStorage.getItem(
                "afriquiz_session_token"
            );

        if (token) {

            try {

                const tokenHash =
                    await sha256(token);

                await supabaseClient.rpc(
                    "revoke_app_session",
                    {
                        p_session_token_hash:
                            tokenHash
                    }
                );

            } catch (error) {

                console.error(
                    "Erreur déconnexion :",
                    error
                );
            }
        }

        clearSession();

        window.location.href =
            "connexion.html";
    }
);


// ==========================
// NETTOYER SESSION
// ==========================

function clearSession() {

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
}


// ==========================
// SHA-256
// ==========================

async function sha256(text) {

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
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}


// ==========================
// FORMAT TEMPS
// ==========================

function formatTime(milliseconds) {

    const ms = Number(milliseconds || 0);

    if (!ms) {
        return "0s";
    }

    const seconds = Math.round(ms / 1000);

    if (seconds < 60) {
        return seconds + "s";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
        }
