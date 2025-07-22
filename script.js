const questionEl = document.getElementById('question');
const questionCounterEl = document.getElementById('question-counter');
const answerInput = document.getElementById('answer-input');
const nextButton = document.getElementById('next-button');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const dateDisplayEl = document.getElementById('date-display');
const scoreEl = document.getElementById('score');
const resultImage = document.getElementById('result-image');
const resultTableBody = document.querySelector('#result-table tbody');
const reviewButton = document.getElementById('review-button');

let allQuestions = [];
let currentQuizQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let incorrectQuestions = [];

// CSVの1行をパースする関数（引用符内のカンマを考慮）
function parseCsvRow(row) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of row) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current); // 最後の値を追加
    // 各値から前後の空白と引用符を削除
    return values.map(v => v.trim().replace(/^"|"$/g, ''));
}

// CSVファイルを読み込み、クイズの質問を生成する
async function loadAndPrepareQuiz() {
    try {
        const response = await fetch('verb_1.csv');
        const data = await response.text();
        
        const lines = data.trim().replace(/^\uFEFF/, '').split(/\r?\n/);
        const rows = lines.slice(1);
        
        allQuestions = [];
        rows.forEach(row => {
            // 新しいパーサーを使用
            const [verb, meaning, past, ing] = parseCsvRow(row);
            if (verb && past) {
                allQuestions.push({
                    questionText: `${verb} の<span class="form-past">過去形</span>は？`,
                    correctAnswer: past.trim(),
                    verb: verb
                });
            }
            if (verb && ing) {
                allQuestions.push({
                    questionText: `${verb} の<span class="form-ing">進行形</span>は？`,
                    correctAnswer: ing.trim(),
                    verb: verb
                });
            }
        });
        
        startNewGame();
    } catch (error) {
        console.error('CSVファイルの読み込みまたは解析に失敗しました:', error);
        questionEl.textContent = 'クイズデータの読み込みに失敗しました。ファイルを確認してください。';
    }
}

// 新しいゲームを開始する
function startNewGame() {
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 25);
    startQuiz(selectedQuestions);
}

// クイズを開始する
function startQuiz(questions) {
    currentQuizQuestions = questions;
    currentQuestionIndex = 0;
    userAnswers = [];
    incorrectQuestions = [];

    quizContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    nextButton.style.display = 'inline-block';
    reviewButton.style.display = 'none';
    
    if (currentQuizQuestions.length > 0) {
        showQuestion();
    } else {
        questionEl.textContent = '出題する問題がありません。';
        nextButton.style.display = 'none';
    }
}

// 質問を表示する
function showQuestion() {
    const q = currentQuizQuestions[currentQuestionIndex];
    questionCounterEl.textContent = `問題 ${currentQuestionIndex + 1} / ${currentQuizQuestions.length}`;
    questionEl.innerHTML = q.questionText; // textContentからinnerHTMLに変更
    answerInput.value = '';
    answerInput.focus();
    
    // ボタンのテキストを「次へ」に設定
    nextButton.textContent = '次へ';
    // 最後の問題であればボタンのテキストを「答え合わせ」に変更
    if (currentQuestionIndex === currentQuizQuestions.length - 1) {
        nextButton.textContent = '答え合わせ';
    }
}

// ボタンのクリック処理
nextButton.addEventListener('click', () => {
    const userAnswer = answerInput.value.trim();
    userAnswers.push(userAnswer);

    if (userAnswer.toLowerCase() !== currentQuizQuestions[currentQuestionIndex].correctAnswer.toLowerCase()) {
        incorrectQuestions.push(currentQuizQuestions[currentQuestionIndex]);
    }

    currentQuestionIndex++;

    if (currentQuestionIndex < currentQuizQuestions.length) {
        showQuestion();
    } else {
        showResult();
    }
});

// 結果を表示する
function showResult() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';

    // 日付を表示
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // 月は0から始まるため+1
    const dd = String(today.getDate()).padStart(2, '0');
    dateDisplayEl.textContent = `${yyyy}年${mm}月${dd}日`;

    const correctCount = currentQuizQuestions.length - incorrectQuestions.length;
    const accuracy = Math.round((correctCount / currentQuizQuestions.length) * 100);

    scoreEl.textContent = `正答率: ${accuracy}% (${correctCount} / ${currentQuizQuestions.length})`;

    if (accuracy === 100) {
        resultImage.src = 'https://via.placeholder.com/150/4CAF50/FFFFFF?text=Perfect!';
    } else if (accuracy >= 80) {
        resultImage.src = 'https://via.placeholder.com/150/8BC34A/FFFFFF?text=Great!';
    } else if (accuracy >= 50) {
        resultImage.src = 'https://via.placeholder.com/150/FFC107/FFFFFF?text=Good';
    } else if (accuracy >= 20) {
        resultImage.src = 'https://via.placeholder.com/150/FF9800/FFFFFF?text=Not+Bad';
    } else {
        resultImage.src = 'https://via.placeholder.com/150/F44336/FFFFFF?text=Try+Again';
    }
    
    resultTableBody.innerHTML = '';
    currentQuizQuestions.forEach((q, index) => {
        const row = document.createElement('tr');
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
        
        row.innerHTML = `
            <td>${q.questionText}</td>
            <td>${userAnswer}</td>
            <td>${q.correctAnswer}</td>
        `;
        
        if (!isCorrect) {
            row.style.backgroundColor = '#ffdddd';
        }
        
        resultTableBody.appendChild(row);
    });

    if (incorrectQuestions.length > 0) {
        reviewButton.style.display = 'inline-block';
    }
    else {
        reviewButton.style.display = 'none';
    }
}

// 「復習」ボタンのクリック処理
reviewButton.addEventListener('click', () => {
    startQuiz(incorrectQuestions);
});

// ページ読み込み時にクイズを開始
loadAndPrepareQuiz();