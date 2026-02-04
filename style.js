// Константы для DOM элементов
const fileInput = document.getElementById('fileInput');
const uploadBox = document.getElementById('uploadBox');
const convertBtn = document.getElementById('convertBtn');
const jsonOutput = document.getElementById('jsonOutput');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const lawNumberInput = document.getElementById('lawNumber');
const previewContainer = document.getElementById('previewContainer');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');

// Переменная для хранения данных файла
let fileContent = '';
let parsedQuestions = [];

// Показываем уведомление
function showNotification(message, duration = 3000) {
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Обработчики событий для drag & drop
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0];
        if (isValidFileType(file)) {
            readFile(file);
        } else {
            showNotification('Пожалуйста, загрузите файл формата .docx, .doc или .txt');
        }
    }
});

// Клик по области загрузки
uploadBox.addEventListener('click', () => {
    fileInput.click();
});

// Обработчик выбора файла
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        const file = e.target.files[0];
        if (isValidFileType(file)) {
            readFile(file);
        } else {
            showNotification('Пожалуйста, загрузите файл формата .docx, .doc или .txt');
        }
    }
});

// Проверка типа файла
function isValidFileType(file) {
    const validTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'application/msword', 'text/plain'];
    return validTypes.includes(file.type) || 
           file.name.endsWith('.docx') || 
           file.name.endsWith('.doc') || 
           file.name.endsWith('.txt');
}

// Чтение файла
function readFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        fileContent = e.target.result;
        convertBtn.disabled = false;
        
        // Показываем имя файла
        uploadBox.querySelector('p').textContent = `Загружен файл: ${file.name}`;
        showNotification(`Файл "${file.name}" успешно загружен`);
        
        // Показываем предпросмотр после загрузки
        parseFileContent();
    };
    
    reader.onerror = function() {
        showNotification('Ошибка при чтении файла');
    };
    
    // Для .docx файлов используем TextDecoder для извлечения текста
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Для .docx файлов читаем как ArrayBuffer
        reader.readAsArrayBuffer(file);
    } else {
        // Для .doc и .txt читаем как текст
        reader.readAsText(file);
    }
}

// Парсинг содержимого файла
function parseFileContent() {
    // Если это .docx файл (читался как ArrayBuffer), пытаемся извлечь текст
    if (fileContent instanceof ArrayBuffer) {
        // Для простоты, в реальном приложении нужна более сложная обработка .docx
        // В этом примере мы просто показываем сообщение
        jsonOutput.textContent = 'Для .docx файлов требуется специальная обработка. В данном демо-приложении используйте .txt файлы или вставьте текст напрямую.';
        showNotification('Для .docx файлов рекомендуется использовать .txt формат в этом демо');
        return;
    }
    
    // Разделяем содержимое на строки
    const lines = fileContent.split(/\r?\n/);
    const questions = [];
    let currentQuestion = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Пропускаем пустые строки
        if (!line) continue;
        
        // Если строка заканчивается на "?" - это вопрос
        if (line.endsWith('?')) {
            // Если уже есть текущий вопрос, сохраняем его
            if (currentQuestion && currentQuestion.question) {
                questions.push(currentQuestion);
            }
            
            // Создаем новый вопрос
            currentQuestion = {
                question: line,
                correctAnswer: '',
                incorrectAnswers: []
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
        }
    }
    
    // Добавляем последний вопрос, если он есть
    if (currentQuestion && currentQuestion.question) {
        questions.push(currentQuestion);
    }
    
    parsedQuestions = questions;
    updatePreview();
}

// Обновление предпросмотра тестов
function updatePreview() {
    if (parsedQuestions.length === 0) {
        previewContainer.innerHTML = '<p class="placeholder">Не удалось извлечь вопросы из файла. Проверьте формат файла.</p>';
        return;
    }
    
    let previewHTML = `<p class="placeholder">Найдено вопросов: ${parsedQuestions.length}</p>`;
    
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
}

// Конвертация в JSON
convertBtn.addEventListener('click', () => {
    if (parsedQuestions.length === 0) {
        showNotification('Нет вопросов для конвертации');
        return;
    }
    
    const lawNumber = parseInt(lawNumberInput.value) || 1;
    
    // Создаем массив объектов в требуемом формате
    const jsonData = parsedQuestions.map((q, index) => ({
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
    
    showNotification(`Успешно сконвертировано ${parsedQuestions.length} вопросов`);
});

// Копирование JSON в буфер обмена
copyBtn.addEventListener('click', () => {
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
});

// Скачивание JSON файла
downloadBtn.addEventListener('click', () => {
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
});

// Очистка результатов
clearBtn.addEventListener('click', () => {
    fileContent = '';
    parsedQuestions = [];
    jsonOutput.textContent = 'Загрузите файл и нажмите "Конвертировать в JSON"';
    previewContainer.innerHTML = '<p class="placeholder">Здесь будет показана структура извлеченных тестов</p>';
    
    // Сбрасываем кнопки и поле ввода
    convertBtn.disabled = true;
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    fileInput.value = '';
    uploadBox.querySelector('p').textContent = 'Перетащите файл сюда или нажмите для выбора';
    
    showNotification('Все данные очищены');
});

// Пример текста для тестирования (можно удалить в рабочей версии)
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
Генеральный прокурор`;

// Добавляем возможность вставить пример для демонстрации
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем кнопку для примера (только для демо)
    const demoBtn = document.createElement('button');
    demoBtn.className = 'btn secondary-btn';
    demoBtn.innerHTML = '<i class="fas fa-magic"></i> Загрузить пример';
    demoBtn.style.marginLeft = '15px';
    demoBtn.style.marginTop = '10px';
    
    demoBtn.addEventListener('click', () => {
        fileContent = exampleText;
        convertBtn.disabled = false;
        uploadBox.querySelector('p').textContent = 'Загружен пример файла с тестами';
        showNotification('Загружен пример файла с тестами');
        parseFileContent();
    });
    
    document.querySelector('.upload-section').appendChild(demoBtn);
});