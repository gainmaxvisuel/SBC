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

if (!sessionToken || !userId) {
    window.location.href = "connexion.html";
}

const params =
    new URLSearchParams(window.location.search);

const quizId =
    params.get("quiz");

if (!quizId) {
    window.location.href = "quiz.html";
}

const quizTitle =
    document.getElementById("quizTitle");

const usernameElement =
    document.getElementById("username");

const questionNumber =
    document.getElementById("questionNumber");

const scoreElement =
    document.getElementById("score");

const progressBar =
    document.getElementById("progressBar");

const timerElement =
    document.getElementById("timer");

const quizContent =
    document.getElementById("quizContent");

let questions = [];
let currentQuestion = 0;
let score = 0;
let correctAnswers = 0;

let timer = null;
let questionStartTime = 0;
let answered = false;

const TIME_LIMIT = 30;

usernameElement.textContent = username;

loadQuiz();


/* =========================
   HASH SESSION TOKEN
========================= */

async function hashToken(token) {

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
                    .padStart(2, "0")
        )
        .join("");
}


/* =========================
   CHARGER LE QUIZ
========================= */

async function loadQuiz() {

    try {

        const {
            data,
            error
        } = await supabaseClient.rpc(
            "get_quiz_questions",
            {
                p_quiz_id: quizId
            }
        );

        if (error) {
            throw error;
        }

        questions =
            data || [];

        if (!questions.length) {
            throw new Error(
                "Aucune question disponible."
            );
        }


        /* Récupérer le titre */

        const {
            data: quizzesData,
            error: quizError
        } = await supabaseClient.rpc(
            "get_public_quizzes"
        );

        if (
            !quizError &&
            quizzesData
        ) {

            const quiz =
                quizzesData.find(
                    q => q.id === quizId
                );

            if (quiz) {
                quizTitle.textContent =
                    quiz.title;
            }
        }


        showQuestion();

    } catch (error) {

        console.error(
            "Erreur chargement quiz :",
            error
        );

        quizContent.innerHTML = `
            <div class="error">
                Impossible de charger ce quiz.
                <br><br>
                <small>
                    ${escapeHtml(error.message)}
                </small>
            </div>
        `;
    }
}


/* =========================
   AFFICHER QUESTION
========================= */

function showQuestion() {

    clearInterval(timer);

    answered = false;

    const question =
        questions[currentQuestion];

    const total =
        questions.length;

    questionNumber.textContent =
        `Question ${currentQuestion + 1} / ${total}`;

    scoreElement.textContent =
        `${score} point${score > 1 ? "s" : ""}`;

    const progress =
        (currentQuestion / total) * 100;

    progressBar.style.width =
        `${progress}%`;


    const options =
        question.options || [];


    quizContent.innerHTML = `
        <div class="question-card">

            <h2>
                ${escapeHtml(
                    question.question_text
                )}
            </h2>

            <div class="options">

                ${options.map(option => `
                    <button
                        class="option"
                        data-option-id="${option.id}">

                        <strong>
                            ${escapeHtml(
                                option.option_label
                            )}
                        </strong>

                        —

                        ${escapeHtml(
                            option.option_text
                        )}

                    </button>
                `).join("")}

            </div>

        </div>
    `;


    document
        .querySelectorAll(".option")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const optionId =
                        button.dataset.optionId;

                    submitAnswer(
                        optionId
                    );
                }
            );
        });


    startTimer(
        Number(
            question.time_limit_seconds
        ) || TIME_LIMIT
    );
}


/* =========================
   TIMER
========================= */

function startTimer(seconds) {

    let remaining =
        seconds;

    timerElement.textContent =
        `${remaining}s`;

    questionStartTime =
        performance.now();


    timer =
        setInterval(() => {

            remaining--;

            timerElement.textContent =
                `${remaining}s`;


            if (remaining <= 0) {

                clearInterval(timer);

                submitAnswer(null);
            }

        }, 1000);
}


/* =========================
   ENREGISTRER REPONSE
========================= */

async function submitAnswer(optionId) {

    if (answered) {
        return;
    }

    answered = true;

    clearInterval(timer);


    const question =
        questions[currentQuestion];


    const responseTime =
        Math.min(
            Math.round(
                performance.now() -
                questionStartTime
            ),
            30000
        );


    const selectedButton =
        optionId
            ? document.querySelector(
                `[data-option-id="${optionId}"]`
            )
            : null;


    if (selectedButton) {

        selectedButton.classList.add(
            "selected"
        );

        document
            .querySelectorAll(".option")
            .forEach(button => {
                button.disabled = true;
            });
    }


    try {

        /*
         * Le token stocké dans le navigateur
         * est transformé en SHA-256.
         */

        const sessionTokenHash =
            await hashToken(
                sessionToken
            );


        const {
            data,
            error
        } = await supabaseClient.rpc(
            "submit_quiz_answer",
            {
                p_session_token_hash:
                    sessionTokenHash,

                p_question_id:
                    question.id,

                p_option_id:
                    optionId,

                p_started_at:
                    new Date(
                        Date.now() -
                        responseTime
                    ).toISOString()
            }
        );


        if (error) {
            throw error;
        }


        const result =
            Array.isArray(data)
                ? data[0]
                : data;


        const earned =
            Number(
                result?.points_earned ||
                result?.points ||
                0
            );


        const isCorrect =
            result?.is_correct === true ||
            result?.correct === true;


        if (isCorrect) {
            correctAnswers++;
        }


        score += earned;


        scoreElement.textContent =
            `${score} point${score > 1 ? "s" : ""}`;


    } catch (error) {

        console.error(
            "Erreur enregistrement réponse :",
            error
        );

        quizContent.innerHTML = `
            <div class="error">

                Une erreur est survenue
                lors de l'enregistrement
                de ta réponse.

                <br><br>

                <small>
                    ${escapeHtml(
                        error.message
                    )}
                </small>

            </div>
        `;

        return;
    }


    setTimeout(() => {

        currentQuestion++;


        if (
            currentQuestion >=
            questions.length
        ) {

            finishQuiz();

        } else {

            showQuestion();
        }

    }, 500);
}


/* =========================
   FIN DU QUIZ
========================= */

function finishQuiz() {

    clearInterval(timer);

    progressBar.style.width =
        "100%";

    questionNumber.textContent =
        "Quiz terminé";

    timerElement.textContent =
        "✓";


    quizContent.innerHTML = `
        <div class="finished">

            <h2>
                Quiz terminé
            </h2>

            <p>
                Tu as terminé toutes
                les questions.
            </p>

            <div class="final-score">
                ${score}
                point${score > 1 ? "s" : ""}
            </div>

            <p>
                ${correctAnswers}
                bonne${correctAnswers > 1 ? "s" : ""}
                réponse${correctAnswers > 1 ? "s" : ""}
            </p>

            <br>

            <a href="quiz.html">
                Retour aux quiz
            </a>

        </div>
    `;
}


/* =========================
   SECURITE HTML
========================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
