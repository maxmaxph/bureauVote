function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

const firebaseConfig = {
    apiKey: "AIzaSyBdQDGnVTvnjzpLvLFXpVjWRdkR4FoM2Fs",
    authDomain: "electionsroucourt.firebaseapp.com",
    projectId: "electionsroucourt",
    storageBucket: "electionsroucourt.appspot.com",
    messagingSenderId: "1064017538957",
    appId: "1:1064017538957:web:c1d95096e84223d5ca57c4",
    measurementId: "G-EFF9902C71",
    databaseURL: "https://electionsroucourt-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    loadSlots();

    document.querySelector('#slots-june-30, #slots-july-7').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const id = e.target.dataset.id;
            const action = e.target.dataset.action;
            const input = document.querySelector(`#participant-${id}`);
            const participant = input ? input.value : '';

            console.log(`Bouton cliqué : ID=${id}, Action=${action}, Participant=${participant}`);

            if (action === 'register' && participant) {
                registerParticipant(id, participant);
            } else if (action === 'reset') {
                showModal(id);
            } else if (action === 'register') {
                alert('Veuillez entrer un nom.');
            }
        }
    });

    document.getElementById('confirmReset').addEventListener('click', () => {
        const id = document.getElementById('confirmReset').dataset.id;
        resetSlot(id);
        closeModal();
    });

    document.getElementById('cancelReset').addEventListener('click', closeModal);
    document.querySelector('.close').addEventListener('click', closeModal);

    // Ajouter un événement pour le bouton d'exportation en PDF
    document.getElementById('exportPDF').addEventListener('click', generatePDF);
});

function formatDate(dateString) {
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}


function loadSlots() {
    console.log('Chargement des créneaux...');
    database.ref('slots').on('value', (snapshot) => {
        const slotsJune30 = document.querySelector('#slots-june-30');
        const slotsJuly7 = document.querySelector('#slots-july-7');
        const recapContent = document.querySelector('#recapContent');
        const data = snapshot.val();
        console.log('Données récupérées:', data);

        slotsJune30.innerHTML = '<h2>30 Juin 2024</h2>';
        slotsJuly7.innerHTML = '<h2>7 Juillet 2024</h2>';
        recapContent.innerHTML = '';
        
        const slotsByDate = {
            "2024-06-30": [],
            "2024-07-07": []
        };

        for (let id in data) {
            const slot = data[id];
            if (slotsByDate[slot.date]) {
                slotsByDate[slot.date].push({ id, ...slot });
            } else {
                console.warn(`Créneau avec une date inconnue : ${slot.date}`);
            }
        }

        for (let date in slotsByDate) {
            slotsByDate[date].sort((a, b) => parseTime(a.timeslot) - parseTime(b.timeslot));
        }

        for (let date in slotsByDate) {
            slotsByDate[date].forEach(slot => {
                const formattedDate = formatDate(slot.date);
                const participantAttr = slot.participant ? `data-participant="${slot.participant}"` : '';
                const slotHTML = `
                    <div class="slot-row" ${participantAttr}>
                        <div class="date">Date: ${formattedDate}</div>
                        <div>Poste: ${slot.position}</div>
                        <div>Créneau: ${slot.timeslot}</div>
                        <div class="name">Poste attribué à: ${slot.participant || ''}</div>
                    </div>
                    <div class="slot-row full-width">
                        ${!slot.participant ? `
                        <div class="input-container"><input type="text" id="participant-${slot.id}" placeholder="Nom et Prénom" /></div>
                        <div class="button-container"><button data-id="${slot.id}" data-action="register">Inscrire</button></div>
                        ` : ''}
                        ${slot.participant ? `
                        <div class="button-container"><button data-id="${slot.id}" data-action="reset">Réinitialiser</button></div>
                        ` : ''}
                    </div>
                `;

                if (slot.date === "2024-06-30") {
                    slotsJune30.innerHTML += slotHTML;
                    console.log(`Ajouté au 30 juin : ${slotHTML}`);
                } else if (slot.date === "2024-07-07") {
                    slotsJuly7.innerHTML += slotHTML;
                    console.log(`Ajouté au 7 juillet : ${slotHTML}`);
                }

                if (slot.participant) {
                    recapContent.innerHTML += `
                        <div class="recap-row">
                            <div class="date">Date: <span class="bold">${formattedDate}</span></div>
                            <div class="position">Poste: ${slot.position}</div>
                            <div class="timeslot">Créneau: ${slot.timeslot}</div>
                            <div class="name">Poste attribué à: <span class="bold">${slot.participant}</span></div>
                            <br>
                        </div>
                    `;
                    console.log(`Ajouté au récap : ${slot.participant}`);
                }
            });
        }

        // Ajoutez des logs pour vérifier l'attachement des événements
        console.log('Événements ajoutés pour les créneaux de juin et juillet.');
        document.querySelectorAll('.button-container button').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const action = e.target.dataset.action;
                const input = document.querySelector(`#participant-${id}`);
                const participant = input ? input.value : '';

                console.log(`Bouton cliqué (ajouté dynamiquement) : ID=${id}, Action=${action}, Participant=${participant}`);

                if (action === 'register' && participant) {
                    registerParticipant(id, participant);
                } else if (action === 'reset') {
                    showModal(id);
                } else if (action === 'register') {
                    alert('Veuillez entrer un nom.');
                }
            });
        });
    });
}

function registerParticipant(id, participant) {
    console.log(`Inscription du participant : ID=${id}, Nom=${participant}`);
    database.ref('slots/' + id).update({
        participant: participant
    }).then(() => {
        console.log('Inscription réussie');
        loadSlots();
    }).catch((error) => {
        console.error('Erreur lors de l\'inscription:', error);
    });
}

function resetSlot(id) {
    console.log(`Réinitialisation du créneau : ID=${id}`);
    database.ref('slots/' + id).update({
        participant: null
    }).then(() => {
        console.log('Réinitialisation réussie');
        loadSlots();
    }).catch((error) => {
        console.error('Erreur lors de la réinitialisation:', error);
    });
}

function showModal(id) {
    const modal = document.getElementById('resetModal');
    document.getElementById('confirmReset').dataset.id = id;
    modal.querySelector('p').innerText = "Voulez-vous vraiment réinitialiser ce créneau ?";
    modal.style.display = "block";
}


function closeModal() {
    const modal = document.getElementById('resetModal');
    modal.style.display = "none";
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Récapitulatif des postes pourvus", 10, y);
    y += 10;

    const recapRows = Array.from(document.querySelectorAll('.recap-row'));
    const groupedByDate = {};

    recapRows.forEach(row => {
        const dateElement = row.querySelector('.date');
        const date = dateElement ? dateElement.innerText.split(': ')[1] : '';
        if (!groupedByDate[date]) {
            groupedByDate[date] = [];
        }
        groupedByDate[date].push(row);
    });

    Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b)).forEach(date => {
        const rows = groupedByDate[date];
        rows.sort((a, b) => {
            const timeA = parseTime(a.querySelector('.timeslot').innerText.split(': ')[1]);
            const timeB = parseTime(b.querySelector('.timeslot').innerText.split(': ')[1]);
            return timeA - timeB;
        });
        doc.setTextColor(0, 0, 255); // Bleu
        doc.setFont('helvetica', 'bold');
        doc.text(`Date: ${date}`, 10, y);
        doc.setFontSize(14);
        y += 10;

        rows.forEach(row => {
            const positionElement = row.querySelector('.position');
            const timeslotElement = row.querySelector('.timeslot');
            const nameElement = row.querySelector('.name');

            const position = positionElement ? positionElement.innerText : '';
            const timeslot = timeslotElement ? timeslotElement.innerText : '';
            const name = nameElement ? nameElement.innerText : '';

            if (y >= doc.internal.pageSize.getHeight() - 20) { // Ajustez le seuil selon vos besoins
                doc.addPage(); // Insérer une nouvelle page si on est proche de la marge inférieure
                y = 10; // Réinitialiser y pour la nouvelle page
            }
            doc.setTextColor(0, 0, 0); 
            doc.setFont('helvetica', 'bold');
            doc.text(position, 10, y);
            y += 10;
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text(timeslot, 10, y);
            y += 10;
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text(name, 10, y);
            y += 20; // Espacement entre les entrées
        });

        y += 10; // Ajouter un espace supplémentaire entre les dates
    });

    doc.save('recapitulatif_postes.pdf');
}

function parseTime(timeslot) {
    const [hours, minutes] = timeslot.split('h').map(Number);
    return new Date(0, 0, 0, hours, minutes);
}
