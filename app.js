// Logique commune aux trois pages. Chaque page définit window.PAGE avant de charger ce fichier.

// Pour être prévenu du OUI : adresse du formulaire Formspree. Vide = désactivé.
const NOTIFY_URL = 'https://formspree.io/f/mdeavnoq';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const card = document.querySelector('.card');
const titleEl = document.querySelector('h1');

// --- Décor -----------------------------------------------------------------

// Petits symboles qui montent doucement derrière la carte.
const spawnFloaters = () => {
    if (reduceMotion) return;
    const items = PAGE.floaters || [];
    for (let i = 0; i < 14; i++) {
        const el = document.createElement('span');
        el.className = 'float';
        el.textContent = items[i % items.length];
        el.style.left = Math.random() * 100 + 'vw';
        el.style.fontSize = 1 + Math.random() * 1.4 + 'rem';
        el.style.animationDuration = 14 + Math.random() * 14 + 's';
        el.style.animationDelay = -Math.random() * 20 + 's';
        document.body.appendChild(el);
    }
};

// Pluie de symboles après le OUI.
const rain = () => {
    if (reduceMotion) return;
    const items = PAGE.rain || PAGE.floaters || [];
    for (let i = 0; i < 45; i++) {
        const el = document.createElement('span');
        el.className = 'confetti';
        el.textContent = items[i % items.length];
        el.style.left = Math.random() * 100 + 'vw';
        el.style.animationDuration = 2.2 + Math.random() * 3 + 's';
        el.style.animationDelay = Math.random() * 1.6 + 's';
        document.body.appendChild(el);
    }
};

// Les mots du titre apparaissent un par un.
const revealWords = (el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach((w, i) => {
        const span = document.createElement('span');
        span.className = 'word';
        span.setAttribute('aria-hidden', 'true');
        span.style.animationDelay = 0.35 + i * 0.11 + 's';
        span.textContent = w;
        el.appendChild(span);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
};

// Remplace le contenu de la carte par l'écran de réponse.
const showResult = ({ emoji, img, title, text }) => {
    card.replaceChildren();
    document.getElementById('noBtn')?.remove();
    if (img) {
        const image = document.createElement('img');
        image.className = 'hero';
        image.src = img;
        image.alt = '';
        card.appendChild(image);
    } else {
        const e = document.createElement('div');
        e.className = 'big-emoji';
        e.setAttribute('aria-hidden', 'true');
        e.textContent = emoji;
        card.appendChild(e);
    }
    const h = document.createElement('h1');
    h.textContent = title;
    const p = document.createElement('p');
    p.className = 'script';
    p.textContent = text;
    card.append(h, p);
    rain();
};

const notify = (message, extra = {}) => {
    if (!NOTIFY_URL) return;
    fetch(NOTIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ message, ...extra })
    }).catch(() => {});
};

spawnFloaters();
if (titleEl) revealWords(titleEl);

// --- Page « question » : OUI / NON ----------------------------------------

const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');

if (yesBtn && noBtn) {
    const overlaps = (a, b, margin) =>
        a.left < b.right + margin && a.right > b.left - margin &&
        a.top < b.bottom + margin && a.bottom > b.top - margin;

    const noLabels = PAGE.noLabels || ['Non'];
    let dodges = 0;
    let placeholder = null;

    const moveButton = () => {
        dodges++;

        // Au premier esquive, on garde la place du NON pour que le OUI ne bouge pas.
        if (!placeholder) {
            placeholder = document.createElement('span');
            placeholder.style.width = noBtn.offsetWidth + 'px';
            placeholder.style.height = noBtn.offsetHeight + 'px';
            noBtn.before(placeholder);
            // Hors de la carte : son flou crée un repère qui fausserait position: fixed.
            document.body.appendChild(noBtn);
        }

        // Le NON change de texte et rétrécit, le OUI grossit.
        noBtn.textContent = noLabels[(dodges - 1) % noLabels.length];
        noBtn.style.fontSize = Math.max(0.8, 1.1 - dodges * 0.03) + 'rem';
        yesBtn.style.fontSize = Math.min(1.7, 1.1 + dodges * 0.05) + 'rem';
        noBtn.style.position = 'fixed';

        const pad = 16;
        const w = noBtn.offsetWidth;
        const h = noBtn.offsetHeight;
        const maxX = Math.max(pad, window.innerWidth - w - pad);
        const maxY = Math.max(pad, window.innerHeight - h - pad);
        const avoid = [yesBtn, titleEl].map(el => el.getBoundingClientRect());

        let x, y;
        for (let i = 0; i < 60; i++) {
            x = pad + Math.random() * (maxX - pad);
            y = pad + Math.random() * (maxY - pad);
            const box = { left: x, top: y, right: x + w, bottom: y + h };
            if (!avoid.some(r => overlaps(box, r, 12))) break;
        }
        noBtn.style.left = x + 'px';
        noBtn.style.top = y + 'px';
    };

    // Souris, clavier (Tab), clic de secours et toucher : le NON s'échappe partout.
    noBtn.addEventListener('mouseover', moveButton);
    noBtn.addEventListener('focus', moveButton);
    noBtn.addEventListener('click', (e) => { e.preventDefault(); moveButton(); });
    noBtn.addEventListener('touchstart', (e) => { e.preventDefault(); moveButton(); }, { passive: false });

    yesBtn.addEventListener('click', () => {
        showResult(PAGE.yes);
        notify(PAGE.notify, { refus_esquives: dodges });
    });
}

// --- Page « cadeau » : un bouton pour ouvrir -------------------------------

const openBtn = document.getElementById('openBtn');
if (openBtn) {
    openBtn.addEventListener('click', () => showResult(PAGE.yes));
}
