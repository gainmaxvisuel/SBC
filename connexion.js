/* ==========================================
   CONFIGURATION SUPABASE
========================================== */

const supabaseClient = supabase.createClient(
    "https://ypobyeboanzgyanvdcdq.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb2J5ZWJvYW56Z3lhbnZkY2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjE3NDYsImV4cCI6MjEwNTEzNzc0Nn0.qd09anaLqxjFfVTbsamDghfuKzlTskzxRzN_pqARnK8"
);


/* ==========================================
   ELEMENTS
========================================== */

const loginForm =
    document.getElementById("loginForm");

const identifier =
    document.getElementById("identifier");

const password =
    document.getElementById("password");

const showPassword =
    document.getElementById("showPassword");

const formMessage =
    document.getElementById("formMessage");

const submitBtn =
    document.getElementById("submitBtn");

const buttonText =
    document.getElementById("buttonText");


/* ==========================================
   AFFICHER UN MESSAGE
========================================== */

function showMessage(message, type){

    formMessage.textContent = message;

    formMessage.className =
        "form-message " + type;
}


/* ==========================================
   CHARGEMENT
========================================== */

function setLoading(loading){

    submitBtn.disabled = loading;

    if(loading){

        buttonText.textContent =
            "Connexion...";

    }else{

        buttonText.textContent =
            "Se connecter";
    }
}


/* ==========================================
   AFFICHER / CACHER LE MOT DE PASSE
========================================== */

showPassword.addEventListener(
    "click",
    function(){

        if(password.type === "password"){

            password.type = "text";

            showPassword.textContent = "🙈";

        }else{

            password.type = "password";

            showPassword.textContent = "👁";
        }
    }
);


/* ==========================================
   CONNEXION
========================================== */

loginForm.addEventListener(
    "submit",
    async function(event){

        event.preventDefault();
        event.stopPropagation();


        formMessage.className =
            "form-message";


        const userIdentifier =
            identifier.value.trim();

        const userPassword =
            password.value;


        /* ==============================
           VALIDATION
        =============================== */

        if(!userIdentifier){

            showMessage(
                "Entre ton pseudo ou ton email.",
                "error"
            );

            identifier.focus();

            return;
        }


        if(!userPassword){

            showMessage(
                "Entre ton mot de passe.",
                "error"
            );

            password.focus();

            return;
        }


        if(userPassword.length < 8){

            showMessage(
                "Le mot de passe doit contenir au moins 8 caractères.",
                "error"
            );

            password.focus();

            return;
        }


        setLoading(true);


        try{

            /* ==============================
               APPEL SUPABASE
            =============================== */

            const {
                data,
                error
            } = await supabaseClient.rpc(
                "login_app_user",
                {
                    p_identifier:
                        userIdentifier,

                    p_password:
                        userPassword
                }
            );


            /* ==============================
               ERREUR SUPABASE
            =============================== */

            if(error){

                console.error(
                    "Erreur de connexion :",
                    error
                );

                showMessage(
                    error.message ||
                    "Identifiants incorrects.",
                    "error"
                );

                setLoading(false);

                return;
            }


            /* ==============================
               AUCUNE DONNÉE
            =============================== */

            if(!data){

                showMessage(
                    "Identifiants incorrects.",
                    "error"
                );

                setLoading(false);

                return;
            }


            /* ==============================
               RÉCUPÉRER LE TOKEN
            =============================== */

            const sessionToken =
                data.session_token ||
                data.token;


            if(!sessionToken){

                console.error(
                    "Session introuvable :",
                    data
                );

                showMessage(
                    "Impossible de créer la session.",
                    "error"
                );

                setLoading(false);

                return;
            }


            /* ==============================
               ENREGISTRER LA SESSION
            =============================== */

            localStorage.setItem(
                "afriquiz_session_token",
                sessionToken
            );


            if(data.user_id){

                localStorage.setItem(
                    "afriquiz_user_id",
                    data.user_id
                );
            }


            if(data.professional_id){

                localStorage.setItem(
                    "afriquiz_professional_id",
                    data.professional_id
                );
            }


            if(data.username){

                localStorage.setItem(
                    "afriquiz_username",
                    data.username
                );
            }


            if(data.country_code){

                localStorage.setItem(
                    "afriquiz_country",
                    data.country_code
                );
            }


            /* ==============================
               CONNEXION RÉUSSIE
            =============================== */

            showMessage(
                "Connexion réussie. Redirection...",
                "success"
            );


            setTimeout(
                function(){

                    window.location.href =
                        "dashboard.html";

                },
                800
            );


        }catch(error){

            console.error(
                "Erreur inattendue :",
                error
            );

            showMessage(
                "Une erreur est survenue. Vérifie ta connexion Internet puis réessaie.",
                "error"
            );

            setLoading(false);
        }

    }
);


/* ==========================================
   RETOUR APRÈS INSCRIPTION
========================================== */

const params =
    new URLSearchParams(
        window.location.search
    );


if(params.get("registered") === "1"){

    const registeredUsername =
        params.get("username");


    if(registeredUsername){

        identifier.value =
            registeredUsername;
    }


    showMessage(
        "Compte créé avec succès. Tu peux maintenant te connecter.",
        "success"
    );


    window.history.replaceState(
        {},
        document.title,
        "connexion.html"
    );
}
