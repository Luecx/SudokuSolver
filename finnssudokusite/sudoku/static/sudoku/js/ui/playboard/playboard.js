import {createBoard} from "../board/board.js";
import {createSelectionConfig} from "../board/board_selectionConfig.js";

const div = document.querySelector('.board-container');

let board = createBoard(div);


document.addEventListener("DOMContentLoaded", function () {

    board.initBoard();
    board.setSelection(
        createSelectionConfig({
            target: 'cells',
            mode: 'multiple',
            showVisual: true,
            preserveOnModifier: null,
        })
    );
    const jsonData = window.puzzle_data;
    if (jsonData) {
        board.loadBoard(jsonData);
    }


    // Timer functionality
    let seconds = 0;
    const timerElement = document.getElementById('timer');

    function formatTime(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `0${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    if (timerElement) {
        setInterval(() => {
            seconds++;
            timerElement.textContent = formatTime(seconds);
        }, 1000);
    }

    // Font size control functionality
    let currentFontSize = 1.8;
    let currentSvgSize = 28;
    const gridButtons = document.querySelectorAll('.button-grid .btn-square');
    const btnPlus = document.getElementById('btn-plus');
    const btnMinus = document.getElementById('btn-minus');
    const btnColorMode = document.getElementById('btn-colorMode');
    const svgIcon = btnColorMode.querySelector('img');

    function updateFontSize() {
        gridButtons.forEach(btn => {
            btn.style.fontSize = currentFontSize + 'rem';
        });
        if (svgIcon) {
            svgIcon.style.width = currentSvgSize + 'px';
            svgIcon.style.height = currentSvgSize + 'px';
        }
    }

    if (btnPlus) {
        btnPlus.addEventListener('click', () => {
            currentFontSize += 0.2;
            currentSvgSize += 3;
            updateFontSize();
        });
    }

    if (btnMinus) {
        btnMinus.addEventListener('click', () => {
            currentFontSize = Math.max(0.3, currentFontSize - 0.2);
            currentSvgSize = Math.max(1, currentSvgSize - 3);
            updateFontSize();
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === '+' || event.key === 'Add') {
            btnPlus.click();
            event.preventDefault();
        }
        if (event.key === '-' || event.key === 'Subtract') {
            btnMinus.click();
            event.preventDefault();
        }
    });

    // Eye icon toggle functionality
    const eyeIcons = ['bi-eye', 'bi-eye-fill', 'bi-eye-slash-fill'];
    const btnEye = document.getElementById('btn-toggleEye');
    if (btnEye) {
        const iconElem = btnEye.querySelector('i');
        let iconIndex = 0;

        btnEye.addEventListener('click', function () {
            eyeIcons.forEach(cls => iconElem.classList.remove(cls));
            iconIndex = (iconIndex + 1) % eyeIcons.length;
            iconElem.classList.add(eyeIcons[iconIndex]);
        });
    }

    // Eingabe Modus (Number, Top, Center, Color)
    const btnNumberMode = document.getElementById('btn-numberMode');
    const btnTopMode = document.getElementById('btn-topMode');
    const btnCenterMode = document.getElementById('btn-centerMode');

    const theModeButtons = [btnNumberMode, btnTopMode, btnCenterMode, btnColorMode];
    const TheNumberButtons = Array.from(document.getElementsByClassName("IsBtnNumber"));
    const btnOne = document.getElementById('btn-one');
    const btnTwo = document.getElementById('btn-two');
    const btnThree = document.getElementById('btn-three');
    const btnFour = document.getElementById('btn-four');
    const btnFive = document.getElementById('btn-five');
    const btnSix = document.getElementById('btn-six');
    const btnSeven = document.getElementById('btn-seven');
    const btnEight = document.getElementById('btn-eight');
    const btnNine = document.getElementById('btn-nine');

    const theBGColors = [
        'rgb(255,2,0)',
        'rgb(0,216,2)',
        'rgb(1,0,255)',
        'rgb(255,169,0)',
        'rgb(164,122,87)',
        'rgb(170,0,255)',
        'rgb(237,255,0)',
        'rgb(0,215,255)',
        'rgb(255,0,170)'
    ];
    const theTextColors = [
        '#000000',
        '#000000',
        '#ffffff',
        '#000000',
        '#ffffff',
        '#ffffff',
        '#000000',
        '#000000',
        '#000000'
    ];

    function activateButton(activeBtn) {
        theModeButtons.forEach(btn => btn.classList.remove('btn-active'));
        activeBtn.classList.add('btn-active');
        updateBtnColorBackground();
    }

    function updateBtnColorBackground() {

        if (btnColorMode.classList.contains('btn-active')) {
            TheNumberButtons.forEach((btn, index) => {
                btn.style.backgroundColor = theBGColors[index];
                btn.style.color = theTextColors[index];
            });
        } else {
            TheNumberButtons.forEach((btn, index) => {
                btn.style.backgroundColor = 'white';
                btn.style.color = 'black';
            });
        }
    }

    // Initial: Zahl-Modus aktiv
    activateButton(btnNumberMode);

    // Klick Events
    btnNumberMode.addEventListener('click', () => activateButton(btnNumberMode));
    btnTopMode.addEventListener('click', () => activateButton(btnTopMode));
    btnCenterMode.addEventListener('click', () => activateButton(btnCenterMode));
    btnColorMode.addEventListener('click', () => activateButton(btnColorMode));

    // Space-Taste zum Moduswechsel
    function getActiveIndex() {
        return theModeButtons.findIndex(btn => btn.classList.contains('btn-active'));
    }

    document.addEventListener('keydown', function (event) {
        if (event.code === 'Space') {
            event.preventDefault();
            let currentIndex = getActiveIndex();
            let nextIndex = (currentIndex + 1) % theModeButtons.length;
            activateButton(theModeButtons[nextIndex]);
        }
    });

    // Theme select functionality
    const backgrounds = {
        stone: "url('/static/sudoku/img/playboard/stone.jpg')",
        glow: "url('/static/sudoku/img/playboard/glow.jpg')",
        zement: "url('/static/sudoku/img/playboard/zement.jpg')",
        wood: "url('/static/sudoku/img/playboard/wood.jpg')"
    };

    const themeSelect = document.getElementById('themeSelect');

    function updateTheme() {
        const value = themeSelect.value;
        const bg = backgrounds[value];

        document.body.style.backgroundImage = bg || "none";

        // Alle block-bg anpassen
        document.querySelectorAll('.block-bg').forEach(blockBg => {
            blockBg.classList.toggle('rounded', value === 'classic');
            blockBg.classList.toggle('my_white_box', value === 'classic');
            blockBg.classList.toggle('border', value === 'classic');
        });

        // Alle block-parts anpassen
        document.querySelectorAll('.block-part').forEach(part => {
            const type = part.getAttribute('data-block');
            part.classList.toggle('block-top', value !== 'classic' && type === 'top');
            part.classList.toggle('block-middle', value !== 'classic' && type === 'middle');
            part.classList.toggle('block-bottom', value !== 'classic' && type === 'bottom');
        });
    }

    if (themeSelect) {
        themeSelect.addEventListener('change', updateTheme);
        // Initialisieren beim Laden der Seite
        window.addEventListener('DOMContentLoaded', updateTheme);
    }

});
