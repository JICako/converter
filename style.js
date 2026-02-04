// Константы для DOM элементов
const textInput = document.getElementById('textInput');
const convertBtn = document.getElementById('convertBtn');
const jsonOutput = document.getElementById('jsonOutput');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const clearInputBtn = document.getElementById('clearInputBtn');
const loadExampleBtn = document.getElementById('loadExampleBtn');
const lawNumberInput = document.getElementById('lawNumber');
const previewContainer = document.getElementById('previewContainer');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const totalQuestionsEl = document.getElementById('totalQuestions');
const correctAnswersEl = document.getElementById('correctAnswers');
const incorrectAnswersEl = document.getElementById('incorrectAnswers');

// Переменная для хранения распарсенных вопросов
let parsedQuestions = [];

// Пример текста для тестирования
const exampleText = `Как называется основной закон государства?
Конституция
Указ
Постановление
Приказ
Закон

Сколько ветвей власти в демократическом государстве?
Три
Одна
Две
Четыре
Пять

Кто является главой государства в Российской Федерации?
Президент
Премьер-министр
Председатель Госдумы
Председатель Совета Федерации
Генеральный прокурор

Что такое правовое государство?
Государство, где верховенствует закон
Государство с сильной армией
Государство с монархической формой правления
Государство с плановой экономикой
Государство без конституции

Какой орган принимает законы в РФ?
Государственная Дума
Правительство
Конституционный суд
Верховный суд
Прокуратура`;

// Показываем уведомление
function showNotification(message, duration = 3000) {
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Парсинг текста с вопросами
function parseText(text) {
    // Разделяем содержимое на строки
    const lines = text.split(/\r?\n/);
    const questions = [];
    let currentQuestion = null;
    let lineNumber = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        lineNumber++;
        
        // Пропускаем пустые строки
        if (!line) continue;
        
        // Если строка заканчивается на "?" - это вопрос
        if (line.endsWith('?')) {
            // Если уже есть текущий вопрос, сохраняем его (если он полный)
            if (currentQuestion && currentQuestion.question) {
                // Проверяем, что у вопроса есть все необходимые ответы
                if (currentQuestion.correctAnswer && currentQuestion.incorrectAnswers.length === 4) {
                    questions.push(currentQuestion);
                } else {
                    console.warn(`Вопрос "${currentQuestion.question}" пропущен - не хватает ответов`);
                }
            }
            
            // Создаем новый вопрос
            currentQuestion = {
                question: line,
                correctAnswer: '',
                incorrectAnswers: [],
                lineNumber: lineNumber
            };
        } 
        // Если у нас есть текущий вопрос и это не вопрос
        else if (currentQuestion) {
            // Если правильный ответ еще не задан
            if (!currentQuestion.correctAnswer) {
                currentQuestion.correctAnswer = line;
            } 
            // Иначе добавляем неправильный ответ (максимум 4)
            else if (currentQuestion.incorrectAnswers.length < 4) {
                currentQuestion.incorrectAnswers.push(line);
            }
            // Если больше 4 неправильных ответов - игнорируем
        }
        // Если строка не является вопросом и нет текущего вопроса, пропускаем
    }
    
    // Добавляем последний вопрос, если он есть и полный
    if (currentQuestion && currentQuestion.question && currentQuestion.correctAnswer && currentQuestion.incorrectAnswers.length === 4) {
        questions.push(currentQuestion);
    } else if (currentQuestion && currentQuestion.question) {
        console.warn(`Последний вопрос "${currentQuestion.question}" пропущен - не хватает ответов`);
    }
    
    parsedQuestions = questions;
    return questions;
}

// Обновление статистики
function updateStats() {
    const totalQuestions = parsedQuestions.length;
    const totalCorrect = parsedQuestions.length; // По одному правильному на вопрос
    const totalIncorrect = parsedQuestions.length * 4; // По 4 неправильных на вопрос
    
    totalQuestionsEl.textContent = totalQuestions;
    correctAnswersEl.textContent = totalCorrect;
    incorrectAnswersEl.textContent = totalIncorrect;
}

// Обновление предпросмотра тестов
function updatePreview() {
    if (parsedQuestions.length === 0) {
        previewContainer.innerHTML = '<p class="placeholder">Не удалось извлечь вопросы из текста. Проверьте формат текста.</p>';
        return;
    }
    
    let previewHTML = '';
    
    // Показываем первые 3 вопроса для предпросмотра
    const previewCount = Math.min(parsedQuestions.length, 3);
    
    for (let i = 0; i < previewCount; i++) {
        const q = parsedQuestions[i];
        previewHTML += `
            <div class="question-preview">
                <h4>Вопрос ${i+1}: ${q.question}</h4>
                <div class="answers-preview">
                    <div class="answer correct-answer">✓ ${q.correctAnswer}</div>
                    ${q.incorrectAnswers.map(answer => `<div class="answer incorrect-answer">✗ ${answer}</div>`).join('')}
                </div>
            </div>
        `;
    }
    
    if (parsedQuestions.length > 3) {
        previewHTML += `<p class="placeholder">... и еще ${parsedQuestions.length - 3} вопросов</p>`;
    }
    
    previewContainer.innerHTML = previewHTML;
    updateStats();
}

// Конвертация в JSON
function convertToJSON() {
    const inputText = textInput.value.trim();
    
    if (!inputText) {
        showNotification('Введите текст с тестами');
        return;
    }
    
    const questions = parseText(inputText);
    
    if (questions.length === 0) {
        jsonOutput.textContent = 'Не удалось найти вопросы в указанном формате. Проверьте, что текст соответствует шаблону.';
        copyBtn.disabled = true;
        downloadBtn.disabled = true;
        showNotification('Не удалось найти вопросы в указанном формате');
        return;
    }
    
    const lawNumber = parseInt(lawNumberInput.value) || 1;
    
    // Создаем массив объектов в требуемом формате
    const jsonData = questions.map((q, index) => ({
        law: lawNumber + index, // Увеличиваем номер для каждого вопроса
        question: q.question,
        correctAnswer: q.correctAnswer,
        incorrectAnswers: q.incorrectAnswers
    }));
    
    // Форматируем JSON с отступами
    const jsonString = JSON.stringify(jsonData, null, 2);
    jsonOutput.textContent = jsonString;
    
    // Активируем кнопки копирования и скачивания
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
    
    showNotification(`Успешно сконвертировано ${questions.length} вопросов`);
    updatePreview();
}

// Копирование JSON в буфер обмена
function copyToClipboard() {
    const jsonText = jsonOutput.textContent;
    
    // Используем Clipboard API
    navigator.clipboard.writeText(jsonText)
        .then(() => {
            showNotification('JSON скопирован в буфер обмена');
        })
        .catch(err => {
            console.error('Ошибка при копировании: ', err);
            showNotification('Не удалось скопировать JSON');
        });
}

// Скачивание JSON файла
function downloadJSON() {
    const jsonText = jsonOutput.textContent;
    const lawNumber = lawNumberInput.value || '1';
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Создаем временную ссылку для скачивания
    const a = document.createElement('a');
    a.href = url;
    a.download = `law_${lawNumber}_tests.json`;
    document.body.appendChild(a);
    a.click();
    
    // Очищаем
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    
    showNotification('JSON файл успешно скачан');
}

// Очистка всего
function clearAll() {
    textInput.value = '';
    parsedQuestions = [];
    jsonOutput.textContent = 'Вставьте текст с тестами выше и нажмите "Конвертировать в JSON"';
    previewContainer.innerHTML = '<p class="placeholder">Здесь будет показана структура извлеченных тестов после конвертации</p>';
    
    // Сбрасываем кнопки
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    
    // Сбрасываем статистику
    totalQuestionsEl.textContent = '0';
    correctAnswersEl.textContent = '0';
    incorrectAnswersEl.textContent = '0';
    
    showNotification('Все данные очищены');
}

// Очистка только поля ввода
function clearInput() {
    textInput.value = '';
    textInput.focus();
    showNotification('Поле ввода очищено');
}

// Загрузка примера
function loadExample() {
    textInput.value = exampleText;
    showNotification('Загружен пример текста с тестами');
    textInput.focus();
}

// Автоматическая проверка и предпросмотр при вводе
let debounceTimer;
textInput.addEventListener('input', () => {
    // Очищаем предыдущий таймер
    clearTimeout(debounceTimer);
    
    // Устанавливаем новый таймер для задержки
    debounceTimer = setTimeout(() => {
        const inputText = textInput.value.trim();
        if (inputText) {
            parseText(inputText);
            updatePreview();
        } else {
            previewContainer.innerHTML = '<p class="placeholder">Здесь будет показана структура извлеченных тестов после конвертации</p>';
            totalQuestionsEl.textContent = '0';
            correctAnswersEl.textContent = '0';
            incorrectAnswersEl.textContent = '0';
        }
    }, 500); // Задержка 500 мс
});

// Обработчики событий
convertBtn.addEventListener('click', convertToJSON);
copyBtn.addEventListener('click', copyToClipboard);
downloadBtn.addEventListener('click', downloadJSON);
clearAllBtn.addEventListener('click', clearAll);
clearInputBtn.addEventListener('click', clearInput);
loadExampleBtn.addEventListener('click', loadExample);

// Автоматическая загрузка примера при первом открытии
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем пример для демонстрации
    loadExample();
    
    // Добавляем обработчик клавиш для поля ввода (Ctrl+Enter для конвертации)
    textInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            convertToJSON();
        }
    });
    
    // Фокус на поле ввода
    textInput.focus();
    
    showNotification('Добро пожаловать! Загружен пример текста. Введите свой текст или отредактируйте пример.');
});