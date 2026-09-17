const supabaseClient = supabase.createClient(
    "https://ypobyeboanzgyanvdcdq.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb2J5ZWJvYW56Z3lhbnZkY2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjE3NDYsImV4cCI6MjEwNTEzNzc0Nn0.qd09anaLqxJfFVTbsamDghfuKzlTskzxRzN_pqARnK8"
);


// ==========================
// SESSION
// ==========================

const sessionToken =
    localStorage.getItem("afriquiz_session_token");

const userId =
    localStorage.getItem("afriquiz_user_id");

const username =
    localStorage.getItem("afriquiz_username") ||
    "Utilisateur";

if(!sessionToken || !userId){
    window.location.href = "connexion.html";
}


// ==========================
// QUIZ ID
// ==========================

const params =
    new URLSearchParams(window.location.search);

const quizId =
    params.get("quiz");

if(!quizId){
    window.location.href = "quiz.html";
}


// ==========================
// ÉLÉMENTS
// ==========================

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


// ==========================
// VARIABLES
// ==========================

let questions = [];
let currentQuestion = 0;
let score = 0;
let correctAnswers = 0;

let timer = null;
let questionStartTime = 0;
let answered = false;

const TIME_LIMIT = 30;


// ==========================
// INITIALISATION
// ==========================

usernameElement.textContent = username;

loadQuiz();


// ==========================
// CHARGER QUIZ
// ==========================

async function loadQuiz(){

    try{

        const { data: competition, error } =
            await supabaseClient
                .from("competitions")
                .select(`
                    id,
                    title,
                    description,
                    status
                `)
                .eq("id", quizId)
                .single();


        if(error){
            throw error;
        }


        if(!competition){
            throw new Error("Quiz introuvable.");
        }


        quizTitle.textContent =
            competition.title;


        const { data: questionData, error: questionError } =
            await supabaseClient
                .from("questions")
                .select(`
                    id,
                    question_number,
                    question_text,
                    points,
                    time_limit_seconds,
                    question_options (
                        id,
                        option_label,
                        option_text
                    )
                `)
                .eq("competition_id", quizId)
                .order("question_number", {
                    ascending:true
                });


        if(questionError){
            throw questionError;
        }


        questions = questionData || [];


        if(!questions.length){
            throw new Error(
                "Aucune question disponible."
            );
        }


        showQuestion();


    }catch(error){

        console.error(
            "Erreur chargement quiz :",
            error
        );

        quizContent.innerHTML = `
            <div class="error">
                Impossible de charger ce quiz.
            </div>
        `;
    }
}


// ==========================
// AFFICHER QUESTION
// ==========================

function showQuestion(){

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
        ((currentQuestion) / total) * 100;


    progressBar.style.width =
        `${progress}%`;


    const options =
        question.question_options || [];


    quizContent.innerHTML = `
        <div class="question-card">

            <h2>
                ${escapeHtml(question.question_text)}
            </h2>

            <div class="options">

                ${options.map(option => `
                    <button
                        class="option"
                        data-option-id="${option.id}">

                        <strong>
                            ${escapeHtml(option.option_label)}
                        </strong>
                        —
                        ${escapeHtml(option.option_text)}

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
        Number(question.time_limit_seconds) ||
        TIME_LIMIT
    );
}


// ==========================
// CHRONOMÈTRE
// ==========================

function startTimer(seconds){

    let remaining = seconds;

    timerElement.textContent =
        `${remaining}s`;

    questionStartTime =
        performance.now();


    timer = setInterval(() => {

        remaining--;

        timerElement.textContent =
            `${remaining}s`;


        if(remaining <= 0){

            clearInterval(timer);

            submitAnswer(null);

        }

    },1000);
}


// ==========================
// RÉPONSE
// ==========================

async function submitAnswer(optionId){

    if(answered){
        return;
    }

    answered = true;

    clearInterval(timer);


    const responseTime =
        Math.min(
            Math.round(
                performance.now() -
                questionStartTime
            ),
            30000
        );


    const question =
        questions[currentQuestion];


    const selectedButton =
        optionId
        ? document.querySelector(
            `[data-option-id="${optionId}"]`
        )
        : null;


    if(selectedButton){
        selectedButton.classList.add(
            "selected"
        );
    }


    try{

        const { data, error } =
            await supabaseClient.rpc(
                "submit_quiz_answer",
                {
                    p_competition_id: quizId,
                    p_phase_id: null,
                    p_question_id: question.id,
                    p_user_id: userId,
                    p_selected_option_id:
                        optionId,
                    p_response_time_ms:
                        responseTime
                }
            );


        if(error){
            console.error(
                "Erreur réponse :",
                error
            );
        }


        /*
         * Le résultat de la fonction peut
         * retourner les points obtenus.
         */

        if(data){

            const result =
                Array.isArray(data)
                ? data[0]
                : data;


            const earned =
                Number(
                    result?.points_earned || 0
                );


            const isCorrect =
                result?.is_correct === true;


            if(isCorrect){
                correctAnswers++;
            }


            score += earned;

        }


    }catch(error){

        console.error(
            "Erreur enregistrement :",
            error
        );

    }


    scoreElement.textContent =
        `${score} point${score > 1 ? "s" : ""}`;


    setTimeout(() => {

        currentQuestion++;

        if(currentQuestion >= questions.length){
            finishQuiz();
        }else{
            showQuestion();
        }

    },500);
}


// ==========================
// FIN
// ==========================

function finishQuiz(){

    clearInterval(timer);

    progressBar.style.width = "100%";

    questionNumber.textContent =
        `Quiz terminé`;

    timerElement.textContent =
        "✓";


    quizContent.innerHTML = `
        <div class="finished">

            <h2>Quiz terminé</h2>

            <p>
                Tu as terminé toutes les questions.
            </p>

            <div class="final-score">
                ${score} point${score > 1 ? "s" : ""}
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
