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
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    if (timerElement) {
        setInterval(() => {
            seconds++;
            timerElement.textContent = formatTime(seconds);
        }, 1000);
    }

    // Font size control functionality
    let currentFontSize = 1.8;
    const gridButtons = document.querySelectorAll('.button-grid .btn-square');
    const btnPlus = document.getElementById('btn-plus');
    const btnMinus = document.getElementById('btn-minus');

    function updateFontSize() {
        gridButtons.forEach(btn => {
            btn.style.fontSize = currentFontSize + 'rem';
        });
    }

    if (btnPlus) {
        btnPlus.addEventListener('click', () => {
            currentFontSize += 0.2;
            updateFontSize();
        });
    }

    if (btnMinus) {
        btnMinus.addEventListener('click', () => {
            currentFontSize = Math.max(0.3, currentFontSize - 0.2);
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
    const btnColorMode = document.getElementById('btn-colorMode');

    const theModeButtons = [btnNumberMode, btnTopMode, btnCenterMode, btnColorMode];
    const TheColorBtns = Array.from(document.getElementsByClassName("IsBtnNumber"));
    const btnOne = document.getElementById('btn-one');
    const btnTwo = document.getElementById('btn-two');
    const btnThree = document.getElementById('btn-three');
    const btnFour = document.getElementById('btn-four');
    const btnFive = document.getElementById('btn-five');
    const btnSix = document.getElementById('btn-six');
    const btnSeven = document.getElementById('btn-seven');
    const btnEight = document.getElementById('btn-eight');
    const btnNine = document.getElementById('btn-nine');

    const theBtnColors = [
        'rgb(237,255,0)',
        'rgb(0,215,255)',
        'rgb(255,0,170)',
        'rgb(255,169,0)',
        'rgb(164,122,87)',
        'rgb(170,0,255)',
        'rgb(255,2,0)',
        'rgb(0,216,2)',
        'rgb(1,0,255)'
    ];

    function activateButton(activeBtn) {
        theModeButtons.forEach(btn => btn.classList.remove('btn-active'));
        activeBtn.classList.add('btn-active');
        updateBtnColorBackground();
    }

    function updateBtnColorBackground() {
        if (btnColorMode.classList.contains('btn-active')) {
            TheColorBtns.forEach((btn, index) => {
                btn.style.backgroundColor = theBtnColors[index];
            });
        } else {
            TheColorBtns.forEach(btn => {
                btn.style.backgroundColor = "white";
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
    if (themeSelect) {
        themeSelect.addEventListener('change', function () {
            const bg = backgrounds[this.value];
            document.body.style.backgroundImage = bg || "none";
            if (bg) {
                document.getElementById("TopBlockL").classList.add("block-top");
                document.getElementById("TopBlockR").classList.add("block-top");
                document.getElementById("MiddleBlockL").classList.add("block-middle");
                document.getElementById("MiddleBlockR").classList.add("block-middle");
                document.getElementById("BottomBlockL").classList.add("block-bottom");
                document.getElementById("BottomBlockR").classList.add("block-bottom");
            } else {
                document.getElementById("TopBlockL").classList.remove("block-top");
                document.getElementById("TopBlockR").classList.remove("block-top");
                document.getElementById("MiddleBlockL").classList.remove("block-middle");
                document.getElementById("MiddleBlockR").classList.remove("block-middle");
                document.getElementById("BottomBlockL").classList.remove("block-bottom");
                document.getElementById("BottomBlockR").classList.remove("block-bottom");
            }

            document.querySelectorAll('.block-bg').forEach(blockBg => {
                if (bg) {
                    blockBg.classList.remove('rounded', 'whitebox', 'border');
                } else {
                    blockBg.classList.add('rounded', 'whitebox', 'border');
                }
            });
        });
    }
});
