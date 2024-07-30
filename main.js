let currentStep = 0;
let anti_hipertensivos_med_cardiologicos = {};
let cirurgias_procedimentos = {};
let condicoes_saude_sintomas = {};
let hormonios_antimetabolicos = {};
let med_psiquiatricos = {};
let med_teratogenicos = {};
let medicamentos = {};
let vacinas = {};
let outros = {};


let locks = {};
let resolveLoad;
locks['onload'] = new Promise((resolve, _) => {
    resolveLoad = resolve;
});

let group_options = {}

let orientations = {};

(async () => {
    [
        anti_hipertensivos_med_cardiologicos,
        cirurgias_procedimentos,
        condicoes_saude_sintomas,
        hormonios_antimetabolicos,
        med_psiquiatricos,
        med_teratogenicos,
        medicamentos,
        outros,
        vacinas
    ] = await Promise.all([
        fetch("assets/json/anti-hipertensivos_e_outros_medicamentos_cardiologicos.json").then((resp) => resp.json()),
        fetch("assets/json/cirurgias_e_procedimentos.json").then((resp) => resp.json()),
        fetch("assets/json/condicoes_de_saude_e_sintomas_condicoes_de_inaptidao.json").then((resp) => resp.json()),
        fetch("assets/json/hormonios_antimetabolicos.json").then((resp) => resp.json()),
        fetch("assets/json/medicamentos_psiquiatricos.json").then((resp) => resp.json()),
        fetch("assets/json/medicamentos_teratogenicos.json").then((resp) => resp.json()),
        fetch("assets/json/medicamentos.json").then((resp) => resp.json()),
        fetch("assets/json/outros.json").then((resp) => resp.json()),
        fetch("assets/json/vacinas.json").then((resp) => resp.json())
    ]);

    group_options = {
        "medicamento_cardiaco": anti_hipertensivos_med_cardiologicos,
        "procedimento_cirurgico": cirurgias_procedimentos,
        "condicoes_saude_sintomas": condicoes_saude_sintomas,
        "hormonio_antimetabolico": hormonios_antimetabolicos,
        "medicamento_psiquiatrico": med_psiquiatricos,
        "medicamento_teratogenico": med_teratogenicos,
        "medicamentos": medicamentos,
        "vacina": vacinas,
        "outros": outros,
    }
})();

window.addEventListener("DOMContentLoaded", () => {
    resolveLoad();
    handleStepButtons();

    window.onpopstate = (event) => {
        if (event.state && event.state.step !== undefined) {
            goToStep(event.state.step, false);

            if (event.state.step === 3 || event.state.step === 4) {
                getPreScreeningOrientations();
                getScreeningOrientations();
            }

            if (event.state.step === 5) {
                buildOrientations();
            }
        }
    };

    history.replaceState({ step: currentStep }, `Step ${currentStep}`, `#step_${currentStep}`);
});

function handleStepButtons() {
    document.querySelectorAll(".btn-next-step").forEach((btn) => {
        btn.addEventListener("click", () => {
            changeCurrentStep(1);
        });
    });

    document.querySelectorAll(".btn-back-step").forEach((btn) => {
        btn.addEventListener("click", () => {
            changeCurrentStep(-1);
        });
    });
}

function buildScreeningStep() {
    getPreScreeningOrientations();

    document.getElementById("screeningForm").innerHTML = "";

    buildNewQuestionByGroup("condicoes_saude_sintomas");
    buildNewQuestionByGroup("medicamentos");

    document.getElementById("preScreeningForm").querySelectorAll("input:checked").forEach((input) => {
        const [group, selectedOption] = [input.id.split("-")[0], input.id.split("-")[1]];
        if (selectedOption === "yes" && !document.getElementById(`select_${group}`)) {
            buildNewQuestionByGroup(group);
        }
    });

    buildAllSelect2();
}

function getPreScreeningOrientations() {
    orientations = {};
    document.getElementById("othersForm").querySelectorAll("input:checked").forEach((input) => {
        const [group, selectedOption] = [input.id.split("-")[0], input.id.split("-")[1]];
        const allOptions = group_options["outros"][group]["options"];
        if (allOptions[selectedOption]) {
            if (!orientations[group]) orientations[group] = {};
            if (!orientations[group]["orientations"]) orientations[group]["orientations"] = {};

            orientations[group]["label"] = group_options["outros"][group]["question"];
            orientations[group]["orientations"][selectedOption] = {
                "label": allOptions[selectedOption]["label"],
                "orientation": allOptions[selectedOption]["orientation"],
            };
        }
    });
}

function insertNewOrientation(group, selectedOption) {
    const allOptions = group_options[group]["options"];
    if (allOptions[selectedOption]) {
        if (!orientations[group]) orientations[group] = {};
        if (!orientations[group]["orientations"]) orientations[group]["orientations"] = {};

        orientations[group]["label"] = group_options[group]["question"];
        orientations[group]["orientations"][selectedOption] = {
            "label": allOptions[selectedOption]["label"],
            "orientation": allOptions[selectedOption]["orientation"],
        };

        if (allOptions[selectedOption]['complement']) {
            orientations[group]["orientations"][selectedOption]["complement"] = allOptions[selectedOption]["complement"];
        }
    }
}

function getScreeningOrientations() {
    orientations = {};
    getPreScreeningOrientations();

    document.querySelectorAll(".select2Data").forEach((select2) => {
        if (select2.value.length > 0) {
            const selectedOptions = select2.value.split(";");
            selectedOptions.forEach((option) => {
                insertNewOrientation(option.split("-")[0], option.split("-")[1]);
            });
        }
    });

    buildOrientations();
}

function buildOrientations() {
    if (!Object.keys(orientations).length) {
        document.getElementById("orientations").innerHTML = `
            <div class="you-can-donate-blood text-center mx-auto" style="max-width: 750px">
                <h2 class="fw-bolder mb-3">Você pode doar!</h2>
                <p style="line-height: 1.7" class="px-3 mb-4">Com base nas suas respostas e nos critérios do Hemocentro Unicamp, <span class="fs-6 text-red">você está apto para doar sangue</span>. Ajude nessa causa nobre e participe do nosso <span class="fs-6 text-red">grupo no WhatsApp</span> para ficar por dentro das novidades!</p>
                <a href="#" type="button" class="btn btn-red btn-step fw-bolder w-100 mx-w-300 d-block mx-auto" style="color: #fff !important;">VER GRUPO</a>
            </div>
        `;
        document.getElementsByClassName("hands-blood-line")[0].classList.remove("d-none");
        return;
    }

    document.getElementsByClassName("hands-blood-line")[0].classList.add("d-none");

    document.getElementById("orientations").innerHTML = "";
    Object.values(orientations).forEach((orientation) => {
        let html = `
                <div class="overflow-auto">
                    <table class="table"> 
                        <thead>
                            <tr>
                                <th scope="col" colspan="2">${orientation['label']}</th>
                            </tr>
                            <tr>
                                <th scope="col">Resposta</th>
                                <th scope="col" class="text-nowrap">Tempo de Inaptidão</th>
                            </tr>
                        </thead>
                    `;
        html += `<tbody>`;
        Object.values(orientation['orientations']).forEach((obj) => {
            html += `<tr>
                 <td>"${obj['label']}"</td>
                 <td>${obj['orientation']} ${obj['complement'] ? obj['complement'] : ''}</td>
            </tr>`;
        });
        html += `</tbody>`
        html += `</table>
        </div>`
        document.getElementById("orientations").insertAdjacentHTML("beforeend", html);
    });

    document.getElementById("orientations").insertAdjacentHTML("beforeend", ` 
        <p class="text-center px-3 mt-4 mb-5" style="font-size: calc(.9rem + .1vw); line-height: 1.7"><b>Importante:</b> Todas as orientações são baseadas nos <a href="https://www.hemocentro.unicamp.br/perguntas-frequentes/criterios-para-doacao-de-sangue/" target="_blank">critérios para doação de sangue</a> do Hemocentro Unicamp.</p>

        <div class="line-points d-flex justify-content-center mx-auto mb-xl-5 mb-4">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
        </div>

        <h2 class="text-center fs-3 fw-bolder mb-2">Amar faz bem, doar sangue também!</h2>
        <p class="text-center px-3 mt-3 mb-4"> Caso você tenha interesse pela doação, acesse nosso <span class="text-red">grupo no WhatsApp</span> para receber novidades.</p>

        <a href="#" type="button" class="btn btn-red btn-step fw-bolder w-100 mx-w-300 d-block mx-auto" style="color: #fff !important;">VER GRUPO</a>`);
}

function buildNewQuestionByGroup(group) {
    const question = group_options[group]["question"];
    const options = group_options[group]["options"];
    const container = document.getElementById("screeningForm");

    let selectOptions = "";
    Object.keys(options).forEach((key) => {
        const option = options[key];
        selectOptions += `<option value="${group}-${key}">${option["label"]}</option>`
    });

    let newQuestion = `
        <div class="form-group position-relative mb-4">
            <label for="select_${group}" class="form-label mb-2">${question}</label>
            <div class="position-relative">
                <input id="input_${group}" type="hidden" class="getValue select2Data">
                <select id="select_${group}" name="select_${group}" multiple class="form-control select2">
                ${selectOptions}
                </select>
            </div>
        </div>`;

    container.insertAdjacentHTML("beforeend", newQuestion);
}

async function buildAllSelect2() {
    let els = document.getElementsByClassName('select2');

    for (let i = 0; i < els.length; i++) {
        if (els[i].classList.contains('builded') || els[i].id.length < 1) {
            continue;
        }

        $(els[i]).select2({
            dropdownAutoWidth: true,
            width: '100%',
            dropdownParent: $(els[i]).parent(),
            language: {
                noResults: function () {
                    return "Nenhum resultado encontrado";
                }
            },
        });

        $(els[i]).on('change', function (e) {
            let imp = $(e.currentTarget).select2("val").join(';');
            e.currentTarget.parentElement.parentElement.getElementsByClassName('getValue')[0].value = imp;
        });
        els[i].classList.add('builded');
    }
}

function changeCurrentStep(increment) {
    let newStep = currentStep + increment;
    goToStep(newStep, true);
}

function goToStep(step, addToHistory) {
    const steps = document.querySelectorAll('.step');
    if (step < 0 || step >= steps.length) return;

    document.getElementById(`step_${currentStep}`).classList.add("d-none");
    document.getElementById(`step_${step}`).classList.remove("d-none");
    document.getElementById(`step_${step}`).classList.add("step-animation");

    currentStep = step;
    if (addToHistory) history.pushState({ step: currentStep }, `Step ${currentStep}`, `#step_${currentStep}`);
}

