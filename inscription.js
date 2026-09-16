/* =====================================================
   CONFIGURATION SUPABASE
===================================================== */

const SUPABASE_URL =
    "https://ypobyeboanzgyanvdcdq.supabase.co";

const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb2J5ZWJvYW56Z3lhbnZkY2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjE3NDYsImV4cCI6MjEwNTEzNzc0Nn0.qd09anaLqxjFfVTbsamDghfuKzlTskzxRzN_pqARnK8";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   ÉLÉMENTS
===================================================== */

const form =
    document.getElementById("registerForm");

const usernameInput =
    document.getElementById("username");

const emailInput =
    document.getElementById("email");

const countryInput =
    document.getElementById("country");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const termsInput =
    document.getElementById("terms");

const formMessage =
    document.getElementById("formMessage");

const submitBtn =
    document.getElementById("submitBtn");

const submitText =
    document.getElementById("submitText");


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    text,
    type = "error"
) {

    formMessage.textContent =
        text;

    formMessage.className =
        "form-message " + type;

}


/* =====================================================
   CHARGEMENT
===================================================== */

function setLoading(
    loading
) {

    submitBtn.disabled =
        loading;

    if (loading) {

        submitText.textContent =
            "Création du compte...";

        submitBtn.style.opacity =
            "0.7";

    } else {

        submitText.textContent =
            "Créer mon compte";

        submitBtn.style.opacity =
            "1";

    }

}


/* =====================================================
   AFFICHER / CACHER MOT DE PASSE
===================================================== */

document
    .getElementById("showPassword")
    .addEventListener(
        "click",
        function () {

            if (
                passwordInput.type ===
                "password"
            ) {

                passwordInput.type =
                    "text";

                this.textContent =
                    "🙈";

            } else {

                passwordInput.type =
                    "password";

                this.textContent =
                    "👁";

            }

        }
    );


document
    .getElementById("showConfirmPassword")
    .addEventListener(
        "click",
        function () {

            if (
                confirmPasswordInput.type ===
                "password"
            ) {

                confirmPasswordInput.type =
                    "text";

                this.textContent =
                    "🙈";

            } else {

                confirmPasswordInput.type =
                    "password";

                this.textContent =
                    "👁";

            }

        }
    );


/* =====================================================
   FORCE DU MOT DE PASSE
===================================================== */

passwordInput.addEventListener(
    "input",
    function () {

        const value =
            this.value;

        const bars =
            document.querySelectorAll(
                "#passwordStrength span"
            );

        let strength = 0;

        if (value.length >= 8)
            strength++;

        if (/[A-Z]/.test(value))
            strength++;

        if (/[0-9]/.test(value))
            strength++;

        if (/[^A-Za-z0-9]/.test(value))
            strength++;


        bars.forEach(
            function (
                bar,
                index
            ) {

                if (
                    index < strength
                ) {

                    bar.classList.add(
                        "active"
                    );

                } else {

                    bar.classList.remove(
                        "active"
                    );

                }

            }
        );

    }
);


/* =====================================================
   FORMULAIRE
===================================================== */

form.addEventListener(
    "submit",
    async function (event) {

        /* BLOQUE LE RECHARGEMENT */

        event.preventDefault();

        event.stopPropagation();


        console.log(
            "FORMULAIRE ENVOYÉ"
        );


        /* Nettoyage */

        formMessage.textContent =
            "";

        formMessage.className =
            "form-message";


        /* Valeurs */

        const username =
            usernameInput.value.trim();

        const email =
            emailInput.value
                .trim()
                .toLowerCase();

        const country =
            countryInput.value
                .trim()
                .toUpperCase();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        /* =================================================
           VALIDATION PSEUDO
        ================================================= */

        if (
            username.length < 3 ||
            username.length > 30
        ) {

            showMessage(
                "Le pseudo doit contenir entre 3 et 30 caractères."
            );

            return;

        }


        /* =================================================
           VALIDATION EMAIL
        ================================================= */

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailRegex.test(email)
        ) {

            showMessage(
                "Veuillez entrer une adresse email valide."
            );

            return;

        }


        /* =================================================
           VALIDATION PAYS
        ================================================= */

        const allowedCountries = [
            "BF",
            "CI",
            "TG",
            "BJ",
            "ML",
            "SN"
        ];

        if (
            !allowedCountries.includes(
                country
            )
        ) {

            showMessage(
                "Veuillez sélectionner un pays éligible."
            );

            return;

        }


        /* =================================================
           MOT DE PASSE
        ================================================= */

        if (
            password.length < 8
        ) {

            showMessage(
                "Le mot de passe doit contenir au moins 8 caractères."
            );

            return;

        }


        /* =================================================
           CONFIRMATION
        ================================================= */

        if (
            password !==
            confirmPassword
        ) {

            showMessage(
                "Les deux mots de passe ne correspondent pas."
            );

            return;

        }


        /* =================================================
           CONDITIONS
        ================================================= */

        if (
            !termsInput.checked
        ) {

            showMessage(
                "Vous devez accepter les conditions d'utilisation."
            );

            return;

        }


        /* =================================================
           CHARGEMENT
        ================================================= */

        setLoading(true);


        try {

            console.log(
                "Envoi de l'inscription à Supabase..."
            );


            /* =================================================
               RPC
            ================================================= */

            const {
                data,
                error
            } = await supabaseClient.rpc(
                "register_app_user",
                {
                    p_username:
                        username,

                    p_email:
                        email,

                    p_country_code:
                        country,

                    p_password:
                        password
                }
            );


            console.log(
                "DATA :",
                data
            );

            console.log(
                "ERROR :",
                error
            );


            /* =================================================
               ERREUR
            ================================================= */

            if (error) {

                console.error(
                    "Erreur Supabase :",
                    error
                );


                const msg =
                    error.message ||
                    "Impossible de créer le compte.";


                const lower =
                    msg.toLowerCase();


                if (
                    lower.includes("pseudo")
                ) {

                    showMessage(
                        "Ce pseudo est déjà utilisé."
                    );

                }

                else if (
                    lower.includes("email")
                ) {

                    showMessage(
                        "Cette adresse email est déjà utilisée."
                    );

                }

                else if (
                    lower.includes("pays")
                ) {

                    showMessage(
                        "Ce pays n'est pas éligible."
                    );

                }

                else if (
                    lower.includes("mot de passe")
                ) {

                    showMessage(
                        "Le mot de passe n'est pas valide."
                    );

                }

                else {

                    showMessage(
                        msg
                    );

                }


                setLoading(false);

                return;

            }


            /* =================================================
               DATA
            ================================================= */

            if (!data) {

                showMessage(
                    "Le serveur n'a retourné aucune donnée."
                );

                setLoading(false);

                return;

            }


            console.log(
                "COMPTE CRÉÉ :",
                data
            );


            /* =================================================
               ID PROFESSIONNEL
            ================================================= */

            const professionalId =
                data.professional_id ||
                "";


            /* =================================================
               SUCCÈS
            ================================================= */

            showMessage(
                professionalId
                    ? "Compte créé avec succès ! Votre ID : " +
                      professionalId
                    : "Compte créé avec succès !",
                "success"
            );


            /* =================================================
               REDIRECTION CONNEXION
            ================================================= */

            setTimeout(
                function () {

                    const params =
                        new URLSearchParams();


                    params.set(
                        "registered",
                        "1"
                    );


                    params.set(
                        "username",
                        username
                    );


                    if (
                        professionalId
                    ) {

                        params.set(
                            "professional_id",
                            professionalId
                        );

                    }


                    window.location.href =
                        "connexion.html?" +
                        params.toString();

                },
                1800
            );


        } catch (error) {

            console.error(
                "Erreur inattendue :",
                error
            );


            showMessage(
                error.message ||
                "Une erreur inattendue est survenue."
            );


            setLoading(false);

        }

    }
);
