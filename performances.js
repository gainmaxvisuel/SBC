const SUPABASE_URL = "https://ypobyeboanzgyanvdcdq.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb2J5ZWJvYW56Z3lhbnZkY2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjE3NDYsImV4cCI6MjEwNTEzNzc0Nn0.qd09anaLqxjFfVTbsamDghfuKzlTskzxRzN_pqARnK8";

const supabaseClient = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

const sessionToken = localStorage.getItem("afriquiz_session_token");

const usernameElement = document.getElementById("username");

function sha256(text) {
return crypto.subtle.digest(
"SHA-256",
new TextEncoder().encode(text)
).then(buffer =>
Array.from(new Uint8Array(buffer))
.map(b => b.toString(16).padStart(2, "0"))
.join("")
);
}

async function checkSession() {
if (!sessionToken) {
window.location.href = "connexion.html";
return false;
}

const tokenHash = await sha256(sessionToken);

const { data, error } = await supabaseClient.rpc(
    "validate_app_session",
    {
        p_session_token_hash: tokenHash
    }
);

if (error || !data || !data.length) {
    localStorage.clear();
    window.location.href = "connexion.html";
    return false;
}

usernameElement.textContent = data[0].username || "Utilisateur";

return true;

}

function formatTime(ms) {
if (!ms || ms <= 0) return "—";

const seconds = ms / 1000;

if (seconds < 60) {
    return `${seconds.toFixed(1)} s`;
}

const minutes = Math.floor(seconds / 60);
const remaining = Math.round(seconds % 60);

return `${minutes} min ${remaining} s`;

}

function formatTotalTime(ms) {
if (!ms || ms <= 0) return "0 s";

const seconds = Math.round(ms / 1000);

const hours = Math.floor(seconds / 3600);
const minutes = Math.floor((seconds % 3600) / 60);
const remaining = seconds % 60;

if (hours > 0) {
    return `${hours} h ${minutes} min`;
}

if (minutes > 0) {
    return `${minutes} min ${remaining} s`;
}

return `${remaining} s`;

}

function formatDate(date) {
if (!date) return "Date inconnue";

return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
}).format(new Date(date));

}

async function loadStatistics() {

const tokenHash = await sha256(sessionToken);

const { data, error } = await supabaseClient.rpc(
    "get_user_statistics",
    {
        p_session_token_hash: tokenHash
    }
);

if (error) {
    console.error(error);
    document.getElementById("recentList").innerHTML =
        `<div class="empty">Impossible de charger les statistiques.</div>`;
    return;
}

const stats = data || {};

document.getElementById("totalQuizzes").textContent =
    stats.total_quizzes ?? 0;

document.getElementById("totalAnswers").textContent =
    stats.total_answers ?? 0;

document.getElementById("correctAnswers").textContent =
    stats.correct_answers ?? 0;

document.getElementById("accuracy").textContent =
    `${stats.accuracy_percent ?? 0}%`;

document.getElementById("totalPoints").textContent =
    stats.total_points ?? 0;

document.getElementById("bestScore").textContent =
    stats.best_score ?? 0;

document.getElementById("bestStreak").textContent =
    stats.best_streak ?? 0;

document.getElementById("fastestAnswer").textContent =
    formatTime(stats.fastest_answer_ms);

document.getElementById("totalTime").textContent =
    formatTotalTime(stats.total_time_ms);

renderRecent(stats.recent || []);

}

function renderRecent(items) {

const container = document.getElementById("recentList");

if (!items.length) {
    container.innerHTML =
        `<div class="empty">Aucune participation enregistrée.</div>`;
    return;
}

container.innerHTML = items.map(item => {

    const rank = item.final_rank
        ? `Classement : #${item.final_rank}`
        : "Classement en attente";

    return `
        <div class="recent-item">

            <div>
                <div class="recent-title">
                    ${escapeHtml(item.title || "Quiz")}
                </div>

                <div class="recent-meta">
                    ${formatDate(item.registered_at)} ·
                    ${item.correct_answers || 0} bonne(s) réponse(s) ·
                    ${rank}
                </div>
            </div>

            <div class="recent-score">
                <strong>${item.total_points || 0} pts</strong>
                <span>${formatTotalTime(item.total_answer_time_ms)}</span>
            </div>

        </div>
    `;
}).join("");

}

function escapeHtml(value) {
return String(value)
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");
}

document.getElementById("openMenu").addEventListener("click", () => {
document.getElementById("sidebar").classList.add("open");
document.getElementById("overlay").classList.add("show");
});

document.getElementById("closeMenu").addEventListener("click", closeSidebar);
document.getElementById("overlay").addEventListener("click", closeSidebar);

function closeSidebar() {
document.getElementById("sidebar").classList.remove("open");
document.getElementById("overlay").classList.remove("show");
}

document.getElementById("logoutBtn").addEventListener("click", async () => {

if (sessionToken) {
    try {
        const tokenHash = await sha256(sessionToken);

        await supabaseClient.rpc(
            "revoke_app_session",
            {
                p_session_token_hash: tokenHash
            }
        );
    } catch (error) {
        console.error(error);
    }
}

localStorage.clear();
window.location.href = "connexion.html";

});

(async function init() {

const valid = await checkSession();

if (!valid) return;

await loadStatistics();

})();
