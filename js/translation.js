jQuery(function ($) {
    $.i18n({
        locale: 'en'
    });

    $.i18n().load({
        "en": {
            "welcome": `
  Welcome to the NatureServe Canada Ecosystem-based Automated Range Map (EBAR) Reviewer!  
<br><br>
In using this tool, you will be accessing information based on locations of rare and threatened 
species, including species subject to persecution and harm. You agree to use this information only 
for the purposes of EBAR range maps review. Please contact the EBAR-KBA project at the email
address provided below to suggest additional reviewers.
<br><br>  
Range maps will be published through NatureServe Canada (<a href="http://www.natureserve.ca" target="_blank">http://www.natureserve.ca)</a>, NatureServe Explorer 
and partners at no cost.
<br><br>
This app uses cookies to remember some user interface selections.
<br><br>
Your species reviews will be kept in a database to support the EBAR-KBA project.
` ,
            "pre_lang": "Preferred language:",
            "lang_en": "English",
            "lang_fr": "French",
            "i_agree": "I AGREE",
            "questions": "User questions, additional reviewer suggestions, feedback and technical support:",
            "about": "About the EBAR Reviewer app",
            "source_code": "Source code",
            "app_dev": "App development: Esri Canada",
            "based_on": "Based on:",
            "and": "and",
            "under": "under",
            "comment": "Comment (required):",
            "logged_in_as": "Logged in as",
            "EBAR_Reviewer": "EBAR Reviewer",
            "bn_zoom": "Zoom to Species Range",
            "range_version": "Range Version:",
            "stage": "Stage:",
            "species_info": "Species Information:",
            "metadata": "Metadata:",
            "search_add": "Search/Add Data",
            "search_by_location": "Search by location",
            "ref_layers": "Reference Layers",
            "switch_account": "Switch Account",
            "to_add_your_point_data": "To Add Your Own Point Data:",
            "drag_and_drop_msg": `Drag and drop a csv file from Windows Explorer onto the map. File should be formatted with “latitude” and “longitude” columns.`,
            "overall_feedback": "Overall Feedback",
            "multi_sel_title": "Multiple Ecoshapes selected",
            "warning_markup": "WARNING: existing Markup for the selected Ecoshapes will be replaced on Save.",
            "ecoshapes": "Ecoshape(s):",
            "ter_area": "Terrestrial Area:",
            "ter_proportion": "Terrestrial Proportion",
            "parent_ecoregion": "Parent Ecoregion",
            "ecozone": "Ecozone",
            "presence": "Presence",
            "markup_req": "Markup (required)",
            "rem_reason_req": "Removal Reason (required)",
            "multi_sel": "Multi-Selection",
            "save": "Save",
            "reset": "Reset",
            "all_feedbacks_by": "All feedbacks by",
            "all_feedback_for": "All feedbacks for",
            "no_overall_fb": "No overall feedback for selected species",
            "overall_fb": "Overall Feedback from all users",
            "Reference": "Reference",
            "removalreason": "Removal Reason",
            "Migrant Status": "Migrant Status",
            "overall_fb": "Please provide overall range feedback",
            "overall_comment": "Overall comment",
            "submit": "Submit",
            "close": "Close",
            "submit_warning":"After submit, additional markup and feedback for this range map will not be allowed. Do you want to continue?",
            "review_sub": "REVIEW SUBMITTED, additional markup and feedback for this range map are not allowed."
        },
        "fr": {
            "welcome": `
Bienvenue à l'examinateur de cartes de portée automatisée (EBAR) basé sur l'écosystème de NatureServe Canada!
<br> <br>
En utilisant cet outil, vous accéderez à des informations basées sur des emplacements de
espèces, y compris les espèces sujettes à la persécution et aux dommages. Vous acceptez d'utiliser ces informations uniquement
aux fins de l'examen des cartes de répartition EBAR. Veuillez contacter le projet EBAR-KBA par e-mail
adresse indiquée ci-dessous pour suggérer des réviseurs supplémentaires.
<br> <br>
Les cartes des aires de répartition seront publiées par NatureServe Canada (<a href="http://www.natureserve.ca" target="_blank"> http://www.natureserve.ca) </a>, NatureServe Explorer
et partenaires sans frais.
<br> <br>
Cette application utilise des cookies pour mémoriser certaines sélections de l'interface utilisateur.
<br> <br>
Vos évaluations d'espèces seront conservées dans une base de données pour soutenir le projet EBAR-KBA.
   `,
            "pre_lang": "Langue préférée:",
            "lang_en": "Anglais",
            "lang_fr": "Français",
            "i_agree": "JE SUIS D'ACCORD",
            "questions": "Questions des utilisateurs, suggestions de réviseurs supplémentaires, commentaires et assistance technique:",
            "about": "À propos de l'application EBAR Reviewer",
            "source_code": "Code source",
            "app_dev": "Développement d'applications: Esri Canada",
            "based_on": "Basé sur:",
            "and": "et",
            "under": "sous",
            "comment": "Commentaire (obligatoire):",
            "logged_in_as": "Connecté en tant que",
            "EBAR_Reviewer": "EBAR Critique",
            "bn_zoom": "Zoom sur l'aire de répartition des espèces",
            "range_version": "Version de la gamme:",
            "stage": "Étape:",
            "species_info": "Informations sur l'espèce:",
            "metadata": "Métadonnées:",
            "search_add": "Rechercher/Ajouter des données",
            "search_by_location": "Recherche par lieu",
            "ref_layers": "Couches de référence",
            "switch_account": "Changer de compte",
            "to_add_your_point_data": "Pour ajouter vos propres données de point:",
            "drag_and_drop_msg": `Faites glisser et déposez un fichier csv depuis l'Explorateur Windows sur la carte. Le fichier doit être formaté avec «latitude» et «longitude» Colonnes.`,
            "overall_feedback": "Rétroaction globale",
            "multi_sel_title": "Plusieurs éco-formes sélectionnées",
            "warning_markup": "AVERTISSEMENT: le balisage existant pour les formes écologiques sélectionnées sera remplacé lors de l'enregistrement.",
            "ecoshapes": "Ecoshape(s):",
            "ter_area": "Zone terrestre:",
            "ter_proportion": "Proportion terrestre",
            "parent_ecoregion": "Écorégion parent",
            "ecozone": "Écozone",
            "presence": "Présence",
            "metadata": "Métadonnées",
            "markup_req": "Balisage (obligatoire)",
            "rem_reason_req": "Motif de suppression (obligatoire)",
            "multi_sel": "Multi-sélection",
            "save": "Save",
            "reset": "Réinitialiser",
            "all_feedbacks_by": "Tous les retours de",
            "all_feedback_for": "Tous les retours pour",
            "no_overall_fb": "Aucune rétroaction globale pour les espèces sélectionnées",
            "overall_fb": "Rétroaction globale de tous les utilisateurs",
            "Reference": "Référence",
            "removalreason": "Motif de suppression",
            "Migrant Status": "Statut de migrant",
            "overall_fb": "Veuillez fournir des commentaires sur la gamme globale",
            "overall_comment": "Commentaire général",
            "submit": "Submit",
            "close": "Close",
            "submit_warning":"Après l'envoi, le balisage et les commentaires supplémentaires pour cette carte de portée ne seront pas autorisés. Voulez-vous continuer?",
            "review_sub": "REVIEW SUBMITTED, additional markup and feedback for this range map are not allowed."
        }

    }).done(function () {
        translation();
    });
});


function translation(event) {
    if (event && event.target && event.target.value) {
        $.i18n({
            locale: event.target.value
        });
    }
    $("[data-i18n=welcome]")[0].innerHTML = $.i18n('welcome');
    //$("[data-i18n=pre_lang]")[0].innerHTML = $.i18n('pre_lang');
    $("[data-i18n=lang_en]")[0].innerHTML = $.i18n('lang_en');
    $("[data-i18n=lang_fr]")[0].innerHTML = $.i18n('lang_fr');
    $("[data-i18n=i_agree]")[0].innerHTML = $.i18n('i_agree');
    $("[data-i18n=questions]")[0].innerHTML = $.i18n('questions');
    $("[data-i18n=about]")[0].innerHTML = $.i18n('about');
    $("[data-i18n=source_code]")[0].innerHTML = $.i18n('source_code');
    $("[data-i18n=app_dev]")[0].innerHTML = $.i18n('app_dev');

    $("[data-i18n=based_on]")[0].innerHTML = $.i18n('based_on');
    $("[data-i18n=and]")[0].innerHTML = $.i18n('and');
    $("[data-i18n=under]").each((i, e) => {
        e.innerHTML = $.i18n('under');
    });
    $("[data-i18n=EBAR_Reviewer]").each((i, e) => {
        e.innerHTML = $.i18n('EBAR_Reviewer');
    });
    $("[data-i18n=bn_zoom]").text($.i18n('bn_zoom'));
    $("[data-i18n=range_version]").text($.i18n('range_version'));
    $("[data-i18n=stage]").text($.i18n('stage'));
    $("[data-i18n=species_info]").text($.i18n('species_info'));
    $("[data-i18n=metadata]").text($.i18n('metadata'));
    $("[data-i18n=search_add]").text($.i18n('search_add'));
    $("[data-i18n=search_by_location]").text($.i18n('search_by_location'));
    $("[data-i18n=ref_layers]").text($.i18n('ref_layers'));
    $("[data-i18n=switch_account").text($.i18n('switch_account'));
    $("[data-i18n=to_add_your_point_data").text($.i18n('to_add_your_point_data'));
    $("[data-i18n=drag_and_drop_msg").text($.i18n('drag_and_drop_msg'));
    $("[data-i18n=overall_feedback").text($.i18n('overall_feedback'));
    $("[data-i18n=multi_sel_title").text($.i18n('multi_sel_title'));
    $("[data-i18n=review_sub").text($.i18n('review_sub'));    

}